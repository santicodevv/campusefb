import {
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTranscriptDto {
  @IsNumber()
  @Type(() => Number)
  studentId: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  periodIds?: number[];
}

export class RevokeTranscriptDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
