import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ReEnrolmentRequest,
  ReEnrolmentStatus,
} from '../entities/re-enrolment-request.entity';
import {
  ReEnrolmentLine,
  EnrolmentAction,
  EnrolmentLineStatus,
} from '../entities/re-enrolment-line.entity';
import { AcademicPeriod } from '../entities/academic-period.entity';
import { PeriodAvailableCourse } from '../entities/period-available-course.entity';
import {
  CreateReEnrolmentDto,
  ReEnrolmentCourseDto,
} from '../dto/create-re-enrolment.dto';
import { AuditService } from '../../sync/services/audit.service';
import { OutboxService } from '../../sync/services/outbox.service';
import { MoodleClientService } from '../../moodle-integration/moodle-client.service';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';

@Injectable()
export class ReEnrolmentService {
  private readonly logger = new Logger(ReEnrolmentService.name);

  constructor(
    @InjectRepository(ReEnrolmentRequest)
    private readonly requestRepository: Repository<ReEnrolmentRequest>,
    @InjectRepository(ReEnrolmentLine)
    private readonly lineRepository: Repository<ReEnrolmentLine>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    @InjectRepository(PeriodAvailableCourse)
    private readonly availableCourseRepository: Repository<PeriodAvailableCourse>,
    @InjectRepository(MoodleEnrolment)
    private readonly enrolmentRepository: Repository<MoodleEnrolment>,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly moodleClient: MoodleClientService,
  ) {}

  /**
   * Valida que el estudiante tenga permiso (sga_student_programs) en los
   * subprogramas (categorías de Moodle con depth=2, vinculadas a filas de
   * sga_programs) a los que pertenecen los cursos solicitados.
   * La jerarquía es: curso -> categoría materia (depth 3) -> subprograma
   * (depth 2). Si un curso pertenece a un subprograma y el estudiante no
   * está asignado a él, bloquea la reinscripción. Los cursos sin ancestro
   * depth=2 o cuyo subprograma no tiene programa vinculado no se bloquean.
   */
  private async assertProgramAccess(
    studentUserId: number,
    courseMoodleIds: number[],
  ): Promise<void> {
    if (!courseMoodleIds || courseMoodleIds.length === 0) return;

    const users = await this.enrolmentRepository.manager.query(
      `SELECT moodle_user_id FROM app_users WHERE id = $1`,
      [studentUserId],
    );
    const moodleUserId = users[0]?.moodle_user_id
      ? Number(users[0].moodle_user_id)
      : null;

    if (moodleUserId === null) return;

    // Subprograma (depth=2) al que pertenece cada curso, subiendo por la
    // jerarquía de categorías de Moodle hasta llegar a depth 2.
    const rows: {
      course_moodle_id: string;
      subprogram_moodle_id: string;
      subprogram_name: string;
      program_id: string | null;
    }[] = await this.enrolmentRepository.manager.query(
      `WITH RECURSIVE chain AS (
         SELECT c.moodle_id AS course_moodle_id,
                mc.moodle_id AS cat_moodle_id,
                mc.name AS cat_name,
                mc.parent AS cat_parent,
                mc.depth AS cat_depth
         FROM moodle_courses c
         JOIN moodle_categories mc ON mc.moodle_id = c.category_id
         WHERE c.moodle_id = ANY($1::bigint[])
         UNION ALL
         SELECT ch.course_moodle_id,
                parent_cat.moodle_id,
                parent_cat.name,
                parent_cat.parent,
                parent_cat.depth
         FROM chain ch
         JOIN moodle_categories parent_cat ON parent_cat.moodle_id = ch.cat_parent
         WHERE ch.cat_depth > 2
       )
       SELECT ch.course_moodle_id,
              ch.cat_moodle_id AS subprogram_moodle_id,
              ch.cat_name AS subprogram_name,
              p.id AS program_id
       FROM chain ch
       LEFT JOIN sga_programs p ON p.moodle_category_id = ch.cat_moodle_id
       WHERE ch.cat_depth = 2`,
      [courseMoodleIds],
    );

    if (rows.length === 0) return;

    const requiredProgramIds = [
      ...new Set(
        rows
          .filter((r) => r.program_id != null)
          .map((r) => Number(r.program_id)),
      ),
    ];
    if (requiredProgramIds.length === 0) return;

    const assignments: { user_id: string; program_id: string }[] =
      await this.enrolmentRepository.manager.query(
        `SELECT user_id, program_id FROM sga_student_programs
         WHERE user_id = $1 AND program_id = ANY($2)`,
        [moodleUserId, requiredProgramIds],
      );

    const assignedPrograms = new Set(
      assignments.map((a) => Number(a.program_id)),
    );

    const blockedCourses = new Map<string, string>();

    for (const row of rows) {
      const courseKey = String(row.course_moodle_id);
      // Sin programa vinculado al subprograma: no se puede exigir asignación.
      if (row.program_id == null) continue;
      if (assignedPrograms.has(Number(row.program_id))) continue;
      blockedCourses.set(courseKey, row.subprogram_name);
    }

    if (blockedCourses.size === 0) return;

    const courses: { moodle_id: string; fullname: string }[] =
      await this.enrolmentRepository.manager.query(
        `SELECT moodle_id, fullname FROM moodle_courses WHERE moodle_id = ANY($1)`,
        [[...blockedCourses.keys()].map(Number)],
      );
    const courseNames = new Map(
      courses.map((c) => [Number(c.moodle_id), c.fullname]),
    );

    const details = [...blockedCourses.entries()]
      .map(([courseId, subprogramName]) => {
        const courseName =
          courseNames.get(Number(courseId)) ?? `Curso ${courseId}`;
        return `"${courseName}" (${subprogramName})`;
      })
      .join('; ');

    throw new BadRequestException(
      `No puedes reinscribirte en ${details}. Debes estar asignado al subprograma correspondiente para poder reinscribirte en sus cursos.`,
    );
  }

