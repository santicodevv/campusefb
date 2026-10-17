import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { entities } from '../../config/entities';
import { MoodleClientService } from '../moodle-integration/moodle-client.service';
import { ProjectionService } from './academic-projection.service';
import { ProgramCompletionStatus } from './dto/program-completion-status';

describe('ProjectionService student grades matrix', () => {
  let service: ProjectionService;
  let repositories: Map<string, { find: jest.Mock }>;
  let query: Record<string, jest.Mock>;

  beforeEach(async () => {
    query = {};
    for (const method of [
      'where',
      'andWhere',
      'orderBy',
      'addOrderBy',
      'skip',
      'take',
    ]) {
      query[method] = jest.fn().mockReturnValue(query);
    }
    query.getCount = jest.fn().mockResolvedValue(1);
    query.getMany = jest
      .fn()
      .mockResolvedValue([
        {
          moodleId: '10',
          firstname: 'Estudiante',
          lastname: 'Prueba',
          suspended: false,
        },
      ]);
    repositories = new Map(
      entities.map((entity) => [
        entity.name,
        {
          find: jest.fn().mockResolvedValue([]),
          createQueryBuilder: jest.fn().mockReturnValue(query),
        },
      ]),
    );
    const module = await Test.createTestingModule({
      providers: [
        ProjectionService,
        { provide: MoodleClientService, useValue: {} },
        ...entities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: repositories.get(entity.name),
        })),
      ],
    }).compile();
    service = module.get(ProjectionService);
    repositories
      .get('MoodleCategory')!
      .find.mockResolvedValue([
        { moodleId: '1', parent: '0', name: 'Programa' },
      ]);
    repositories
      .get('MoodleCourse')!
      .find.mockResolvedValue(
        [1, 2, 3, 4, 5].map((id) => ({
          moodleId: String(id),
          categoryId: '1',
          fullname: `Curso ${id}`,
        })),
      );
    repositories
      .get('User')!
      .find.mockResolvedValue([{ id: '100', moodleUserId: '10' }]);
  });

  it('counts 70 and above, excluding missing, zero and failing final grades', async () => {
    repositories.get('CourseStudentGrade')!.find.mockResolvedValue([
      { studentId: '100', courseMoodleId: '1', totalGrade: '70.00' },
      { studentId: '100', courseMoodleId: '2', totalGrade: '69.99' },
      { studentId: '100', courseMoodleId: '3', totalGrade: '0.00' },
      { studentId: '100', courseMoodleId: '4', totalGrade: '100.00' },
    ]);
    const result = await service.getStudentGradesMatrix(1);
    expect(result.students[0].completedCourseCount).toBe(2);
    expect(result.students[0].grades).toEqual({
      1: 70,
      2: 69.99,
      3: 0,
      4: 100,
      5: null,
    });
  });

  it('uses the latest non-null final grade when a course has multiple periods', async () => {
    repositories.get('CourseStudentGrade')!.find.mockResolvedValue([
      { studentId: '100', courseMoodleId: '1', totalGrade: '60.00' },
      { studentId: '100', courseMoodleId: '1', totalGrade: '95.00' },
    ]);
    const result = await service.getStudentGradesMatrix(1);
    expect(result.students[0].completedCourseCount).toBe(0);
    expect(result.students[0].grades[1]).toBe(60);
    expect(repositories.get('CourseStudentGrade')!.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { updatedAt: 'DESC', id: 'DESC' } }),
    );
  });

  it.each([
    [ProgramCompletionStatus.COMPLETED, '='],
    [ProgramCompletionStatus.PENDING, '<'],
  ])(
    'filters %s before counting and paginating with the same approval threshold',
    async (status, operator) => {
      await service.getStudentGradesMatrix(1, 2, 10, 'Estudiante', status);
      expect(query.andWhere).toHaveBeenCalledWith(
        expect.stringContaining(`) ${operator} :requiredCourses`),
        { passingGrade: 70, requiredCourses: 5 },
      );
      expect(query.andWhere.mock.invocationCallOrder.at(-1)).toBeLessThan(
        query.getCount.mock.invocationCallOrder[0],
      );
      expect(query.getCount.mock.invocationCallOrder[0]).toBeLessThan(
        query.skip.mock.invocationCallOrder[0],
      );
      expect(query.skip).toHaveBeenCalledWith(10);
      expect(query.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('CONCAT_WS'),
        { studentSearch0: '%Estudiante%' },
      );
    },
  );

  it('returns no completed students for a selection without courses', async () => {
    repositories.get('MoodleCourse')!.find.mockResolvedValue([]);
    const result = await service.getStudentGradesMatrix(
      1,
      1,
      10,
      undefined,
      ProgramCompletionStatus.COMPLETED,
    );
    expect(result).toEqual({
      courses: [],
      students: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    expect(query.getCount).not.toHaveBeenCalled();
  });
});
