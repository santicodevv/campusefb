import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateStudentGradeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  totalGrade?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  // Motivo de la corrección: obligatorio para el profesor al modificar una nota ya registrada
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
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
