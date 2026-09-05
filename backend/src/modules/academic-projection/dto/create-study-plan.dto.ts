import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateStudyPlanDto {
  @IsInt()
  @IsNotEmpty()
  courseMoodleId: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  level: number;
}
