import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCourseDto {
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

  @IsNumber()
  @IsNotEmpty()
  categoryid: number;

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
}