  async create(
    studentUserId: number,
    createDto: CreateReEnrolmentDto,
  ): Promise<ReEnrolmentRequest> {
    // Verificar que el período existe
    const period = await this.periodRepository.findOne({
      where: { id: createDto.periodId },
    });

    if (!period) {
      throw new NotFoundException(
        `Period with ID ${createDto.periodId} not found`,
      );
    }

    // Verificar que la reinscripción está abierta
    if (!period.reenrolmentOpen) {
      throw new BadRequestException('Reenrolment is not open for this period');
    }

    // Verificar fechas de reinscripción
    const now = new Date();
    if (period.reenrolmentStartDate && now < period.reenrolmentStartDate) {
      throw new BadRequestException('Reenrolment period has not started yet');
    }
    if (period.reenrolmentEndDate && now > period.reenrolmentEndDate) {
      throw new BadRequestException('Reenrolment period has ended');
    }

    // Verificar que no haya solicitud pendiente o ya enviada para este período
    const existingSubmitted = await this.requestRepository.findOne({
      where: {
        appUserId: studentUserId,
        periodId: createDto.periodId,
        status: ReEnrolmentStatus.SUBMITTED,
      },
    });

    if (existingSubmitted) {
      throw new BadRequestException(
        'You already have a pending request for this period',
      );
    }

    // Verificar si ya existe un borrador
    const existingDraft = await this.requestRepository.findOne({
      where: {
        appUserId: studentUserId,
        periodId: createDto.periodId,
        status: ReEnrolmentStatus.DRAFT,
      },
    });

    if (existingDraft) {
      throw new BadRequestException(
        'You already have a draft for this period. Use update instead.',
      );
    }

    // Validar que los cursos están disponibles para reinscripción
    if (createDto.courses && createDto.courses.length > 0) {
      const courseMoodleIds = createDto.courses.map((c) => c.courseMoodleId);
      const validation = await this.validateCoursesAvailable(
        createDto.periodId,
        courseMoodleIds,
      );

      if (!validation.valid) {
        throw new BadRequestException(
          `The following courses are not available for reenrolment: ${validation.invalidCourses.join(', ')}`,
        );
      }

      // Validar que los cursos no estén ya solicitados en otras solicitudes
      const duplicateValidation = await this.validateCoursesNotAlreadyRequested(
        studentUserId,
        createDto.periodId,
        courseMoodleIds,
      );

      if (!duplicateValidation.valid) {
        throw new BadRequestException(
          `The following courses are already requested: ${duplicateValidation.alreadyRequestedCourses.join(', ')}`,
        );
      }

      // Verificar permiso de programa para cada curso solicitado
      await this.assertProgramAccess(studentUserId, courseMoodleIds);
    }

    // Crear solicitud
    const request = this.requestRepository.create({
      appUserId: studentUserId,
      periodId: createDto.periodId,
      status: ReEnrolmentStatus.DRAFT,
      notes: createDto.notes,
    });

    const savedRequest = await this.requestRepository.save(request);

    // Crear líneas con nombres de cursos
    if (createDto.courses && createDto.courses.length > 0) {
      const courseMoodleIds = createDto.courses.map((c) => c.courseMoodleId);

      // Obtener nombres de cursos disponibles
      const availableCourses = await this.availableCourseRepository.find({
        where: {
          periodId: createDto.periodId,
          courseMoodleId: In(courseMoodleIds),
        },
      });

      const courseNameMap = new Map(
        availableCourses.map((c) => [Number(c.courseMoodleId), c.courseName]),
      );

      const lines = createDto.courses.map((course) =>
        this.lineRepository.create({
          requestId: savedRequest.id,
          courseMoodleId: course.courseMoodleId,
          courseName: courseNameMap.get(Number(course.courseMoodleId)) || null,
          action: EnrolmentAction.ENROL,
          status: EnrolmentLineStatus.PENDING,
        }),
      );

      await this.lineRepository.save(lines);
    }

    // Auditoría
    await this.auditService.log({
      actorUserId: studentUserId,
      action: 'reenrolment.created',
      entity: 're_enrolment_requests',
      entityKey: savedRequest.id.toString(),
      afterData: { ...savedRequest, courses: createDto.courses },
      source: 'app',
    });

    return this.findOne(savedRequest.id);
  }

