// Entidades de usuarios
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/users/entities/role.entity';

// Entidades de Moodle
import { MoodleUser } from '../modules/moodle-integration/entities/moodle-user.entity';
import { MoodleCourse } from '../modules/moodle-integration/entities/moodle-course.entity';
import { MoodleEnrolment } from '../modules/moodle-integration/entities/moodle-enrolment.entity';
import { MoodleGradeItem } from '../modules/moodle-integration/entities/moodle-grade-item.entity';
import { MoodleGrade } from '../modules/moodle-integration/entities/moodle-grade.entity';
import { MoodleCategory } from '../modules/moodle-integration/entities/moodle-category.entity';

// Entidades de sincronización
import { OutboxEvent } from '../modules/sync/entities/outbox-event.entity';
import { SyncState } from '../modules/sync/entities/sync-state.entity';
import { AuditLog } from '../modules/sync/entities/audit-log.entity';

// Entidades académicas
import { AcademicPeriod } from '../modules/academic/entities/academic-period.entity';
import { ReEnrolmentRequest } from '../modules/academic/entities/re-enrolment-request.entity';
import { ReEnrolmentLine } from '../modules/academic/entities/re-enrolment-line.entity';
import { LocalGrade } from '../modules/academic/entities/local-grade.entity';
import { GradeEditSession } from '../modules/academic/entities/grade-edit-session.entity';
import { GradeEdit } from '../modules/academic/entities/grade-edit.entity';
import { PeriodAvailableCourse } from '../modules/academic/entities/period-available-course.entity';
import { CourseStudentGrade } from '../modules/academic/entities/course-student-grade.entity';
import { CourseTeacher } from '../modules/academic/entities/course-teacher.entity';

// Entidades de certificados
import { Transcript } from '../modules/transcripts/entities/transcript.entity';

// Entidades de proyección académica
import { AcademicProgram } from '../modules/academic-projection/entities/academic-program.entity';
import { StudyPlan } from '../modules/academic-projection/entities/study-plan.entity';
import { StudentProgram } from '../modules/academic-projection/entities/student-program.entity';

export const entities = [
  // Users
  User,
  Role,
  // Moodle
  MoodleUser,
  MoodleCourse,
  MoodleEnrolment,
  MoodleGradeItem,
  MoodleGrade,
  MoodleCategory,
  // Sync
  OutboxEvent,
  SyncState,
  AuditLog,
  // Academic
  AcademicPeriod,
  ReEnrolmentRequest,
  ReEnrolmentLine,
  LocalGrade,
  GradeEditSession,
  GradeEdit,
  PeriodAvailableCourse,
  CourseStudentGrade,
  CourseTeacher,
  // Transcripts
  Transcript,
  // Academic Projection
  AcademicProgram,
  StudyPlan,
  StudentProgram,
];
