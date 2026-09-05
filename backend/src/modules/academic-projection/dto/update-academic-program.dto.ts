import { IsString, IsOptional } from 'class-validator';

export class UpdateAcademicProgramDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
