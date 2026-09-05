// Academic Periods API service
import { api } from '@/shared/lib';
import type {
  AcademicPeriod,
  CreatePeriodRequest,
  UpdatePeriodRequest,
  ReenrolmentConfigRequest,
  AddAvailableCoursesRequest,
  UpdateAvailableCourseRequest,
  PeriodAvailableCourse,
  PeriodsQueryParams,
  SuccessResponse,
} from '@/shared/types';

export const periodsApi = {
  /**
   * Get all periods
   */
  async getAll(params?: PeriodsQueryParams): Promise<AcademicPeriod[]> {
    const response = await api.get<AcademicPeriod[]>('/periods', {
      params,
    });
    return response.data;
  },

  /**
   * Get period by ID
   */
  async getById(id: number): Promise<AcademicPeriod> {
    const response = await api.get<AcademicPeriod>(`/periods/${id}`);
    return response.data;
  },

  /**
   * Get active periods
   */
  async getActive(): Promise<AcademicPeriod[]> {
    const response = await api.get<AcademicPeriod[]>('/periods/active');
    return response.data;
  },

  /**
   * Get periods open for reenrolment
   */
  async getOpenForReenrolment(): Promise<AcademicPeriod[]> {
    const response = await api.get<AcademicPeriod[]>('/periods/open-for-reenrolment');
    return response.data;
  },

  /**
   * Create a new period
   */
  async create(data: CreatePeriodRequest): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>('/periods', data);
    return response.data;
  },

  /**
   * Update a period
   */
  async update(id: number, data: UpdatePeriodRequest): Promise<AcademicPeriod> {
    const response = await api.patch<AcademicPeriod>(`/periods/${id}`, data);
    return response.data;
  },

  /**
   * Delete a period
   */
  async delete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/periods/${id}`);
    return response.data;
  },

  /**
   * Open a period
   */
  async open(id: number): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>(`/periods/${id}/open`);
    return response.data;
  },

  /**
   * Close a period
   */
  async close(id: number): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>(`/periods/${id}/close`);
    return response.data;
  },

  // =====================
  // REENROLMENT CONFIG
  // =====================

  /**
   * Configure reenrolment dates
   */
  async configureReenrolment(
    id: number,
    data: ReenrolmentConfigRequest,
  ): Promise<AcademicPeriod> {
    const response = await api.patch<AcademicPeriod>(
      `/periods/${id}/reenrolment-config`,
      data,
    );
    return response.data;
  },

  /**
   * Open reenrolment for a period
   */
  async openReenrolment(id: number): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>(`/periods/${id}/open-reenrolment`);
    return response.data;
  },

  /**
   * Close reenrolment for a period
   */
  async closeReenrolment(id: number): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>(`/periods/${id}/close-reenrolment`);
    return response.data;
  },

  // =====================
  // AVAILABLE COURSES
  // =====================

  /**
   * Get available courses for reenrolment (enabled only)
   */
  async getAvailableCourses(periodId: number): Promise<PeriodAvailableCourse[]> {
    const response = await api.get<PeriodAvailableCourse[]>(
      `/periods/${periodId}/available-courses`,
    );
    return response.data;
  },

  /**
   * Get all available courses (including disabled) - Admin only
   */
  async getAllAvailableCourses(periodId: number): Promise<PeriodAvailableCourse[]> {
    const response = await api.get<PeriodAvailableCourse[]>(
      `/periods/${periodId}/available-courses/all`,
    );
    return response.data;
  },

  /**
   * Add courses as available for reenrolment
   */
  async addAvailableCourses(
    periodId: number,
    data: AddAvailableCoursesRequest,
  ): Promise<PeriodAvailableCourse[]> {
    const response = await api.post<PeriodAvailableCourse[]>(
      `/periods/${periodId}/available-courses`,
      data,
    );
    return response.data;
  },

  /**
   * Update an available course
   */
  async updateAvailableCourse(
    periodId: number,
    courseMoodleId: number,
    data: UpdateAvailableCourseRequest,
  ): Promise<PeriodAvailableCourse> {
    const response = await api.patch<PeriodAvailableCourse>(
      `/periods/${periodId}/available-courses/${courseMoodleId}`,
      data,
    );
    return response.data;
  },

  /**
   * Remove available courses
   */
  async removeAvailableCourses(
    periodId: number,
    courseMoodleIds: number[],
  ): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(
      `/periods/${periodId}/available-courses`,
      { data: { courseMoodleIds } },
    );
    return response.data;
  },
};
