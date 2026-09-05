import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MoodleClientService } from './moodle-client.service';
import { MoodleSyncService } from './moodle-sync.service';
import { MoodleUser } from './entities/moodle-user.entity';
import { MoodleCourse } from './entities/moodle-course.entity';
import { MoodleEnrolment } from './entities/moodle-enrolment.entity';
import { MoodleGradeItem } from './entities/moodle-grade-item.entity';
import { MoodleGrade } from './entities/moodle-grade.entity';
import { MoodleCategory } from './entities/moodle-category.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { CourseTeacher } from '../academic/entities/course-teacher.entity';
import { AcademicProgram } from '../academic-projection/entities/academic-program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MoodleUser,
      MoodleCourse,
      MoodleEnrolment,
      MoodleGradeItem,
      MoodleGrade,
      MoodleCategory,
      User,
      Role,
      CourseTeacher,
      AcademicProgram,
    ]),
    BullModule.registerQueue({ name: 'moodle-inbound' }),
  ],
  providers: [MoodleClientService, MoodleSyncService],
  exports: [MoodleClientService, MoodleSyncService, TypeOrmModule],
})
export class MoodleIntegrationModule {}
