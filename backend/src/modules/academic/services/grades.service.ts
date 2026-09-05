import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalGrade } from '../entities/local-grade.entity';
import {
  AcademicPeriod,
  AcademicPeriodStatus,
} from '../entities/academic-period.entity';
import { GradeEditSession } from '../entities/grade-edit-session.entity';
import { GradeEdit } from '../entities/grade-edit.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { User } from '../../users/entities/user.entity';
import { CourseTeacher } from '../entities/course-teacher.entity';
import { OutboxService } from '../../sync/services/outbox.service';
import { AuditService } from '../../sync/services/audit.service';
import { OutboxEventType } from '../../sync/entities/outbox-event.entity';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UpdateGradeDto } from '../dto/update-grade.dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    @InjectRepository(LocalGrade)
    private readonly gradeRepository: Repository<LocalGrade>,
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    @InjectRepository(GradeEditSession)
    private readonly gradeEditSessionRepository: Repository<GradeEditSession>,
    @InjectRepository(GradeEdit)
    private readonly gradeEditRepository: Repository<GradeEdit>,
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    @InjectRepository(MoodleGradeItem)
    private readonly gradeItemRepository: Repository<MoodleGradeItem>,
    @InjectRepository(MoodleGrade)
    private readonly moodleGradeRepository: Repository<MoodleGrade>,
    @InjectRepository(MoodleEnrolment)
    private readonly enrolmentRepository: Repository<MoodleEnrolment>,
    @InjectRepository(MoodleUser)
    private readonly moodleUserRepository: Repository<MoodleUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepository: Repository<CourseTeacher>,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
    private readonly moodleSyncService: MoodleSyncService,
  ) {}

  /**
   * Crear una nueva calificación
   */
  async create(
    createDto: CreateGradeDto,
    teacherId: number,
  ): Promise<LocalGrade> {
    // Validaciones
    await this.validateGradeCreation(createDto, teacherId);

    // Verificar si ya existe una calificación para este estudiante/item
    const existing = await this.gradeRepository.findOne({
      where: {
        courseId: createDto.courseId,
        gradeItemId: createDto.gradeItemId,
        studentId: createDto.studentId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Ya existe una calificación para este estudiante en este item',
      );
    }

    // Obtener datos del curso y el item para Moodle
    const course = await this.courseRepository.findOne({
      where: { id: createDto.courseId },
    });
    const gradeItem = await this.gradeItemRepository.findOne({
      where: { id: createDto.gradeItemId },
    });
    const student = await this.userRepository.findOne({
      where: { id: createDto.studentId },
    });

    if (!course || !gradeItem || !student) {
      throw new NotFoundException('Curso, item o estudiante no encontrado');
    }

    // Crear la calificación local
    const grade = this.gradeRepository.create({
      ...createDto,
      teacherId,
      syncedToMoodle: false,
      createdBy: teacherId,
      updatedBy: teacherId,
    });

    const saved = await this.gradeRepository.save(grade);

    // Crear evento de outbox para sincronizar a Moodle
    const outboxEvent = await this.outboxService.createEvent(
      OutboxEventType.GRADE_UPDATED,
      {
        courseMoodleId: course.moodleId,
        itemMoodleId: gradeItem.itemMoodleId,
        userMoodleId: student.moodleUserId,
        grade: createDto.grade,
        feedback: createDto.feedback || '',
      },
    );

    // Vincular el evento con la calificación
    saved.outboxEventId = outboxEvent.id;
    await this.gradeRepository.save(saved);

    // Auditoría
    await this.auditService.log({
      entity: 'LocalGrade',
      entityKey: saved.id.toString(),
      action: 'CREATE',
      actorUserId: teacherId,
      afterData: createDto,
    });

    return saved;
  }

  /**
   * Actualizar una calificación existente
   */
  async update(
    id: number,
    updateDto: UpdateGradeDto,
    teacherId: number,
  ): Promise<LocalGrade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['period', 'course', 'gradeItem', 'student'],
    });

    if (!grade) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Validar que el profesor sea el propietario
    if (grade.teacherId !== teacherId) {
      throw new ForbiddenException(
        'No tiene permisos para modificar esta calificación',
      );
    }

    // Validar que el período siga abierto
    if (grade.period.status !== AcademicPeriodStatus.OPEN) {
      throw new BadRequestException('El período académico está cerrado');
    }

    // Validar rango de la nueva calificación
    if (updateDto.grade !== undefined) {
      await this.validateGradeRange(grade.gradeItemId, updateDto.grade);
    }

    const oldData = { ...grade };

    // Actualizar campos
    if (updateDto.grade !== undefined) {
      grade.grade = updateDto.grade;
    }
    if (updateDto.feedback !== undefined) {
      grade.feedback = updateDto.feedback;
    }

    grade.updatedBy = teacherId;
    grade.syncedToMoodle = false; // Marcar como no sincronizado

    const updated = await this.gradeRepository.save(grade);

    // Crear nuevo evento de outbox
    const outboxEvent = await this.outboxService.createEvent(
      OutboxEventType.GRADE_UPDATED,
      {
        courseMoodleId: grade.course.moodleId,
        itemMoodleId: grade.gradeItem.itemMoodleId,
        userMoodleId: grade.student.moodleUserId,
        grade: updated.grade,
        feedback: updated.feedback || '',
      },
    );

    updated.outboxEventId = outboxEvent.id;
    await this.gradeRepository.save(updated);

    // Auditoría
    await this.auditService.log({
      entity: 'LocalGrade',
      entityKey: id.toString(),
      action: 'UPDATE',
      actorUserId: teacherId,
      beforeData: oldData,
      afterData: updateDto,
    });

    return updated;
  }

  /**
   * Obtener calificaciones por profesor
   */
  async findByTeacher(
    teacherId: number,
    courseId?: number,
    periodId?: number,
  ): Promise<LocalGrade[]> {
    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.student', 'student')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.teacherId = :teacherId', { teacherId });

    if (courseId) {
      query.andWhere('grade.courseId = :courseId', { courseId });
    }

    if (periodId) {
      query.andWhere('grade.periodId = :periodId', { periodId });
    }

    query.orderBy('grade.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Obtener calificaciones por estudiante
   */
  async findByStudent(
    studentId: number,
    periodId?: number,
  ): Promise<LocalGrade[]> {
    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.teacher', 'teacher')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.studentId = :studentId', { studentId });

    if (periodId) {
      query.andWhere('grade.periodId = :periodId', { periodId });
    }

    query.orderBy('grade.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Obtener calificaciones por curso
   */
  async findByCourse(
    courseId: number,
    gradeItemId?: number,
  ): Promise<LocalGrade[]> {
    const query = this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.student', 'student')
      .leftJoinAndSelect('grade.gradeItem', 'gradeItem')
      .leftJoinAndSelect('grade.teacher', 'teacher')
      .leftJoinAndSelect('grade.period', 'period')
      .where('grade.courseId = :courseId', { courseId });

    if (gradeItemId) {
      query.andWhere('grade.gradeItemId = :gradeItemId', { gradeItemId });
    }

    query.orderBy('student.email', 'ASC');

    return query.getMany();
  }

  /**
   * Obtener una calificación por ID
   */
  async findOne(id: number): Promise<LocalGrade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['course', 'gradeItem', 'student', 'teacher', 'period'],
    });

    if (!grade) {
      throw new NotFoundException('Calificación no encontrada');
    }

    return grade;
  }

  /**
   * Marcar calificación como sincronizada (llamado por OutboxProcessor)
   */
  async markAsSynced(id: number): Promise<void> {
    await this.gradeRepository.update(id, {
      syncedToMoodle: true,
      syncedAt: new Date(),
    });
  }

  /**
   * Validaciones privadas
   */
  private async validateGradeCreation(
    createDto: CreateGradeDto,
    teacherId: number,
  ): Promise<void> {
    // 1. Validar que el período esté abierto
    const period = await this.periodRepository.findOne({
      where: { id: createDto.periodId },
    });

    if (!period) {
      throw new NotFoundException('Período académico no encontrado');
    }

    if (period.status !== AcademicPeriodStatus.OPEN) {
      throw new BadRequestException('El período académico no está abierto');
    }

    // 2. Validar que el curso exista
    const course = await this.courseRepository.findOne({
      where: { id: createDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // 3. Validar que el grade item exista y pertenezca al curso
    const gradeItem = await this.gradeItemRepository.findOne({
      where: { id: createDto.gradeItemId },
    });

    if (!gradeItem) {
      throw new NotFoundException('Item de calificación no encontrado');
    }

    if (gradeItem.courseMoodleId !== course.moodleId) {
      throw new BadRequestException(
        'El item de calificación no pertenece a este curso',
      );
    }

    // 4. Validar rango de calificación
    await this.validateGradeRange(createDto.gradeItemId, createDto.grade);

    // 5. Validar que el estudiante exista
    const student = await this.userRepository.findOne({
      where: { id: createDto.studentId },
    });

    if (!student || !student.moodleUserId) {
      throw new NotFoundException(
        'Estudiante no encontrado o no vinculado a Moodle',
      );
    }

    // 6. Validar que el estudiante esté inscrito en el curso
    const enrolment = await this.enrolmentRepository.findOne({
      where: {
        userMoodleId: student.moodleUserId,
        courseMoodleId: course.moodleId,
      },
    });

    if (!enrolment) {
      throw new BadRequestException(
        'El estudiante no está inscrito en este curso',
      );
    }

    if (enrolment.enrolStatus !== 'active') {
      throw new BadRequestException(
        'La inscripción del estudiante no está activa',
      );
    }

    // 7. Validar que el profesor esté asignado al curso
    // Esto se podría implementar con una tabla de asignaciones profesor-curso
    // Por ahora, asumimos que si el profesor tiene rol TEACHER, puede calificar
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['roles'],
    });

    if (!teacher) {
      throw new NotFoundException('Profesor no encontrado');
    }

    const hasTeacherRole = teacher.roles.some(
      (role) => role.code === 'TEACHER' || role.code === 'ADMIN',
    );

    if (!hasTeacherRole) {
      throw new ForbiddenException(
        'No tiene permisos para calificar en este curso',
      );
    }
  }

  private async validateGradeRange(
    gradeItemId: number,
    grade: number,
  ): Promise<void> {
    const gradeItem = await this.gradeItemRepository.findOne({
      where: { id: gradeItemId },
    });

    if (!gradeItem) {
      throw new NotFoundException('Item de calificación no encontrado');
    }

    const min = gradeItem.grademin || 0;
    const max = gradeItem.grademax || 100;

    if (grade < min || grade > max) {
      throw new BadRequestException(
        `La calificación debe estar entre ${min} y ${max}`,
      );
    }
  }

  // ==================== EDIT SESSION METHODS ====================

  /**
   * Get courses for dropdown - teachers see only their courses, admins see all
   */
  async getCourses(userId?: number, isAdmin?: boolean) {
    if (!isAdmin && userId) {
      const courseMoodleIds = new Set<number>();

      // 1. Check moodle_enrolments for teacher/editingteacher roles
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user?.moodleUserId) {
        const enrolments = await this.enrolmentRepository
          .createQueryBuilder('e')
          .where('e.userMoodleId = :moodleId', { moodleId: user.moodleUserId })
          .andWhere('(e.roleCode = :r1 OR e.roleCode = :r2)', {
            r1: 'editingteacher',
            r2: 'teacher',
          })
          .getMany();

        enrolments.forEach((e) =>
          courseMoodleIds.add(Number(e.courseMoodleId)),
        );
      }

      // 2. Check course_teachers table (manual assignments)
      const teacherAssignments = await this.courseTeacherRepository.find({
        where: { teacherId: userId },
      });
      teacherAssignments.forEach((a) =>
        courseMoodleIds.add(Number(a.courseMoodleId)),
      );

      if (courseMoodleIds.size === 0) {
        return [];
      }

      return this.courseRepository
        .createQueryBuilder('course')
        .where('course.moodleId IN (:...ids)', { ids: [...courseMoodleIds] })
        .orderBy('course.fullname', 'ASC')
        .getMany();
    }

    // Admin sees all courses
    return this.courseRepository.find({
      order: { fullname: 'ASC' },
    });
  }

  /**
   * Toggle grade edit session (admin)
   */
  async toggleEditSession(adminUserId: number) {
    const activeSession = await this.getActiveSession();

    if (activeSession) {
      // Deactivate the current session
      activeSession.isActive = false;
      activeSession.deactivatedAt = new Date();
      await this.gradeEditSessionRepository.save(activeSession);

      return {
        action: 'deactivated',
        session: activeSession,
        message: 'Edicion de notas deshabilitada',
      };
    } else {
      // Create a new active session
      const newSession = this.gradeEditSessionRepository.create({
        isActive: true,
        activatedBy: adminUserId,
        activatedAt: new Date(),
      });
      const saved = await this.gradeEditSessionRepository.save(newSession);

      return {
        action: 'activated',
        session: saved,
        message: 'Edicion de notas habilitada',
      };
    }
  }

  /**
   * Get the current active edit session
   */
  async getActiveSession(): Promise<GradeEditSession | null> {
    return this.gradeEditSessionRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get edit session status
   */
  async getEditSessionStatus() {
    const session = await this.getActiveSession();
    return {
      isActive: session?.isActive || false,
      session: session || null,
    };
  }

  /**
   * Sync and return all participants with their grades for a course
   */
  async getGradesByCourse(courseMoodleId: number) {
    // Sync grades and grade items from Moodle
    try {
      await this.moodleSyncService.syncGradeItems(courseMoodleId);
      await this.moodleSyncService.syncGrades(courseMoodleId);
      await this.moodleSyncService.syncEnrolments(courseMoodleId);
    } catch (error) {
      this.logger.warn(
        `Sync failed for course ${courseMoodleId}, using cached data: ${error.message}`,
      );
    }

    // Get course info
    const course = await this.courseRepository.findOne({
      where: { moodleId: courseMoodleId },
    });

    // Get grade items for this course
    const gradeItems = await this.gradeItemRepository.find({
      where: { courseMoodleId },
      order: { itemMoodleId: 'ASC' },
    });

    // Get enrolled students (role 'student')
    const enrolments = await this.enrolmentRepository.find({
      where: { courseMoodleId, roleCode: 'student' },
    });

    const studentMoodleIds = enrolments.map((e) => Number(e.userMoodleId));

    // Get student info
    const students = await this.moodleUserRepository
      .createQueryBuilder('u')
      .where('u.moodleId IN (:...ids)', {
        ids: studentMoodleIds.length > 0 ? studentMoodleIds : [0],
      })
      .getMany();

    // Get all grades for this course
    const grades = await this.moodleGradeRepository.find({
      where: { courseMoodleId },
    });

    // Get active edit session
    const activeSession = await this.getActiveSession();

    // Get grade edits for the active session (if any)
    let gradeEdits: GradeEdit[] = [];
    if (activeSession) {
      gradeEdits = await this.gradeEditRepository.find({
        where: { sessionId: activeSession.id, courseMoodleId },
      });
    }

    // Build the response: participants with their grades
    const participants = students.map((student) => {
      const studentGrades = gradeItems.map((item) => {
        const moodleGrade = grades.find(
          (g) =>
            Number(g.itemMoodleId) === Number(item.itemMoodleId) &&
            Number(g.userMoodleId) === Number(student.moodleId),
        );

        // Check if there's an edit for this grade in the active session
        const edit = gradeEdits.find(
          (e) =>
            Number(e.itemMoodleId) === Number(item.itemMoodleId) &&
            Number(e.studentMoodleId) === Number(student.moodleId),
        );

        return {
          itemMoodleId: Number(item.itemMoodleId),
          itemName: item.itemname,
          gradeMax: Number(item.grademax),
          gradeMin: Number(item.grademin),
          moodleGrade: moodleGrade ? Number(moodleGrade.grade) : null,
          editedGrade: edit ? Number(edit.newGrade) : null,
          feedback: edit?.feedback || moodleGrade?.feedback || null,
          wasEdited: !!edit,
        };
      });

      return {
        studentMoodleId: Number(student.moodleId),
        studentName:
          `${student.firstname || ''} ${student.lastname || ''}`.trim(),
        studentEmail: student.email,
        grades: studentGrades,
      };
    });

    return {
      course: course
        ? {
            moodleId: Number(course.moodleId),
            fullname: course.subjectName || course.fullname,
            shortname: course.shortname,
          }
        : null,
      gradeItems: gradeItems.map((item) => ({
        itemMoodleId: Number(item.itemMoodleId),
        itemName: item.itemname,
        itemType: item.itemtype,
        gradeMax: Number(item.grademax),
        gradeMin: Number(item.grademin),
        weight: item.weight ? Number(item.weight) : null,
      })),
      participants,
      editSession: activeSession
        ? {
            id: activeSession.id,
            isActive: activeSession.isActive,
            activatedAt: activeSession.activatedAt,
          }
        : null,
    };
  }

  /**
   * Save a grade edit (teacher)
   */
  async saveGradeEdit(
    teacherUserId: number,
    data: {
      courseMoodleId: number;
      itemMoodleId: number;
      studentMoodleId: number;
      newGrade: number;
      feedback?: string;
    },
  ) {
    // Check if edit session is active
    const activeSession = await this.getActiveSession();
    if (!activeSession) {
      throw new ForbiddenException(
        'La edicion de notas no esta habilitada. Contacte al administrador.',
      );
    }

    // Check if this grade was already edited in this session (by ANY teacher)
    const existingEdit = await this.gradeEditRepository.findOne({
      where: {
        sessionId: activeSession.id,
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        studentMoodleId: data.studentMoodleId,
      },
    });

    if (existingEdit) {
      throw new ConflictException(
        'Esta nota ya fue editada en la sesion actual. No se puede modificar hasta que el administrador habilite una nueva sesion.',
      );
    }

    // Get the current Moodle grade
    const currentMoodleGrade = await this.moodleGradeRepository.findOne({
      where: {
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        userMoodleId: data.studentMoodleId,
      },
    });

    // Save the edit locally
    const gradeEdit = new GradeEdit();
    gradeEdit.sessionId = activeSession.id;
    gradeEdit.teacherUserId = teacherUserId;
    gradeEdit.courseMoodleId = data.courseMoodleId;
    gradeEdit.itemMoodleId = data.itemMoodleId;
    gradeEdit.studentMoodleId = data.studentMoodleId;
    gradeEdit.previousGrade = currentMoodleGrade
      ? Number(currentMoodleGrade.grade)
      : null;
    gradeEdit.newGrade = data.newGrade;
    gradeEdit.feedback = data.feedback || null;

    const saved = await this.gradeEditRepository.save(gradeEdit);

    // Create outbox event to sync to Moodle immediately
    try {
      await this.outboxService.createEvent(OutboxEventType.GRADE_UPDATED, {
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        userMoodleId: data.studentMoodleId,
        grade: data.newGrade,
        feedback: data.feedback || '',
      });
      this.logger.log(
        `Grade edit queued for Moodle sync: course=${data.courseMoodleId}, student=${data.studentMoodleId}, grade=${data.newGrade}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue grade sync to Moodle: ${error.message}`,
      );
      // Don't throw - the local edit was saved successfully
    }

    // Audit log
    await this.auditService.log({
      entity: 'GradeEdit',
      entityKey: saved.id.toString(),
      action: 'CREATE',
      actorUserId: teacherUserId,
      afterData: {
        courseMoodleId: data.courseMoodleId,
        itemMoodleId: data.itemMoodleId,
        studentMoodleId: data.studentMoodleId,
        previousGrade: saved.previousGrade,
        newGrade: data.newGrade,
      },
    });

    return {
      success: true,
      gradeEdit: saved,
      message: 'Nota guardada y enviada a Moodle',
    };
  }

  /**
   * Get editable grades for a course (teacher view)
   * A grade is NOT editable if it was already edited by ANY teacher in the current session
   */
  async getEditableGrades(courseMoodleId: number) {
    const result = await this.getGradesByCourse(courseMoodleId);
    const activeSession = await this.getActiveSession();

    // If no active session, nothing is editable
    if (!activeSession) {
      result.participants = result.participants.map((p) => ({
        ...p,
        grades: p.grades.map((g) => ({ ...g, editable: false })),
      }));
      return result;
    }

    // Get ALL edits for this course in this session (by ANY teacher)
    const allEditsInSession = await this.gradeEditRepository.find({
      where: {
        sessionId: activeSession.id,
        courseMoodleId,
      },
    });

    // Mark each grade as editable or not
    result.participants = result.participants.map((p) => ({
      ...p,
      grades: p.grades.map((g) => {
        const wasEditedByAnyTeacher = allEditsInSession.some(
          (e) =>
            Number(e.itemMoodleId) === g.itemMoodleId &&
            Number(e.studentMoodleId) === p.studentMoodleId,
        );
        return {
          ...g,
          editable: !wasEditedByAnyTeacher,
        };
      }),
    }));

    return result;
  }
}
