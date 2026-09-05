import {
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReenrolmentConfigDto {
  @IsDateString()
  @IsOptional()
  reenrolmentStartDate?: string;

  @IsDateString()
  @IsOptional()
  reenrolmentEndDate?: string;

  @IsNumber()
  @IsOptional()
  moodleCategoryId?: number;
}

export class AddAvailableCourseDto {
  @IsNumber()
  courseMoodleId: number;

  @IsOptional()
  courseName?: string;

  @IsOptional()
  courseShortname?: string;

  @IsNumber()
  @IsOptional()
  categoryMoodleId?: number;

  @IsNumber()
  @IsOptional()
  maxStudents?: number;
}

export class AddAvailableCoursesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddAvailableCourseDto)
  courses: AddAvailableCourseDto[];
}

export class UpdateAvailableCourseDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  maxStudents?: number;
}

export class RemoveAvailableCoursesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  courseMoodleIds: number[];
}
