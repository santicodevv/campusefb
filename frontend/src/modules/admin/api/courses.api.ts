// Courses API service
import { api } from '@/shared/lib';
import type {
  MoodleCourse,
  CourseWithStats,
  EnrolledStudent,
  MoodleEnrolment,
  CoursesQueryParams,
  PaginatedResponse,
  MoodleCategory,
  CreateCourseDto,
  EnrolledUserWithDetails,
  CourseTeacher,
} from '@/shared/types';

export const coursesApi = {
  /**
   * Get paginated list of courses
   */
  async getAll(params?: CoursesQueryParams): Promise<PaginatedResponse<MoodleCourse>> {
    const response = await api.get<PaginatedResponse<MoodleCourse>>('/courses', { params });
    return response.data;
  },

  /**
   * Get course by Moodle ID
   */
  async getByMoodleId(moodleId: number): Promise<CourseWithStats> {
    const response = await api.get<CourseWithStats>(`/courses/${moodleId}`);
    return response.data;
  },

  /**
   * Get students enrolled in a course
   */
  async getStudents(moodleId: number): Promise<EnrolledStudent[]> {
    const response = await api.get<EnrolledStudent[]>(`/courses/${moodleId}/students`);
    return response.data;
  },

  /**
   * Get teacher's courses
   */
  async getMyCourses(): Promise<CourseWithStats[]> {
    const response = await api.get<CourseWithStats[]>('/courses/my');
    return response.data;
  },

  /**
   * Get student's enrolled courses
   */
  async getEnrolledCourses(): Promise<MoodleCourse[]> {
    const response = await api.get<MoodleCourse[]>('/courses/enrolled');
    return response.data;
  },

  /**
   * Get all enrolments for a course
   */
  async getEnrolments(moodleId: number): Promise<MoodleEnrolment[]> {
    const response = await api.get<MoodleEnrolment[]>(`/courses/${moodleId}/enrolments`);
    return response.data;
  },

  /**
   * Get available courses for re-enrolment
   */
  async getAvailableForEnrolment(periodId: number): Promise<MoodleCourse[]> {
    const response = await api.get<MoodleCourse[]>('/courses/available', {
      params: { periodId },
    });
    return response.data;
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<MoodleCategory[]> {
    const response = await api.get<MoodleCategory[]>('/courses/categories');
    return response.data;
  },

  /**
   * Sync categories from Moodle (also creates Academic Programs)
   */
  async syncCategories(): Promise<{ synced: number; programsCreated: number }> {
    const response = await api.post<{ synced: number; programsCreated: number }>(
      '/courses/categories/sync',
    );
    return response.data;
  },

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseDto): Promise<CourseWithStats> {
    const response = await api.post<CourseWithStats>('/courses', data);
    return response.data;
  },

  /**
   * Update course subject name
   */
  async updateSubjectName(courseId: number, subjectName: string): Promise<MoodleCourse> {
    const response = await api.patch<MoodleCourse>(`/courses/${courseId}/subject-name`, { subjectName });
    return response.data;
  },

  /**
   * Update course code
   */
  async updateCode(courseId: number, code: string): Promise<MoodleCourse> {
    const response = await api.patch<MoodleCourse>(`/courses/${courseId}/code`, { code });
    return response.data;
  },

  /**
   * Get enrolled users with details for a course
   */
  async getEnrolledUsersWithDetails(courseId: number): Promise<EnrolledUserWithDetails[]> {
    const response = await api.get<EnrolledUserWithDetails[]>(`/courses/${courseId}/enrolled-users`);
    return response.data;
  },

  /**
   * Delete a course (local only)
   */
  async delete(courseId: number): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Toggle course visibility (syncs with Moodle)
   */
  async toggleVisibility(courseId: number): Promise<CourseWithStats> {
    const response = await api.patch<CourseWithStats>(`/courses/${courseId}/visibility`);
    return response.data;
  },

  // =====================
  // TEACHER ASSIGNMENT
  // =====================

  /**
   * Get teachers assigned to a course
   */
  async getTeachersForCourse(courseMoodleId: number): Promise<CourseTeacher[]> {
    const response = await api.get<CourseTeacher[]>(
      `/courses/${courseMoodleId}/teachers`,
    );
    return response.data;
  },

  /**
   * Assign teachers to a course
   */
  async assignTeachers(
    courseMoodleId: number,
    teacherIds: number[],
    courseName?: string,
  ): Promise<CourseTeacher[]> {
    const response = await api.post<CourseTeacher[]>(
      `/courses/${courseMoodleId}/teachers`,
      { teacherIds, courseName },
    );
    return response.data;
  },

  /**
   * Remove a teacher from a course
   */
  async removeTeacher(
    courseMoodleId: number,
    teacherId: number,
  ): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/courses/${courseMoodleId}/teachers/${teacherId}`,
    );
    return response.data;
  },

  /**
   * Set a teacher as primary for a course
   */
  async setPrimaryTeacher(
    courseMoodleId: number,
    teacherId: number,
  ): Promise<CourseTeacher> {
    const response = await api.post<CourseTeacher>(
      `/courses/${courseMoodleId}/teachers/${teacherId}/primary`,
    );
    return response.data;
  },

  /**
   * Get courses where a teacher is assigned (with full course details)
   */
  async getCoursesForTeacher(teacherId: number): Promise<CourseWithStats[]> {
    const response = await api.get<CourseWithStats[]>(
      `/courses/teacher/${teacherId}/courses`,
    );
    return response.data;
  },
};
