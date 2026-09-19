import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateStudentGradeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  totalGrade?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateStudentGradeDto {
  @IsNumber()
  courseMoodleId: number;

  @IsNumber()
  studentId: number;

  @IsNumber()
  periodId: number;

  @IsString()
  @IsOptional()
  courseName?: string;

  @IsString()
  @IsOptional()
  courseShortname?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  totalGrade?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
