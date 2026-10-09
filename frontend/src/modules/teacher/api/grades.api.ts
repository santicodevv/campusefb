// Grades API service
import { api } from '@/shared/lib';
import type {
  LocalGrade,
  MoodleGradeItem,
  CreateGradeRequest,
  UpdateGradeRequest,
  BulkGradeRequest,
  GradesQueryParams,
  StudentGradeRow,
  StudentGradeReport,
  StudentGradeWithDetails,
  StudentCourseGrade,
  UpdateStudentGradeDto,
  SyncMoodleSumsResult,
  PaginatedResponse,
  SuccessResponse,
} from '@/shared/types';

export const gradesApi = {
  /**
   * Get grade items for a course
   */
  async getGradeItems(courseMoodleId: number): Promise<MoodleGradeItem[]> {
    const response = await api.get<MoodleGradeItem[]>(
      `/grades/items/${courseMoodleId}`
    );
    return response.data;
  },

  /**
   * Get grades for a specific item with student info
   */
  async getGradesByItem(
    courseMoodleId: number,
    itemMoodleId: number
  ): Promise<StudentGradeRow[]> {
    const response = await api.get<StudentGradeRow[]>(
      `/grades/courses/${courseMoodleId}/items/${itemMoodleId}`
    );
    return response.data;
  },

  /**
   * Get all grades (admin view)
   */
  async getAll(params?: GradesQueryParams): Promise<PaginatedResponse<LocalGrade>> {
    const response = await api.get<PaginatedResponse<LocalGrade>>('/grades', { params });
    return response.data;
  },

  /**
   * Create a new grade
   */
  async create(data: CreateGradeRequest): Promise<LocalGrade> {
    const response = await api.post<LocalGrade>('/grades', data);
    return response.data;
  },

  /**
   * Update a grade
   */
  async update(id: number, data: UpdateGradeRequest): Promise<LocalGrade> {
    const response = await api.patch<LocalGrade>(`/grades/${id}`, data);
    return response.data;
  },

  /**
   * Delete a grade
   */
  async delete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/grades/${id}`);
    return response.data;
  },

  /**
   * Bulk create/update grades
   */
  async bulkSave(data: BulkGradeRequest): Promise<LocalGrade[]> {
    const response = await api.post<LocalGrade[]>('/grades/bulk', data);
    return response.data;
  },

  /**
   * Get student's grade report for all courses
   */
  async getStudentReport(studentMoodleId?: number): Promise<StudentGradeReport[]> {
    const params = studentMoodleId ? { studentMoodleId } : {};
    const response = await api.get<StudentGradeReport[]>('/grades/report', { params });
    return response.data;
  },

  /**
   * Get student's grade report for a specific period
   */
  async getStudentPeriodReport(
    periodId: number,
    studentMoodleId?: number
  ): Promise<StudentGradeReport[]> {
    const params = studentMoodleId ? { studentMoodleId } : {};
    const response = await api.get<StudentGradeReport[]>(
      `/grades/report/period/${periodId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Export grades to Excel
   */
  async exportToExcel(courseMoodleId: number, itemMoodleId?: number): Promise<Blob> {
    const response = await api.get(`/grades/export/${courseMoodleId}`, {
      params: { itemMoodleId },
      responseType: 'blob',
    });
    return response.data;
  },

  // ================================
  // Student Final Grades (Teacher view with total + comment)
  // ================================

  /**
   * Get all student grades for a course by period (Teacher/Admin)
   */
  async getStudentGradesByCourse(
    courseMoodleId: number,
    periodId: number
  ): Promise<StudentGradeWithDetails[]> {
    const response = await api.get<StudentGradeWithDetails[]>(
      `/student-grades/course/${courseMoodleId}`,
      { params: { periodId } }
    );
    return response.data;
  },

  /**
   * Update a student's grade (Teacher/Admin)
   */
  async updateStudentGrade(
    courseMoodleId: number,
    studentId: number,
    periodId: number,
    data: UpdateStudentGradeDto
  ): Promise<StudentGradeWithDetails> {
    const response = await api.patch<StudentGradeWithDetails>(
      `/student-grades/course/${courseMoodleId}/student/${studentId}`,
      data,
      { params: { periodId } }
    );
    return response.data;
  },

  /**
   * Sync Moodle grade sums for all students in a course (Admin)
   */
  async syncMoodleSums(
    courseMoodleId: number,
    periodId: number
  ): Promise<SyncMoodleSumsResult> {
    const response = await api.post<SyncMoodleSumsResult>(
      `/student-grades/course/${courseMoodleId}/sync-sums`,
      {},
      { params: { periodId } }
    );
    return response.data;
  },

  /**
   * Get my grades (Student) with optional filters
   */
  async getMyGrades(
    periodId?: number,
    courseMoodleId?: number
  ): Promise<StudentCourseGrade[]> {
    const params: Record<string, number> = {};
    if (periodId) params.periodId = periodId;
    if (courseMoodleId) params.courseMoodleId = courseMoodleId;

    const response = await api.get<StudentCourseGrade[]>('/student-grades/mine', { params });
    return response.data;
  },

  /**
   * Get my grades for a specific period (Student)
   */
  async getMyGradesByPeriod(periodId: number): Promise<StudentCourseGrade[]> {
    const response = await api.get<StudentCourseGrade[]>(
      `/student-grades/mine/period/${periodId}`
    );
    return response.data;
  },

  /**
   * Get periods where I have grades (Student)
   */
  async getMyPeriodsWithGrades(): Promise<
    { periodId: number; periodCode: string; periodName: string }[]
  > {
    const response = await api.get<
      { periodId: number; periodCode: string; periodName: string }[]
    >('/student-grades/mine/periods');
    return response.data;
  },

  /**
   * Get courses where I have grades (Student) - optionally filtered by period
   */
  async getMyEnrolledCourses(
    periodId?: number
  ): Promise<{ courseMoodleId: number; courseName: string; courseShortname: string }[]> {
    const params = periodId ? { periodId } : {};
    const response = await api.get<
      { courseMoodleId: number; courseName: string; courseShortname: string }[]
    >('/student-grades/mine/courses', { params });
    return response.data;
  },

  // ================================
  // Admin: Grades by Period
  // ================================

  /**
   * Get all courses with grades for a period (Admin)
   */
  async getCoursesWithGradesForPeriod(
    periodId: number
  ): Promise<
    {
      courseMoodleId: number;
      courseName: string;
      courseShortname: string;
      studentCount: number;
      gradedCount: number;
    }[]
  > {
    const response = await api.get<
      {
        courseMoodleId: number;
        courseName: string;
        courseShortname: string;
        studentCount: number;
        gradedCount: number;
      }[]
    >(`/student-grades/period/${periodId}/courses`);
    return response.data;
  },

  /**
   * Get all student grades for a specific period and course (Admin)
   */
  async getGradesForPeriodAndCourse(
    periodId: number,
    courseMoodleId: number
  ): Promise<StudentGradeWithDetails[]> {
    const response = await api.get<StudentGradeWithDetails[]>(
      `/student-grades/period/${periodId}/course/${courseMoodleId}`
    );
    return response.data;
  },

  /**
   * Get all grades for a course across all periods (Admin)
   */
  async getCourseGradesAllPeriods(
    courseMoodleId: number
  ): Promise<
    {
      studentId: number;
      studentName: string;
      studentEmail: string;
      periodId: number | null;
      periodName: string | null;
      moodleSumGrade: number | null;
      moodleSumMax: number | null;
      totalGrade: number | null;
      comment: string | null;
    }[]
  > {
    const response = await api.get<
      {
        studentId: number;
        studentName: string;
        studentEmail: string;
        periodId: number | null;
        periodName: string | null;
        moodleSumGrade: number | null;
        moodleSumMax: number | null;
        totalGrade: number | null;
        comment: string | null;
      }[]
    >(`/student-grades/course/${courseMoodleId}/all-periods`);
    return response.data;
  },

  // ================================
  // Admin: Grades by User
  // ================================

  /**
   * Search users by email or name (Admin)
   */
  async searchUsersForGrades(
    query: string,
    limit: number = 10
  ): Promise<
    {
      id: number;
      email: string;
      displayName: string | null;
      username: string | null;
      moodleUserId: number | null;
    }[]
  > {
    const response = await api.get<
      {
        id: number;
        email: string;
        displayName: string | null;
        username: string | null;
        moodleUserId: number | null;
      }[]
    >('/student-grades/search-users', { params: { q: query, limit } });
    return response.data;
  },

  /**
   * Get all grades for a specific user (Admin)
   * Returns grades grouped by period with detailed grade items
   */
  async getAllGradesForUser(userId: number): Promise<{
    user: {
      id: number;
      email: string;
      displayName: string | null;
      username: string | null;
      moodleUserId: number | null;
    };
    periods: {
      periodId: number | null;
      periodName: string;
      periodCode: string;
      courses: {
        courseMoodleId: number;
        courseName: string;
        courseShortname: string;
        courseCode: string | null;
        courseSubjectName: string | null;
        programMoodleId?: number | null;
        programName?: string | null;
        materiaName?: string | null;
        totalGrade: number | null;
        comment: string | null;
        gradeItems: {
          itemMoodleId: number;
          itemName: string;
          grade: number | null;
          gradeMax: number | null;
        }[];
        sumGrade: number;
        sumMax: number;
      }[];
    }[];
  }> {
    const response = await api.get<{
      user: {
        id: number;
        email: string;
        displayName: string | null;
        username: string | null;
        moodleUserId: number | null;
      };
      periods: {
        periodId: number | null;
        periodName: string;
        periodCode: string;
        courses: {
          courseMoodleId: number;
          courseName: string;
          courseShortname: string;
          courseCode: string | null;
          courseSubjectName: string | null;
          totalGrade: number | null;
          comment: string | null;
          gradeItems: {
            itemMoodleId: number;
            itemName: string;
            grade: number | null;
            gradeMax: number | null;
          }[];
          sumGrade: number;
          sumMax: number;
        }[];
      }[];
    }>(`/student-grades/user/${userId}/all`);
    return response.data;
  },
};
