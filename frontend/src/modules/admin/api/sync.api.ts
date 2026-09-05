// Sync API service
import { api } from '@/shared/lib';
import type {
  SyncStatus,
  SyncJob,
  SyncResult,
  SyncEntityType,
  ForceSyncRequest,
} from '@/shared/types';

export const syncApi = {
  /**
   * Get overall sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const response = await api.get<SyncStatus>('/sync/status');
    return response.data;
  },

  /**
   * Get sync jobs history
   */
  async getJobs(limit?: number): Promise<SyncJob[]> {
    const response = await api.get<SyncJob[]>('/sync/jobs', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get specific sync job
   */
  async getJob(id: number): Promise<SyncJob> {
    const response = await api.get<SyncJob>(`/sync/jobs/${id}`);
    return response.data;
  },

  /**
   * Force sync a specific entity or all
   */
  async forceSync(data?: ForceSyncRequest): Promise<SyncResult> {
    const response = await api.post<SyncResult>('/sync/force', data || {});
    return response.data;
  },

  /**
   * Force sync a specific entity type
   */
  async syncEntity(entity: SyncEntityType): Promise<SyncResult> {
    const response = await api.post<SyncResult>(`/sync/force/${entity}`);
    return response.data;
  },

  /**
   * Test Moodle connection
   */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    const response = await api.get<{ connected: boolean; message: string }>(
      '/sync/test-connection'
    );
    return response.data;
  },

  /**
   * Get sync configuration
   */
  async getConfig(): Promise<{
    moodleUrl: string;
    syncInterval: number;
    isEnabled: boolean;
  }> {
    const response = await api.get<{
      moodleUrl: string;
      syncInterval: number;
      isEnabled: boolean;
    }>('/sync/config');
    return response.data;
  },

  /**
   * Update sync configuration
   */
  async updateConfig(data: {
    syncInterval?: number;
    isEnabled?: boolean;
  }): Promise<{ success: boolean }> {
    const response = await api.patch<{ success: boolean }>('/sync/config', data);
    return response.data;
  },

  /**
   * Fix teacher assignments (roles and course_teachers)
   */
  async fixTeachers(): Promise<{
    success: boolean;
    message: string;
    results: {
      teacherRolesAssigned: number;
      courseTeachersCreated: number;
    };
  }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      results: {
        teacherRolesAssigned: number;
        courseTeachersCreated: number;
      };
    }>('/sync/fix-teachers');
    return response.data;
  },
};