  private async validateCoursesAvailable(
    periodId: number,
    courseMoodleIds: number[],
  ): Promise<{ valid: boolean; invalidCourses: number[] }> {
    const availableCourses = await this.availableCourseRepository.find({
      where: {
        periodId,
        courseMoodleId: In(courseMoodleIds),
        enabled: true,
      },
    });

    // Convert to numbers to handle bigint comparison issues
    const availableIds = availableCourses.map((c) => Number(c.courseMoodleId));
    const invalidCourses = courseMoodleIds.filter(
      (id) => !availableIds.includes(Number(id)),
    );

    return {
      valid: invalidCourses.length === 0,
      invalidCourses,
    };
  }

  /**
   * Validates that courses are not already requested in submitted/approved/applied requests
   */
  private async validateCoursesNotAlreadyRequested(
    studentUserId: number,
    periodId: number,
    courseMoodleIds: number[],
    excludeRequestId?: number,
  ): Promise<{ valid: boolean; alreadyRequestedCourses: number[] }> {
    // Find all non-draft requests for this student and period
    const existingRequests = await this.requestRepository.find({
      where: {
        appUserId: studentUserId,
        periodId,
        status: In([
          ReEnrolmentStatus.SUBMITTED,
          ReEnrolmentStatus.APPROVED,
          ReEnrolmentStatus.APPLIED,
        ]),
      },
      relations: ['lines'],
    });

    // Filter out the current request if updating
    const relevantRequests = excludeRequestId
      ? existingRequests.filter((r) => r.id !== excludeRequestId)
      : existingRequests;

    // Collect all already requested course IDs
    const alreadyRequestedIds = new Set<number>();
    relevantRequests.forEach((request) => {
      request.lines?.forEach((line) => {
        alreadyRequestedIds.add(Number(line.courseMoodleId));
      });
    });

    // Check which courses are already requested
    const alreadyRequestedCourses = courseMoodleIds.filter((id) =>
      alreadyRequestedIds.has(Number(id)),
    );

    return {
      valid: alreadyRequestedCourses.length === 0,
      alreadyRequestedCourses,
    };
  }

