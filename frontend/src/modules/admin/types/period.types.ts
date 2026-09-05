// Academic Period types

export type PeriodStatus = 'planned' | 'open' | 'closed';

export interface AcademicPeriod {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  description?: string;
  // Campos de reinscripción
  reenrolmentStartDate?: string | null;
  reenrolmentEndDate?: string | null;
  reenrolmentOpen: boolean;
  moodleCategoryId?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Curso disponible para reinscripción
export interface PeriodAvailableCourse {
  id: number;
  periodId: number;
  courseMoodleId: number;
  courseName: string | null;
  courseShortname: string | null;
  categoryMoodleId?: number | null;
  enabled: boolean;
  maxStudents?: number | null;
  enrolledCount: number;
  createdAt: string;
}

// Request types
export interface CreatePeriodRequest {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: PeriodStatus;
}

export interface UpdatePeriodRequest {
  code?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: PeriodStatus;
}

export interface ReenrolmentConfigRequest {
  reenrolmentStartDate?: string;
  reenrolmentEndDate?: string;
  moodleCategoryId?: number;
}

export interface AddAvailableCoursesRequest {
  courses: {
    courseMoodleId: number;
    courseName?: string;
    courseShortname?: string;
    categoryMoodleId?: number;
    maxStudents?: number;
  }[];
}

export interface UpdateAvailableCourseRequest {
  enabled?: boolean;
  maxStudents?: number;
}

// Query params
export interface PeriodsQueryParams {
  status?: PeriodStatus;
  page?: number;
  limit?: number;
}
