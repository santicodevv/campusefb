import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  grade?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
