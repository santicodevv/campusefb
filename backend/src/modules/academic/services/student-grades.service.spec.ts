import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseStudentGrade } from '../entities/course-student-grade.entity';
import { CourseTeacher } from '../entities/course-teacher.entity';
import { GradeEditSession } from '../entities/grade-edit-session.entity';
import { PeriodAvailableCourse } from '../entities/period-available-course.entity';
import { MoodleCourse } from '../../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleGrade } from '../../moodle-integration/entities/moodle-grade.entity';
import { MoodleGradeItem } from '../../moodle-integration/entities/moodle-grade-item.entity';
import { User } from '../../users/entities/user.entity';
import { AuditService } from '../../sync/services/audit.service';
import { StudentGradesService } from './student-grades.service';

type RepoMock = Record<'findOne' | 'create' | 'save', jest.Mock>;

const entities = [
  CourseStudentGrade,
  CourseTeacher,
  GradeEditSession,
  PeriodAvailableCourse,
  MoodleCourse,
  MoodleEnrolment,
  MoodleGrade,
  MoodleGradeItem,
  User,
];

describe('StudentGradesService.updateGrade', () => {
  let service: StudentGradesService;
  let repos: Map<unknown, RepoMock>;
  let auditService: { log: jest.Mock };
  const repo = (entity: unknown) => repos.get(entity)!;

  const courseMoodleId = 501;
  const studentId = 3;
  const periodId = 4;
  const teacherId = 10;
  const teacher = { id: teacherId, moodleUserId: 910 };
  const student = { id: studentId, moodleUserId: 901 };
  const savedGrade = {
    id: 7,
    courseMoodleId,
    studentId,
    periodId,
    teacherId,
    totalGrade: 69,
    comment: null,
  };

  const mockLookups = ({
    existing = null as object | null,
    assigned = true,
    sessionActive = false,
  } = {}) => {
    repo(MoodleCourse).findOne.mockResolvedValue({
      moodleId: courseMoodleId,
      shortname: 'TRCB01',
      fullname: 'Curso',
    });
    repo(User).findOne.mockImplementation(
      ({ where }: { where: { id: number } }) =>
        Promise.resolve(where.id === teacherId ? teacher : student),
    );
    repo(CourseStudentGrade).findOne.mockResolvedValue(
      existing ? { ...existing } : null,
    );
    repo(CourseTeacher).findOne.mockResolvedValue(
      assigned ? { teacherId, courseMoodleId } : null,
    );
    repo(MoodleEnrolment).findOne.mockResolvedValue(null);
    repo(GradeEditSession).findOne.mockResolvedValue(
      sessionActive ? { id: 1, isActive: true } : null,
    );
  };

  const update = (dto: object, isAdmin = false) =>
    service.updateGrade(
      courseMoodleId,
      studentId,
      periodId,
      dto,
      teacherId,
      isAdmin,
    );

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
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        StudentGradesService,
        ...entities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: repo(entity),
        })),
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(StudentGradesService);
  });

  it('el profesor asignado registra la primera nota sin sesión de edición', async () => {
    mockLookups();

    const saved = await update({ totalGrade: 85 });

    expect(saved.totalGrade).toBe(85);
    expect(repo(CourseStudentGrade).save).toHaveBeenCalled();
  });

  it('no permite calificar a un profesor que no está asignado al curso', async () => {
    mockLookups({ assigned: false });

    await expect(update({ totalGrade: 85 })).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo(CourseStudentGrade).save).not.toHaveBeenCalled();
  });

  it('acepta como asignado al profesor matriculado como teacher en Moodle', async () => {
    mockLookups({ assigned: false });
    repo(MoodleEnrolment).findOne.mockResolvedValue({
      roleCode: 'editingteacher',
    });

    await expect(update({ totalGrade: 85 })).resolves.toBeDefined();
  });

  it('bloquea la corrección de una nota registrada sin sesión de edición activa', async () => {
    mockLookups({ existing: savedGrade });

    await expect(update({ totalGrade: 70, reason: 'Error' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo(CourseStudentGrade).save).not.toHaveBeenCalled();
  });

  it('exige el motivo para corregir una nota registrada', async () => {
    mockLookups({ existing: savedGrade, sessionActive: true });

    await expect(update({ totalGrade: 70, reason: '   ' })).rejects.toThrow(
      new BadRequestException('Debe indicar el motivo de la corrección.'),
    );
    expect(repo(CourseStudentGrade).save).not.toHaveBeenCalled();
  });

  it('con sesión activa corrige la nota varias veces y audita el motivo', async () => {
    mockLookups({ existing: savedGrade, sessionActive: true });
    const first = await update({
      totalGrade: 70,
      reason: 'Aviso del profesor',
    });
    expect(first.totalGrade).toBe(70);

    mockLookups({
      existing: { ...savedGrade, totalGrade: 70 },
      sessionActive: true,
    });
    const second = await update({ totalGrade: 72, reason: 'Segunda revisión' });
    expect(second.totalGrade).toBe(72);

    expect(auditService.log).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'student_grade.updated',
        beforeData: expect.objectContaining({ totalGrade: 70 }),
        afterData: expect.objectContaining({
          totalGrade: 72,
          reason: 'Segunda revisión',
        }),
      }),
    );
  });

  it('el admin corrige siempre, sin sesión ni motivo', async () => {
    mockLookups({ existing: savedGrade, assigned: false });

    const saved = await update({ totalGrade: 70 }, true);

    expect(saved.totalGrade).toBe(70);
    expect(repo(GradeEditSession).findOne).not.toHaveBeenCalled();
  });
});
