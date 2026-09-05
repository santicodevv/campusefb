// Course types (from Moodle mirror)

export interface MoodleCourse {
  id: number;
  moodleId: number;
  shortname: string;
  fullname: string;
  categoryId?: number;
  idnumber?: string;
  summary?: string;
  visible: boolean;
  startdate?: string;
  enddate?: string;
  subjectName?: string;
  code?: string;
  timemodified?: string;
  lastSyncedAt?: string;
}

export interface MoodleEnrolment {
  id: number;
  courseMoodleId: number;
  userMoodleId: number;
  roleCode: string;
  enrolStatus: 'active' | 'suspended';
  timestart?: string;
  timeend?: string;
  timemodified?: string;
  lastSyncedAt?: string;
}

// Extended course with student count
export interface CourseWithStats extends MoodleCourse {
  studentCount: number;
  teacherCount: number;
  pendingGrades?: number;
}

// Student enrolled in a course
export interface EnrolledStudent {
  moodleUserId: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  roleCode: string;
  enrolStatus: string;
}

// Query params
export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  visible?: boolean;
}

// Category from Moodle
export interface MoodleCategory {
  id: number;
  moodleId: number;
  name: string;
  parent?: number;
  description?: string;
  depth: number;
  path?: string;
  coursecount: number;
  visible: boolean;
  lastSyncedAt?: string;
}

// DTO for creating a course
export interface CreateCourseDto {
  fullname: string;
  shortname: string;
  categoryid: number;
  idnumber?: string;
  summary?: string;
  visible?: boolean;
  startdate?: string;
  enddate?: string;
  periodId?: number; // Optional: assign to academic period
  subjectName?: string;
  code?: string;
}

// Enrolled user with details
export interface EnrolledUserWithDetails {
  id: number;
  moodleId: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  roleCode: string;
  enrolStatus: string;
  lastCourseAccess: string | null;
}

// Course teacher assignment
export interface CourseTeacher {
  id: number;
  courseMoodleId: number;
  courseName: string | null;
  teacherId: number;
  isPrimary: boolean;
  createdAt: string;
  teacher?: {
    id: number;
    email: string;
    displayName: string;
  };
}

// Interfaces added for Courses page refactoring
export interface Course {
  id: number;
  moodleId: number;
  shortname: string;
  fullname: string;
  categoryId?: number;
  idnumber?: string;
  summary?: string;
  visible: boolean;
  startdate?: string;
  enddate?: string;
  studentCount?: number;
  teacherCount?: number;
  subjectName?: string;
  code?: string;
  lastSyncedAt?: string;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

export interface CourseGradeData {
  studentName: string;
  studentEmail: string;
  periodName: string | null;
  moodleSumGrade: number | null;
  moodleSumMax: number | null;
  totalGrade: number | null;
  comment: string | null;
}
