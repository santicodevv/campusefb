import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocalGrade } from '../entities/local-grade.entity';
import {
  AcademicPeriod,
  AcademicPeriodStatus,
} from '../entities/academic-period.entity';
import { GradeEditSession } from '../entities/grade-edit-session.entity';
import { GradeEdit } from '../entities/grade-edit.entity';
import { CourseTeacher } from '../entities/course-teacher.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleUser } from '../../moodle-integration/entities/moodle-user.entity';
import { MoodleSyncService } from '../../moodle-integration/moodle-sync.service';
import { User } from '../../users/entities/user.entity';
import { OutboxService } from '../../sync/services/outbox.service';
import { AuditService } from '../../sync/services/audit.service';
import { OutboxEventType } from '../../sync/entities/outbox-event.entity';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { GradesService } from './grades.service';

type RepoMock = Record<'findOne' | 'create' | 'save', jest.Mock>;

const entities = [
  LocalGrade,
  AcademicPeriod,
  GradeEditSession,
  GradeEdit,
  MoodleCourse,
  MoodleGradeItem,
  MoodleGrade,
  MoodleEnrolment,
  MoodleUser,
  User,
  CourseTeacher,
];

describe('GradesService', () => {
  let service: GradesService;
  let repos: Map<unknown, RepoMock>;
  let outboxService: { createEvent: jest.Mock };
  const repo = (entity: unknown) => repos.get(entity)!;

  const teacherId = 10;
  const course = { id: 1, moodleId: 501 };
  const gradeItem = {
    id: 2,
    itemMoodleId: 701,
    courseMoodleId: 501,
    grademin: 0,
    grademax: 100,
  };
  const student = { id: 3, moodleUserId: 901 };
  const teacher = { id: teacherId, roles: [{ code: 'TEACHER' }] };
  const dto: CreateGradeDto = {
    courseId: 1,
    gradeItemId: 2,
    studentId: 3,
    periodId: 4,
    grade: 85,
    feedback: 'Bien',
  };

  const mockCreateLookups = (status: AcademicPeriodStatus) => {
    repo(AcademicPeriod).findOne.mockResolvedValue({ id: 4, status });
    repo(MoodleCourse).findOne.mockResolvedValue(course);
    repo(MoodleGradeItem).findOne.mockResolvedValue(gradeItem);
    repo(User).findOne.mockImplementation(
      ({ where }: { where: { id: number } }) =>
        Promise.resolve(where.id === teacherId ? teacher : student),
    );
    repo(MoodleEnrolment).findOne.mockResolvedValue({ enrolStatus: 'active' });
    repo(LocalGrade).findOne.mockResolvedValue(null);
  };

  beforeEach(async () => {
    repos = new Map(
      entities.map((entity) => [
        entity,
        {
          findOne: jest.fn(),
          create: jest.fn((data: object) => ({ ...data })),
          save: jest.fn((data: object) => Promise.resolve({ id: 99, ...data })),
        },
      ]),
    );
    outboxService = {
      createEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        GradesService,
        ...entities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: repo(entity),
        })),
        { provide: OutboxService, useValue: outboxService },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: MoodleSyncService, useValue: {} },
      ],
    }).compile();

    service = module.get(GradesService);
  });

  describe('create', () => {
    it.each([AcademicPeriodStatus.CLOSED, AcademicPeriodStatus.PLANNED])(
      'no permite calificar en un período %s',
      async (status) => {
        mockCreateLookups(status);

        await expect(service.create(dto, teacherId)).rejects.toThrow(
          new BadRequestException('El período académico no está abierto'),
        );
        expect(repo(LocalGrade).save).not.toHaveBeenCalled();
        expect(outboxService.createEvent).not.toHaveBeenCalled();
      },
    );

    it('guarda la nota y encola la sincronización con Moodle', async () => {
      mockCreateLookups(AcademicPeriodStatus.OPEN);

      const saved = await service.create(dto, teacherId);

      expect(outboxService.createEvent).toHaveBeenCalledWith(
        OutboxEventType.GRADE_UPDATED,
        {
          courseMoodleId: course.moodleId,
          itemMoodleId: gradeItem.itemMoodleId,
          userMoodleId: student.moodleUserId,
          grade: 85,
          feedback: 'Bien',
        },
      );
      expect(saved.outboxEventId).toBe('evt-1');
      expect(saved.syncedToMoodle).toBe(false);
    });

    it('rechaza notas fuera del rango del item', async () => {
      mockCreateLookups(AcademicPeriodStatus.OPEN);

      await expect(
        service.create({ ...dto, grade: 101 }, teacherId),
      ).rejects.toThrow('La calificación debe estar entre 0 y 100');
      expect(outboxService.createEvent).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existingGrade = (status: AcademicPeriodStatus) => ({
      id: 7,
      teacherId,
      gradeItemId: gradeItem.id,
      grade: 60,
      feedback: null,
      period: { status },
      course,
      gradeItem,
      student,
    });

    it('no permite modificar una nota de un período cerrado', async () => {
      repo(LocalGrade).findOne.mockResolvedValue(
        existingGrade(AcademicPeriodStatus.CLOSED),
      );

      await expect(service.update(7, { grade: 90 }, teacherId)).rejects.toThrow(
        'El período académico está cerrado',
      );
      expect(repo(LocalGrade).save).not.toHaveBeenCalled();
      expect(outboxService.createEvent).not.toHaveBeenCalled();
    });

    it('actualiza la nota y encola la sincronización con Moodle', async () => {
      repo(LocalGrade).findOne.mockResolvedValue(
        existingGrade(AcademicPeriodStatus.OPEN),
      );
      repo(MoodleGradeItem).findOne.mockResolvedValue(gradeItem);

      const updated = await service.update(7, { grade: 100 }, teacherId);

      expect(outboxService.createEvent).toHaveBeenCalledWith(
        OutboxEventType.GRADE_UPDATED,
        expect.objectContaining({
          courseMoodleId: course.moodleId,
          userMoodleId: student.moodleUserId,
          grade: 100,
        }),
      );
      expect(updated.syncedToMoodle).toBe(false);
      expect(updated.outboxEventId).toBe('evt-1');
    });
  });
});
