import { IsInt, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class AssignStudentProgramDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  programId: number;

  @IsDateString()
  @IsOptional()
  entryDate?: string;
}
