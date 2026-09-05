import {
  IsNumber,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReEnrolmentCourseDto {
  @IsNumber()
  @IsNotEmpty()
  courseMoodleId: number;
}

export class CreateReEnrolmentDto {
  @IsNumber()
  @IsNotEmpty()
  periodId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReEnrolmentCourseDto)
  courses: ReEnrolmentCourseDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
