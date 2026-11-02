import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGradeDto } from './create-grade.dto';
import { UpdateGradeDto } from './update-grade.dto';
import {
  CreateStudentGradeDto,
  UpdateStudentGradeDto,
} from './student-grade.dto';

type DtoClass = new () => object;

const cases: {
  name: string;
  dto: DtoClass;
  field: string;
  base: Record<string, unknown>;
}[] = [
  {
    name: 'CreateGradeDto',
    dto: CreateGradeDto,
    field: 'grade',
    base: { courseId: 1, gradeItemId: 2, studentId: 3, periodId: 4 },
  },
  { name: 'UpdateGradeDto', dto: UpdateGradeDto, field: 'grade', base: {} },
  {
    name: 'CreateStudentGradeDto',
    dto: CreateStudentGradeDto,
    field: 'totalGrade',
    base: { courseMoodleId: 1, studentId: 3, periodId: 4 },
  },
  {
    name: 'UpdateStudentGradeDto',
    dto: UpdateStudentGradeDto,
    field: 'totalGrade',
    base: {},
  },
];

describe.each(cases)('$name: rango de nota 0-100', ({ dto, field, base }) => {
  const errorsFor = async (value: number) => {
    const instance = plainToInstance(dto, { ...base, [field]: value });
    const errors = await validate(instance);
    return errors.filter((e) => e.property === field);
  };

  it.each([0, 50, 100, 99.5])('acepta %p', async (value) => {
    expect(await errorsFor(value)).toHaveLength(0);
  });

  it('rechaza valores menores a 0', async () => {
    const [error] = await errorsFor(-1);
    expect(error.constraints).toHaveProperty('min');
  });

  it('rechaza valores mayores a 100', async () => {
    const [error] = await errorsFor(101);
    expect(error.constraints).toHaveProperty('max');
  });

  it('rechaza 100.01 (el límite es inclusivo solo hasta 100)', async () => {
    const [error] = await errorsFor(100.01);
    expect(error.constraints).toHaveProperty('max');
  });
});
