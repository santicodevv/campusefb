import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncModule } from '../sync/sync.module';
import { MoodleIntegrationModule } from '../moodle-integration/moodle-integration.module';
import { UsersModule } from '../users/users.module';

// Entities
import { AcademicPeriod } from './entities/academic-period.entity';
import { ReEnrolmentRequest } from './entities/re-enrolment-request.entity';
import { ReEnrolmentLine } from './entities/re-enrolment-line.entity';
import { LocalGrade } from './entities/local-grade.entity';
import { GradeEditSession } from './entities/grade-edit-session.entity';
import { GradeEdit } from './entities/grade-edit.entity';
import { PeriodAvailableCourse } from './entities/period-available-course.entity';
import { CourseStudentGrade } from './entities/course-student-grade.entity';
import { CourseTeacher } from './entities/course-teacher.entity';

// Services
import { PeriodsService } from './services/periods.service';
import { ReEnrolmentService } from './services/re-enrolment.service';
import { GradesService } from './services/grades.service';
import { CoursesService } from './services/courses.service';
import { StudentGradesService } from './services/student-grades.service';

// Controllers
import { PeriodsController } from './controllers/periods.controller';
import { ReEnrolmentController } from './controllers/re-enrolment.controller';
import { GradesController } from './controllers/grades.controller';
import { CoursesController } from './controllers/courses.controller';
import { StudentGradesController } from './controllers/student-grades.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicPeriod,
      ReEnrolmentRequest,
      ReEnrolmentLine,
      LocalGrade,
      GradeEditSession,
      GradeEdit,
      PeriodAvailableCourse,
      CourseStudentGrade,
      CourseTeacher,
    ]),
    SyncModule, // Para OutboxService y AuditService
    MoodleIntegrationModule, // Para MoodleCourse, MoodleGradeItem, MoodleEnrolment
    UsersModule, // Para User
  ],
  controllers: [
    PeriodsController,
    ReEnrolmentController,
    GradesController,
    CoursesController,
    StudentGradesController,
  ],
  providers: [
    PeriodsService,
    ReEnrolmentService,
    GradesService,
    CoursesService,
    StudentGradesService,
  ],
  exports: [
    PeriodsService,
    ReEnrolmentService,
    GradesService,
    CoursesService,
    StudentGradesService,
  ],
})
export class AcademicModule {}
