import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { LocalGrade } from '../academic/entities/local-grade.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { PeriodAvailableCourse } from '../academic/entities/period-available-course.entity';
import { MoodleCourse } from '../moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../moodle-integration/entities/moodle-enrolment.entity';
import { MoodleUser } from '../moodle-integration/entities/moodle-user.entity';
import { User } from '../users/entities/user.entity';

// Services
import { ReportsService } from './services/reports.service';
import { ExcelService } from './services/excel.service';
import { PdfService } from './services/pdf.service';

// Controller
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LocalGrade,
      AcademicPeriod,
      PeriodAvailableCourse,
      MoodleCourse,
      MoodleEnrolment,
      MoodleUser,
      User,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ExcelService, PdfService],
  exports: [ReportsService, ExcelService, PdfService],
})
export class ReportsModule {}
