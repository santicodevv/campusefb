// Audit API service
import { api } from '@/shared/lib';
import type { AuditLog, AuditQueryParams, PaginatedResponse } from '@/shared/types';

export const auditApi = {
  /**
   * Get paginated audit logs
   */
  async getAll(params?: AuditQueryParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await api.get<PaginatedResponse<AuditLog>>('/audit', { params });
    return response.data;
  },

  /**
   * Get audit log by ID
   */
  async getById(id: number): Promise<AuditLog> {
    const response = await api.get<AuditLog>(`/audit/${id}`);
    return response.data;
  },

  /**
   * Get audit logs for a specific entity
   */
  async getByEntity(entity: string, entityKey: string): Promise<AuditLog[]> {
    const response = await api.get<AuditLog[]>('/audit/entity', {
      params: { entity, entityKey },
    });
    return response.data;
  },

  /**
   * Get audit logs for a specific user
   */
  async getByUser(userId: number, params?: Omit<AuditQueryParams, 'userId'>): Promise<PaginatedResponse<AuditLog>> {
    const response = await api.get<PaginatedResponse<AuditLog>>(`/audit/user/${userId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Get distinct actions for filtering
   */
  async getActions(): Promise<string[]> {
    const response = await api.get<string[]>('/audit/actions');
    return response.data;
  },

  /**
   * Get distinct entities for filtering
   */
  async getEntities(): Promise<string[]> {
    const response = await api.get<string[]>('/audit/entities');
    return response.data;
  },

  /**
   * Export audit logs to CSV
   */
  async exportToCsv(params?: AuditQueryParams): Promise<Blob> {
    const response = await api.get('/audit/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
