import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

export class CreateProgramCourseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  fullname: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  shortname: string;

  @IsString()
  @IsOptional()
  idnumber?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsString()
  @IsOptional()
  startdate?: string;

  @IsString()
  @IsOptional()
  enddate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  subjectName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  code?: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  level: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  materiaMoodleId?: number;
}
