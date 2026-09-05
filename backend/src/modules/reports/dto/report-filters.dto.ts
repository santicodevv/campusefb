import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExportFormat {
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export class StudentGradesFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.JSON;
}

export class CourseGradesFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gradeItemId?: number;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.JSON;
}

export class PeriodReportFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.JSON;
}

export class GlobalSummaryFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  periodId?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
