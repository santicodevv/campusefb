import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  AcademicPeriod,
  AcademicPeriodStatus,
} from '../entities/academic-period.entity';
import { PeriodAvailableCourse } from '../entities/period-available-course.entity';
import { ReEnrolmentRequest } from '../entities/re-enrolment-request.entity';
import { ReEnrolmentLine } from '../entities/re-enrolment-line.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { CreatePeriodDto } from '../dto/create-period.dto';
import {
  ReenrolmentConfigDto,
  AddAvailableCoursesDto,
  UpdateAvailableCourseDto,
} from '../dto/reenrolment-config.dto';
import { AuditService } from '../../sync/services/audit.service';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly periodRepository: Repository<AcademicPeriod>,
    @InjectRepository(PeriodAvailableCourse)
    private readonly availableCourseRepository: Repository<PeriodAvailableCourse>,
    @InjectRepository(ReEnrolmentRequest)
    private readonly reenrolmentRequestRepository: Repository<ReEnrolmentRequest>,
    @InjectRepository(ReEnrolmentLine)
    private readonly reenrolmentLineRepository: Repository<ReEnrolmentLine>,
    @InjectRepository(MoodleCourse)
    private readonly courseRepository: Repository<MoodleCourse>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createPeriodDto: CreatePeriodDto,
    actorUserId?: number,
  ): Promise<AcademicPeriod> {
    // Verificar que no exista un período con el mismo código
    const existing = await this.periodRepository.findOne({
      where: { code: createPeriodDto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Period with code ${createPeriodDto.code} already exists`,
      );
    }

    // Validar fechas
    const startDate = new Date(createPeriodDto.startDate);
    const endDate = new Date(createPeriodDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const period = this.periodRepository.create({
      code: createPeriodDto.code,
      name: createPeriodDto.name,
      startDate,
      endDate,
      description: createPeriodDto.description,
      status: AcademicPeriodStatus.PLANNED,
    });

    const saved = await this.periodRepository.save(period);

    // Auditoría
    await this.auditService.log({
      actorUserId,
      action: 'period.created',
      entity: 'academic_periods',
      entityKey: saved.id.toString(),
      afterData: saved,
      source: 'app',
    });

    return saved;
  }

  async findAll(): Promise<AcademicPeriod[]> {
    return this.periodRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AcademicPeriod> {
    const period = await this.periodRepository.findOne({ where: { id } });

    if (!period) {
      throw new NotFoundException(`Period with ID ${id} not found`);
    }

    return period;
  }

  async findByCode(code: string): Promise<AcademicPeriod> {
    const period = await this.periodRepository.findOne({ where: { code } });

    if (!period) {
      throw new NotFoundException(`Period with code ${code} not found`);
    }

    return period;
  }

  async findActive(): Promise<AcademicPeriod[]> {
    return this.periodRepository.find({
      where: { status: AcademicPeriodStatus.OPEN },
      order: { startDate: 'DESC' },
    });
  }

  async open(id: number, actorUserId?: number): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    if (period.status === AcademicPeriodStatus.OPEN) {
      throw new ConflictException('Period is already open');
    }

    if (period.status === AcademicPeriodStatus.CLOSED) {
      throw new ConflictException('Cannot reopen a closed period');
    }

    const beforeData = { ...period };
    period.status = AcademicPeriodStatus.OPEN;
    const updated = await this.periodRepository.save(period);

    // Auditoría
    await this.auditService.log({
      actorUserId,
      action: 'period.opened',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async close(id: number, actorUserId?: number): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    if (period.status === AcademicPeriodStatus.CLOSED) {
      throw new ConflictException('Period is already closed');
    }

    const beforeData = { ...period };
    period.status = AcademicPeriodStatus.CLOSED;
    const updated = await this.periodRepository.save(period);

    // Auditoría
    await this.auditService.log({
      actorUserId,
      action: 'period.closed',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async update(
    id: number,
    updateData: Partial<CreatePeriodDto>,
    actorUserId?: number,
  ): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    const beforeData = { ...period };

    if (updateData.name) period.name = updateData.name;
    if (updateData.description !== undefined)
      period.description = updateData.description;
    if (updateData.startDate) period.startDate = new Date(updateData.startDate);
    if (updateData.endDate) period.endDate = new Date(updateData.endDate);

    // Validar fechas si se actualizan
    if (period.endDate <= period.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const updated = await this.periodRepository.save(period);

    // Auditoría
    await this.auditService.log({
      actorUserId,
      action: 'period.updated',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  // =====================
  // MÉTODOS DE REINSCRIPCIÓN
  // =====================

  async configureReenrolment(
    id: number,
    config: ReenrolmentConfigDto,
    actorUserId?: number,
  ): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    // NOTE: Se permite configurar reinscripción en períodos CERRADOS,
    // ya que la reinscripción ocurre justamente después de que el período cierra.

    const beforeData = { ...period };

    if (config.reenrolmentStartDate) {
      period.reenrolmentStartDate = new Date(config.reenrolmentStartDate);
    }
    if (config.reenrolmentEndDate) {
      period.reenrolmentEndDate = new Date(config.reenrolmentEndDate);
    }
    if (config.moodleCategoryId !== undefined) {
      period.moodleCategoryId = config.moodleCategoryId;
    }

    // Validar fechas de reinscripción
    if (period.reenrolmentStartDate && period.reenrolmentEndDate) {
      if (period.reenrolmentEndDate <= period.reenrolmentStartDate) {
        throw new BadRequestException(
          'La fecha de fin de reinscripción debe ser posterior a la fecha de inicio',
        );
      }
    }

    const updated = await this.periodRepository.save(period);

    await this.auditService.log({
      actorUserId,
      action: 'period.reenrolment_configured',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async openReenrolment(
    id: number,
    actorUserId?: number,
  ): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    // NOTE: Se permite abrir reinscripción en períodos CERRADOS.
    // La reinscripción es un proceso post-cierre del período.

    if (period.reenrolmentOpen) {
      throw new ConflictException('Reenrolment is already open');
    }

    // Verificar que hay fechas configuradas
    if (!period.reenrolmentStartDate || !period.reenrolmentEndDate) {
      throw new BadRequestException(
        'Reenrolment dates must be configured before opening',
      );
    }

    const beforeData = { ...period };
    period.reenrolmentOpen = true;
    const updated = await this.periodRepository.save(period);

    await this.auditService.log({
      actorUserId,
      action: 'period.reenrolment_opened',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async closeReenrolment(
    id: number,
    actorUserId?: number,
  ): Promise<AcademicPeriod> {
    const period = await this.findOne(id);

    if (!period.reenrolmentOpen) {
      throw new ConflictException('Reenrolment is already closed');
    }

    const beforeData = { ...period };
    period.reenrolmentOpen = false;
    const updated = await this.periodRepository.save(period);

    await this.auditService.log({
      actorUserId,
      action: 'period.reenrolment_closed',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async findOpenForReenrolment(): Promise<AcademicPeriod[]> {
    const now = new Date();

    return this.periodRepository
      .createQueryBuilder('period')
      .where('period.reenrolmentOpen = :open', { open: true })
      .andWhere('period.reenrolmentStartDate <= :now', { now })
      .andWhere('period.reenrolmentEndDate >= :now', { now })
      .orderBy('period.startDate', 'DESC')
      .getMany();
  }

  // =====================
  // CURSOS DISPONIBLES
  // =====================

  async getAvailableCourses(
    periodId: number,
  ): Promise<PeriodAvailableCourse[]> {
    await this.findOne(periodId);

    const courses = await this.availableCourseRepository.find({
      where: { periodId, enabled: true },
      order: { courseName: 'ASC' },
    });

    return this.enrichCoursesWithSubjectName(courses);
  }

  async getAllAvailableCourses(
    periodId: number,
  ): Promise<PeriodAvailableCourse[]> {
    await this.findOne(periodId);

    const courses = await this.availableCourseRepository.find({
      where: { periodId },
      order: { courseName: 'ASC' },
    });

    return this.enrichCoursesWithSubjectName(courses);
  }

  private async enrichCoursesWithSubjectName(
    courses: PeriodAvailableCourse[],
  ): Promise<PeriodAvailableCourse[]> {
    if (courses.length === 0) return courses;
    const moodleIds = courses.map((ac) => ac.courseMoodleId);
    const dbCourses = await this.courseRepository.find({
      where: { moodleId: In(moodleIds) },
    });
    const courseMap = new Map(dbCourses.map((c) => [c.moodleId, c]));
    for (const ac of courses) {
      const course = courseMap.get(ac.courseMoodleId);
      if (course && course.subjectName) {
        ac.courseName = course.subjectName;
      }
    }
    return courses;
  }

  async addAvailableCourses(
    periodId: number,
    dto: AddAvailableCoursesDto,
    actorUserId?: number,
  ): Promise<PeriodAvailableCourse[]> {
    await this.findOne(periodId);

    // NOTE: Se permite agregar cursos en períodos CERRADOS para configurar reinscripción.

    const coursesToAdd: PeriodAvailableCourse[] = [];

    for (const course of dto.courses) {
      // Verificar si ya existe
      const existing = await this.availableCourseRepository.findOne({
        where: { periodId, courseMoodleId: course.courseMoodleId },
      });

      if (existing) {
        // Si ya existe, actualizarlo
        existing.enabled = true;
        if (course.courseName) existing.courseName = course.courseName;
        if (course.courseShortname)
          existing.courseShortname = course.courseShortname;
        if (course.maxStudents !== undefined)
          existing.maxStudents = course.maxStudents;
        coursesToAdd.push(existing);
      } else {
        // Crear nuevo
        const newCourse = this.availableCourseRepository.create({
          periodId,
          courseMoodleId: course.courseMoodleId,
          courseName: course.courseName,
          courseShortname: course.courseShortname,
          categoryMoodleId: course.categoryMoodleId,
          maxStudents: course.maxStudents,
          enabled: true,
        });
        coursesToAdd.push(newCourse);
      }
    }

    const saved = await this.availableCourseRepository.save(coursesToAdd);

    await this.auditService.log({
      actorUserId,
      action: 'period.courses_added',
      entity: 'period_available_courses',
      entityKey: periodId.toString(),
      afterData: { periodId, courses: dto.courses },
      source: 'app',
    });

    return saved;
  }

  async updateAvailableCourse(
    periodId: number,
    courseMoodleId: number,
    dto: UpdateAvailableCourseDto,
    actorUserId?: number,
  ): Promise<PeriodAvailableCourse> {
    const course = await this.availableCourseRepository.findOne({
      where: { periodId, courseMoodleId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course ${courseMoodleId} not found in period ${periodId}`,
      );
    }

    const beforeData = { ...course };

    if (dto.enabled !== undefined) course.enabled = dto.enabled;
    if (dto.maxStudents !== undefined) course.maxStudents = dto.maxStudents;

    const updated = await this.availableCourseRepository.save(course);

    await this.auditService.log({
      actorUserId,
      action: 'period.course_updated',
      entity: 'period_available_courses',
      entityKey: `${periodId}:${courseMoodleId}`,
      beforeData,
      afterData: updated,
      source: 'app',
    });

    return updated;
  }

  async removeAvailableCourses(
    periodId: number,
    courseMoodleIds: number[],
    actorUserId?: number,
  ): Promise<void> {
    await this.findOne(periodId);

    await this.availableCourseRepository.delete({
      periodId,
      courseMoodleId: In(courseMoodleIds),
    });

    await this.auditService.log({
      actorUserId,
      action: 'period.courses_removed',
      entity: 'period_available_courses',
      entityKey: periodId.toString(),
      afterData: { periodId, removedCourses: courseMoodleIds },
      source: 'app',
    });
  }

  async delete(id: number, actorUserId?: number): Promise<void> {
    const period = await this.findOne(id);

    // Obtener todas las solicitudes de reinscripción del período
    const requests = await this.reenrolmentRequestRepository.find({
      where: { periodId: id },
    });

    // Eliminar líneas de reinscripción asociadas
    for (const request of requests) {
      await this.reenrolmentLineRepository.delete({ requestId: request.id });
    }

    // Eliminar solicitudes de reinscripción
    await this.reenrolmentRequestRepository.delete({ periodId: id });

    // Eliminar cursos disponibles asociados
    await this.availableCourseRepository.delete({ periodId: id });

    // Eliminar el período
    await this.periodRepository.delete(id);

    await this.auditService.log({
      actorUserId,
      action: 'period.deleted',
      entity: 'academic_periods',
      entityKey: id.toString(),
      beforeData: period,
      source: 'app',
    });
  }

  async isCoursesAvailableForReenrolment(
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

    const availableIds = availableCourses.map((c) => c.courseMoodleId);
    const invalidCourses = courseMoodleIds.filter(
      (id) => !availableIds.includes(id),
    );

    return {
      valid: invalidCourses.length === 0,
      invalidCourses,
    };
  }
}
