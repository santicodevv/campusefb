// Re-enrolments API service
import { api } from '@/shared/lib';
import type {
  ReEnrolmentRequest,
  ReEnrolmentStatus,
  SuccessResponse,
} from '@/shared/types';

export interface CreateReEnrolmentData {
  periodId: number;
  courses: { courseMoodleId: number }[];
  notes?: string;
}

export interface UpdateReEnrolmentData {
  courses: { courseMoodleId: number }[];
  notes?: string;
}

export const reenrolmentsApi = {
  /**
   * Get all re-enrolment requests (admin view)
   */
  async getAll(): Promise<ReEnrolmentRequest[]> {
    const response = await api.get<ReEnrolmentRequest[]>('/re-enrolments');
    return response.data;
  },

  /**
   * Get pending re-enrolment requests (admin view)
   */
  async getPending(): Promise<ReEnrolmentRequest[]> {
    const response = await api.get<ReEnrolmentRequest[]>('/re-enrolments/pending');
    return response.data;
  },

  /**
   * Get re-enrolment request by ID
   */
  async getById(id: number): Promise<ReEnrolmentRequest> {
    const response = await api.get<ReEnrolmentRequest>(`/re-enrolments/${id}`);
    return response.data;
  },

  /**
   * Get student's own re-enrolment requests
   */
  async getMine(): Promise<ReEnrolmentRequest[]> {
    const response = await api.get<ReEnrolmentRequest[]>('/re-enrolments/mine');
    return response.data;
  },

  /**
   * Get student's draft for a specific period
   */
  async getMyDraft(periodId: number): Promise<ReEnrolmentRequest | null> {
    try {
      const response = await api.get<ReEnrolmentRequest>(
        `/re-enrolments/mine/draft/${periodId}`,
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new re-enrolment request
   */
  async create(data: CreateReEnrolmentData): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>('/re-enrolments', data);
    return response.data;
  },

  /**
   * Update a draft re-enrolment request
   */
  async update(id: number, data: UpdateReEnrolmentData): Promise<ReEnrolmentRequest> {
    const response = await api.patch<ReEnrolmentRequest>(`/re-enrolments/${id}`, data);
    return response.data;
  },

  /**
   * Add courses to draft
   */
  async addCourses(
    id: number,
    courses: { courseMoodleId: number }[],
  ): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(
      `/re-enrolments/${id}/add-courses`,
      { courses },
    );
    return response.data;
  },

  /**
   * Remove courses from draft
   */
  async removeCourses(
    id: number,
    courseMoodleIds: number[],
  ): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(
      `/re-enrolments/${id}/remove-courses`,
      { courseMoodleIds },
    );
    return response.data;
  },

  /**
   * Submit a draft for review
   */
  async submit(id: number): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(`/re-enrolments/${id}/submit`);
    return response.data;
  },

  /**
   * Approve a re-enrolment request (admin)
   */
  async approve(id: number): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(`/re-enrolments/${id}/approve`);
    return response.data;
  },

  /**
   * Reject a re-enrolment request (admin)
   */
  async reject(id: number, reason: string): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(`/re-enrolments/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  /**
   * Apply approved re-enrolment to Moodle (admin)
   */
  async applyToMoodle(id: number): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(
      `/re-enrolments/${id}/apply-to-moodle`,
    );
    return response.data;
  },

  /**
   * Delete a draft re-enrolment request
   */
  async delete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/re-enrolments/${id}`);
    return response.data;
  },

  /**
   * Get stats by status
   */
  async getStats(periodId?: number): Promise<Record<ReEnrolmentStatus, number>> {
    const response = await api.get<Record<ReEnrolmentStatus, number>>(
      '/re-enrolments/stats',
      { params: { periodId } },
    );
    return response.data;
  },

  /**
   * Get requests by period
   */
  async getByPeriod(periodId: number): Promise<ReEnrolmentRequest[]> {
    const response = await api.get<ReEnrolmentRequest[]>(
      `/re-enrolments/by-period/${periodId}`,
    );
    return response.data;
  },

  /**
   * Admin delete any re-enrolment request
   */
  async adminDelete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/re-enrolments/admin/${id}`);
    return response.data;
  },

  /**
   * Admin add courses to a submitted request (before approval)
   */
  async adminAddCourses(
    id: number,
    courses: { courseMoodleId: number }[],
  ): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(
      `/re-enrolments/${id}/admin/add-courses`,
      { courses },
    );
    return response.data;
  },

  /**
   * Admin remove courses from a submitted request (before approval)
   */
  async adminRemoveCourses(
    id: number,
    courseMoodleIds: number[],
  ): Promise<ReEnrolmentRequest> {
    const response = await api.post<ReEnrolmentRequest>(
      `/re-enrolments/${id}/admin/remove-courses`,
      { courseMoodleIds },
    );
    return response.data;
  },
};