  async findOne(id: number): Promise<ReEnrolmentRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['student', 'period', 'lines', 'decider'],
    });

    if (!request) {
      throw new NotFoundException(`Re-enrolment request ${id} not found`);
    }

    // Enrich lines with course names if missing
    await this.enrichLinesWithCourseNames(request);

    return request;
  }

  /**
   * Create local enrolment record after Moodle enrolment
   */
  private async createLocalEnrolment(
    courseMoodleId: number,
    userMoodleId: number,
  ): Promise<void> {
    // Check if already exists
    const existing = await this.enrolmentRepository.findOne({
      where: {
        courseMoodleId,
        userMoodleId,
        roleCode: 'student',
      },
    });

    if (existing) {
      // Update to active if suspended
      if (existing.enrolStatus !== 'active') {
        await this.enrolmentRepository.update(existing.id, {
          enrolStatus: 'active',
          timemodified: new Date(),
        });
      }
      return;
    }

    // Create new enrolment record
    const enrolment = this.enrolmentRepository.create({
      courseMoodleId,
      userMoodleId,
      roleCode: 'student',
      enrolStatus: 'active',
      timestart: new Date(),
      timemodified: new Date(),
      lastSyncedAt: new Date(),
    });

    await this.enrolmentRepository.save(enrolment);
  }

  /**
   * Enrich request lines with course names from available courses
   */
  private async enrichLinesWithCourseNames(
    request: ReEnrolmentRequest,
  ): Promise<void> {
    if (!request.lines || request.lines.length === 0) return;

    // Find lines without courseName
    const linesWithoutName = request.lines.filter((l) => !l.courseName);
    if (linesWithoutName.length === 0) return;

    // Get course names from available courses
    const courseMoodleIds = linesWithoutName.map((l) => l.courseMoodleId);
    const availableCourses = await this.availableCourseRepository.find({
      where: {
        periodId: request.periodId,
        courseMoodleId: In(courseMoodleIds),
      },
    });

    const courseNameMap = new Map(
      availableCourses.map((c) => [Number(c.courseMoodleId), c.courseName]),
    );

    // Update lines with course names (in memory only, not persisted)
    for (const line of linesWithoutName) {
      const name = courseNameMap.get(Number(line.courseMoodleId));
      if (name) {
        line.courseName = name;
      }
    }
  }

  async findByStudent(studentUserId: number): Promise<ReEnrolmentRequest[]> {
    const requests = await this.requestRepository.find({
      where: { appUserId: studentUserId },
      relations: ['period', 'lines'],
      order: { createdAt: 'DESC' },
    });

    // Enrich all requests with course names
    for (const request of requests) {
      await this.enrichLinesWithCourseNames(request);
    }

    return requests;
  }

  async findAll(): Promise<ReEnrolmentRequest[]> {
    const requests = await this.requestRepository.find({
      relations: ['student', 'period', 'lines'],
      order: { createdAt: 'DESC' },
    });

    for (const request of requests) {
      await this.enrichLinesWithCourseNames(request);
    }

    return requests;
  }

  async findPending(): Promise<ReEnrolmentRequest[]> {
    const requests = await this.requestRepository.find({
      where: { status: ReEnrolmentStatus.SUBMITTED },
      relations: ['student', 'period', 'lines'],
      order: { submittedAt: 'ASC' },
    });

    for (const request of requests) {
      await this.enrichLinesWithCourseNames(request);
    }

    return requests;
  }

  async submit(id: number, studentUserId: number): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    // Verificar que es el estudiante dueño de la solicitud
    if (request.appUserId !== studentUserId) {
      throw new ForbiddenException('Not authorized to submit this request');
    }

    if (request.status !== ReEnrolmentStatus.DRAFT) {
      throw new BadRequestException('Request has already been submitted');
    }

    // Verificar que tenga al menos un curso
    if (!request.lines || request.lines.length === 0) {
      throw new BadRequestException('Cannot submit request without courses');
    }

    // Verificar permiso de programa para cada curso de la solicitud
    await this.assertProgramAccess(
      studentUserId,
      request.lines.map((l) => Number(l.courseMoodleId)),
    );

    const beforeData = { ...request };
    request.status = ReEnrolmentStatus.SUBMITTED;
    request.submittedAt = new Date();

    const updated = await this.requestRepository.save(request);

    // Auditoría
    await this.auditService.log({
      actorUserId: studentUserId,
      action: 'reenrolment.submitted',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return this.findOne(id);
  }

  async approve(id: number, adminUserId: number): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.status !== ReEnrolmentStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted requests can be approved');
    }

    const beforeData = { ...request };
    request.status = ReEnrolmentStatus.APPROVED;
    request.decidedAt = new Date();
    request.decidedBy = adminUserId;

    await this.requestRepository.save(request);

    // Auditoría
    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.approved',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData,
      afterData: request,
      source: 'app',
    });

    // Eliminamos el guardado automático a Moodle para que el admin lo haga luego de forma manual
    return this.findOne(id);
  }

  async reject(
    id: number,
    adminUserId: number,
    reason: string,
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (
      request.status !== ReEnrolmentStatus.SUBMITTED &&
      request.status !== ReEnrolmentStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only submitted or approved requests can be rejected',
      );
    }

    const beforeData = { ...request };
    request.status = ReEnrolmentStatus.REJECTED;
    request.decidedAt = new Date();
    request.decidedBy = adminUserId;
    request.rejectionReason = reason;

    const updated = await this.requestRepository.save(request);

    // Auditoría
    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.rejected',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return this.findOne(id);
  }

  async applyToMoodle(
    id: number,
    adminUserId: number,
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.status !== ReEnrolmentStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be applied');
    }

    this.logger.log(
      `Applying re-enrolment request ${id} to Moodle (${request.lines?.length || 0} courses)`,
    );

    // Obtener moodle_user_id del estudiante
    const student = request.student;
    if (!student?.moodleUserId) {
      this.logger.warn(
        `Student ${student?.id} does not have a Moodle user ID, skipping Moodle enrolment`,
      );
      // Marcar todas las líneas como done de todas formas (inscripción local)
      for (const line of request.lines || []) {
        await this.lineRepository.update(line.id, {
          status: EnrolmentLineStatus.DONE,
          appliedAt: new Date(),
        });
      }
    } else {
      // Inscribir directamente en Moodle para cada curso
      for (const line of request.lines || []) {
        if (line.status === EnrolmentLineStatus.DONE) {
          this.logger.debug(`Line ${line.id} already applied, skipping`);
          continue;
        }

        try {
          // Inscribir directamente en Moodle
          await this.moodleClient.enrolUser(
            Number(line.courseMoodleId),
            student.moodleUserId,
            5, // Student role en Moodle
          );

          // Crear registro local de enrolment
          await this.createLocalEnrolment(
            Number(line.courseMoodleId),
            student.moodleUserId,
          );

          // Marcar línea como done
          await this.lineRepository.update(line.id, {
            status: EnrolmentLineStatus.DONE,
            appliedAt: new Date(),
          });

          this.logger.log(
            `User ${student.moodleUserId} enrolled in course ${line.courseMoodleId}`,
          );
        } catch (error) {
          this.logger.error(`Error enrolling user in Moodle: ${error.message}`);

          await this.lineRepository.update(line.id, {
            status: EnrolmentLineStatus.FAILED,
            lastError: error.message,
          });
        }
      }
    }

    // Marcar solicitud como aplicada
    const beforeData = { ...request };
    request.status = ReEnrolmentStatus.APPLIED;
    const updated = await this.requestRepository.save(request);

    // Auditoría
    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.applied',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return this.findOne(id);
  }

  // =====================
  // MÉTODOS ADICIONALES PARA ESTUDIANTES
  // =====================

  async findDraft(
    studentUserId: number,
    periodId: number,
  ): Promise<ReEnrolmentRequest | null> {
    const request = await this.requestRepository.findOne({
      where: {
        appUserId: studentUserId,
        periodId,
        status: ReEnrolmentStatus.DRAFT,
      },
      relations: ['period', 'lines'],
    });

    if (request) {
      await this.enrichLinesWithCourseNames(request);
    }

    return request;
  }

  async findDraftOrCreate(
    studentUserId: number,
    periodId: number,
  ): Promise<ReEnrolmentRequest> {
    const existing = await this.findDraft(studentUserId, periodId);
    if (existing) return existing;

    return this.create(studentUserId, {
      periodId,
      courses: [],
    });
  }

  async updateDraft(
    id: number,
    studentUserId: number,
    courses: ReEnrolmentCourseDto[],
    notes?: string,
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    // Verificar que es el estudiante dueño de la solicitud
    if (request.appUserId !== studentUserId) {
      throw new ForbiddenException('Not authorized to update this request');
    }

    if (request.status !== ReEnrolmentStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be updated');
    }

    // Verificar que la reinscripción sigue abierta
    const period = request.period;
    if (!period.reenrolmentOpen) {
      throw new BadRequestException('Reenrolment is no longer open');
    }

    // Validar cursos disponibles
    if (courses && courses.length > 0) {
      const courseMoodleIds = courses.map((c) => c.courseMoodleId);
      const validation = await this.validateCoursesAvailable(
        request.periodId,
        courseMoodleIds,
      );

      if (!validation.valid) {
        throw new BadRequestException(
          `The following courses are not available: ${validation.invalidCourses.join(', ')}`,
        );
      }

      // Validar que los cursos no estén ya solicitados en otras solicitudes
      const duplicateValidation = await this.validateCoursesNotAlreadyRequested(
        studentUserId,
        request.periodId,
        courseMoodleIds,
        id, // Excluir la solicitud actual
      );

      if (!duplicateValidation.valid) {
        throw new BadRequestException(
          `The following courses are already requested: ${duplicateValidation.alreadyRequestedCourses.join(', ')}`,
        );
      }

      // Verificar permiso de programa para cada curso solicitado
      await this.assertProgramAccess(studentUserId, courseMoodleIds);
    }

    // Eliminar líneas existentes
    await this.lineRepository.delete({ requestId: id });

    // Crear nuevas líneas con nombres de cursos
    if (courses && courses.length > 0) {
      const courseMoodleIds = courses.map((c) => c.courseMoodleId);

      // Obtener nombres de cursos disponibles
      const availableCourses = await this.availableCourseRepository.find({
        where: {
          periodId: request.periodId,
          courseMoodleId: In(courseMoodleIds),
        },
      });

      const courseNameMap = new Map(
        availableCourses.map((c) => [Number(c.courseMoodleId), c.courseName]),
      );

      const lines = courses.map((course) =>
        this.lineRepository.create({
          requestId: id,
          courseMoodleId: course.courseMoodleId,
          courseName: courseNameMap.get(Number(course.courseMoodleId)) || null,
          action: EnrolmentAction.ENROL,
          status: EnrolmentLineStatus.PENDING,
        }),
      );
      await this.lineRepository.save(lines);
    }

    // Actualizar notas si se proporcionan
    if (notes !== undefined) {
      request.notes = notes;
      await this.requestRepository.save(request);
    }

    await this.auditService.log({
      actorUserId: studentUserId,
      action: 'reenrolment.updated',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      afterData: { courses, notes },
      source: 'app',
    });

    return this.findOne(id);
  }

  async addCoursesToDraft(
    id: number,
    studentUserId: number,
    courses: ReEnrolmentCourseDto[],
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.appUserId !== studentUserId) {
      throw new ForbiddenException('Not authorized');
    }

    if (request.status !== ReEnrolmentStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be modified');
    }

    // Validar cursos disponibles
    const courseMoodleIds = courses.map((c) => c.courseMoodleId);
    const validation = await this.validateCoursesAvailable(
      request.periodId,
      courseMoodleIds,
    );

    if (!validation.valid) {
      throw new BadRequestException(
        `The following courses are not available: ${validation.invalidCourses.join(', ')}`,
      );
    }

    // Validar que los cursos no estén ya solicitados en otras solicitudes
    const duplicateValidation = await this.validateCoursesNotAlreadyRequested(
      studentUserId,
      request.periodId,
      courseMoodleIds,
      id, // Excluir la solicitud actual
    );

    if (!duplicateValidation.valid) {
      throw new BadRequestException(
        `The following courses are already requested: ${duplicateValidation.alreadyRequestedCourses.join(', ')}`,
      );
    }

    // Verificar permiso de programa para cada curso solicitado
    await this.assertProgramAccess(studentUserId, courseMoodleIds);

    // Agregar solo los que no existen
    const existingIds = request.lines.map((l) => l.courseMoodleId);
    const newCourses = courses.filter(
      (c) => !existingIds.includes(c.courseMoodleId),
    );

    if (newCourses.length > 0) {
      const courseMoodleIds = newCourses.map((c) => c.courseMoodleId);

      // Obtener nombres de cursos disponibles
      const availableCourses = await this.availableCourseRepository.find({
        where: {
          periodId: request.periodId,
          courseMoodleId: In(courseMoodleIds),
        },
      });

      const courseNameMap = new Map(
        availableCourses.map((c) => [Number(c.courseMoodleId), c.courseName]),
      );

      const lines = newCourses.map((course) =>
        this.lineRepository.create({
          requestId: id,
          courseMoodleId: course.courseMoodleId,
          courseName: courseNameMap.get(Number(course.courseMoodleId)) || null,
          action: EnrolmentAction.ENROL,
          status: EnrolmentLineStatus.PENDING,
        }),
      );
      await this.lineRepository.save(lines);
    }

    return this.findOne(id);
  }

  async removeCoursesFromDraft(
    id: number,
    studentUserId: number,
    courseMoodleIds: number[],
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.appUserId !== studentUserId) {
      throw new ForbiddenException('Not authorized');
    }

    if (request.status !== ReEnrolmentStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be modified');
    }

    await this.lineRepository.delete({
      requestId: id,
      courseMoodleId: In(courseMoodleIds),
    });

    return this.findOne(id);
  }

  async deleteDraft(id: number, studentUserId: number): Promise<void> {
    const request = await this.findOne(id);

    if (request.appUserId !== studentUserId) {
      throw new ForbiddenException('Not authorized to delete this request');
    }

    if (request.status !== ReEnrolmentStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be deleted');
    }

    await this.requestRepository.delete(id);

    await this.auditService.log({
      actorUserId: studentUserId,
      action: 'reenrolment.deleted',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData: request,
      source: 'app',
    });
  }

  async findByPeriod(periodId: number): Promise<ReEnrolmentRequest[]> {
    const requests = await this.requestRepository.find({
      where: { periodId },
      relations: ['student', 'lines'],
      order: { createdAt: 'DESC' },
    });

    for (const request of requests) {
      await this.enrichLinesWithCourseNames(request);
    }

    return requests;
  }

  /**
   * Admin delete any re-enrolment request
   */
  async adminDelete(id: number, adminUserId: number): Promise<void> {
    const request = await this.findOne(id);

    // Delete lines first
    await this.lineRepository.delete({ requestId: id });

    // Delete request
    await this.requestRepository.delete(id);

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.admin_deleted',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData: request,
      source: 'app',
    });
  }

  /**
   * Admin add courses to a submitted request (before approval)
   */
  async adminAddCourses(
    id: number,
    adminUserId: number,
    courses: ReEnrolmentCourseDto[],
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.status !== ReEnrolmentStatus.SUBMITTED) {
      throw new BadRequestException(
        'Solo se pueden editar solicitudes con estado "submitted"',
      );
    }

    // Validar cursos disponibles
    const courseMoodleIds = courses.map((c) => c.courseMoodleId);
    const validation = await this.validateCoursesAvailable(
      request.periodId,
      courseMoodleIds,
    );

    if (!validation.valid) {
      throw new BadRequestException(
        `Los siguientes cursos no están disponibles: ${validation.invalidCourses.join(', ')}`,
      );
    }

    // Agregar solo los que no existen
    const existingIds = request.lines.map((l) => Number(l.courseMoodleId));
    const newCourses = courses.filter(
      (c) => !existingIds.includes(Number(c.courseMoodleId)),
    );

    if (newCourses.length > 0) {
      const newCourseMoodleIds = newCourses.map((c) => c.courseMoodleId);

      // Obtener nombres de cursos disponibles
      const availableCourses = await this.availableCourseRepository.find({
        where: {
          periodId: request.periodId,
          courseMoodleId: In(newCourseMoodleIds),
        },
      });

      const courseNameMap = new Map(
        availableCourses.map((c) => [Number(c.courseMoodleId), c.courseName]),
      );

      const lines = newCourses.map((course) =>
        this.lineRepository.create({
          requestId: id,
          courseMoodleId: course.courseMoodleId,
          courseName: courseNameMap.get(Number(course.courseMoodleId)) || null,
          action: EnrolmentAction.ENROL,
          status: EnrolmentLineStatus.PENDING,
        }),
      );
      await this.lineRepository.save(lines);
    }

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.admin_add_courses',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      afterData: { addedCourses: newCourses },
      source: 'app',
    });

    return this.findOne(id);
  }

  /**
   * Admin remove courses from a submitted request (before approval)
   */
  async adminRemoveCourses(
    id: number,
    adminUserId: number,
    courseMoodleIds: number[],
  ): Promise<ReEnrolmentRequest> {
    const request = await this.findOne(id);

    if (request.status !== ReEnrolmentStatus.SUBMITTED) {
      throw new BadRequestException(
        'Solo se pueden editar solicitudes con estado "submitted"',
      );
    }

    const beforeCount = request.lines?.length || 0;

    await this.lineRepository.delete({
      requestId: id,
      courseMoodleId: In(courseMoodleIds),
    });

    await this.auditService.log({
      actorUserId: adminUserId,
      action: 'reenrolment.admin_remove_courses',
      entity: 're_enrolment_requests',
      entityKey: id.toString(),
      beforeData: { lineCount: beforeCount },
      afterData: { removedCourses: courseMoodleIds },
      source: 'app',
    });

    return this.findOne(id);
  }

  async countByStatus(
    periodId?: number,
  ): Promise<Record<ReEnrolmentStatus, number>> {
    const qb = this.requestRepository
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('r.status');

    if (periodId) {
      qb.where('r.periodId = :periodId', { periodId });
    }

    const results = await qb.getRawMany();

    const counts: Record<ReEnrolmentStatus, number> = {
      [ReEnrolmentStatus.DRAFT]: 0,
      [ReEnrolmentStatus.SUBMITTED]: 0,
      [ReEnrolmentStatus.APPROVED]: 0,
      [ReEnrolmentStatus.REJECTED]: 0,
      [ReEnrolmentStatus.APPLIED]: 0,
    };

    for (const row of results) {
      counts[row.status as ReEnrolmentStatus] = row.count;
    }

    return counts;
  }
}
