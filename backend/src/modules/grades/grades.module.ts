import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodleIntegrationModule } from '../moodle-integration/moodle-integration.module';
import { GradeEditSession } from '../academic/entities/grade-edit-session.entity';
import { GradeEdit } from '../academic/entities/grade-edit.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

import { CourseTeacher } from '../academic/entities/course-teacher.entity';

@Module({
  imports: [
    MoodleIntegrationModule,
    TypeOrmModule.forFeature([GradeEditSession, GradeEdit, CourseTeacher]),
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
