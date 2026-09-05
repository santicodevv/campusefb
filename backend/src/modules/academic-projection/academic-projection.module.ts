import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodleIntegrationModule } from '../moodle-integration/moodle-integration.module';
import { UsersModule } from '../users/users.module';
import { AcademicProgram } from './entities/academic-program.entity';
import { StudyPlan } from './entities/study-plan.entity';
import { StudentProgram } from './entities/student-program.entity';
import { CourseStudentGrade } from '../academic/entities/course-student-grade.entity';
import { User } from '../users/entities/user.entity';
import { ProjectionService } from './academic-projection.service';
import { ProjectionExcelService } from './services/projection-excel.service';
import { ProjectionController } from './academic-projection.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicProgram,
      StudyPlan,
      StudentProgram,
      CourseStudentGrade,
      User,
    ]),
    MoodleIntegrationModule,
    UsersModule,
  ],
  controllers: [ProjectionController],
  providers: [ProjectionService, ProjectionExcelService],
  exports: [ProjectionService],
})
export class AcademicProjectionModule {}
