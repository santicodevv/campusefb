import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  @IsNotEmpty()
  code: string; // 2024-1

  @IsString()
  @IsNotEmpty()
  name: string; // Primer Cuatrimestre 2024

  @IsDateString()
  @IsNotEmpty()
  startDate: string; // 2024-01-15

  @IsDateString()
  @IsNotEmpty()
  endDate: string; // 2024-05-15

  @IsString()
  @IsOptional()
  description?: string;
}
