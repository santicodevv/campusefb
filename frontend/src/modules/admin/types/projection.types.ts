export interface AcademicProgram {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  moodleCategoryId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlan {
  id: number;
  programId: number;
  courseMoodleId: number;
  level: number;
  courseName?: string;
  createdAt: string;
}

export interface StudyPlanMateria {
  id: number;
  moodleId: number;
  name: string;
  cursos: StudyPlanCourse[];
}

export interface StudyPlanCourse {
  id: number;
  courseMoodleId: number;
  courseName: string;
  level: number;
}

export interface StudyPlansByCategory {
  materias: StudyPlanMateria[];
}

export interface StudentProgram {
  id: number;
  userId: number;
  programId: number;
  entryDate: string;
  createdAt: string;
}

export interface PendingSubject {
  studentId: number;
  courseMoodleId: number;
  level: number;
  status: 'approved' | 'failed' | 'pending';
}

export interface DemandBySubject {
  courseMoodleId: number;
  courseName: string;
  pendingCount: number;
  failedCount: number;
  totalDemand: number;
  studentsPerSection: number;
  sectionsNeeded: number;
}

export interface DemandByLevel {
  level: number;
  studentCount: number;
}

export interface SectionProjection {
  courseMoodleId: number;
  courseName: string;
  pendingCount: number;
  sectionsNeeded: number;
}

export interface ProjectionMatrixRow {
  studentId: number;
  studentName?: string;
  courses: {
    courseMoodleId: number;
    courseName: string;
    status: 'pending' | 'approved';
  }[];
}

export interface CreateAcademicProgramRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateAcademicProgramRequest {
  name?: string;
  code?: string;
  description?: string;
}

export interface CreateStudyPlanRequest {
  courseMoodleId: number;
  level: number;
}

export interface CreateProgramCourseRequest {
  fullname: string;
  shortname: string;
  level: number;
  subjectName?: string;
  code?: string;
  idnumber?: string;
  summary?: string;
  visible?: boolean;
  startdate?: string;
  enddate?: string;
  materiaMoodleId?: number;
}

export interface AutoAssignResult {
  programsProcessed: number;
  coursesAssigned: number;
  coursesSkipped: number;
}

export interface AssignStudentProgramRequest {
  userId: number;
  programId: number;
  entryDate?: string;
}

export interface ProjectionStudent {
  moodleId: number;
  studentName: string;
  username: string | null;
  matriculation: string | null;
  email: string | null;
  suspended: boolean;
  programIds: number[];
}

export interface PagedProjectionStudents {
  students: ProjectionStudent[];
  total: number;
  page: number;
  limit: number;
}

export interface ToggleStudentProgramResult {
  assigned: boolean;
  studentProgram?: StudentProgram;
}

export interface CategoryCourse {
  moodleId: number;
  shortname: string;
  fullname: string;
  categoryId: number;
  visible: boolean;
}

export interface CategoryHierarchyNode {
  id: number;
  moodleId: number;
  name: string;
  parent: number;
  depth: number;
  coursecount: number;
  visible: boolean;
  courses: CategoryCourse[];
  children: CategoryHierarchyNode[];
}

export interface StudentGradeByProgram {
  studentMoodleId: number;
  studentName: string;
  courseMoodleId: number;
  courseName: string;
  grade: number;
}

export interface PagedStudentGrades {
  data: StudentGradeByProgram[];
  total: number;
  page: number;
  limit: number;
}

export interface GradeMatrixCourse {
  id: number;
  shortname: string | null;
  name: string;
}

export interface GradeMatrixStudent {
  moodleId: number;
  name: string;
  suspended: boolean;
  grades: Record<number, number | null>;
}

export interface StudentGradesMatrix {
  courses: GradeMatrixCourse[];
  students: GradeMatrixStudent[];
  total: number;
  page: number;
  limit: number;
}
