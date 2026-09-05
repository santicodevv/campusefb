// Transcripts API service
import { api } from '@/shared/lib';
import type {
  Transcript,
  TranscriptContent,
  GenerateTranscriptRequest,
  TranscriptsQueryParams,
  PaginatedResponse,
  SuccessResponse,
} from '@/shared/types';

export const transcriptsApi = {
  /**
   * Get all transcripts (admin view)
   */
  async getAll(params?: TranscriptsQueryParams): Promise<PaginatedResponse<Transcript>> {
    const response = await api.get<PaginatedResponse<Transcript>>('/transcripts', {
      params,
    });
    return response.data;
  },

  /**
   * Get transcript by ID
   */
  async getById(id: number): Promise<Transcript> {
    const response = await api.get<Transcript>(`/transcripts/${id}`);
    return response.data;
  },

  /**
   * Get student's own transcripts
   */
  async getMy(): Promise<Transcript[]> {
    const response = await api.get<Transcript[]>('/transcripts/my');
    return response.data;
  },

  /**
   * Generate a new transcript
   */
  async generate(data: GenerateTranscriptRequest): Promise<Transcript> {
    const response = await api.post<Transcript>('/transcripts/generate', data);
    return response.data;
  },

  /**
   * Generate transcript for a specific student (admin)
   */
  async generateForStudent(
    userId: number,
    data: GenerateTranscriptRequest
  ): Promise<Transcript> {
    const response = await api.post<Transcript>(
      `/transcripts/generate/${userId}`,
      data
    );
    return response.data;
  },

  /**
   * Download transcript PDF
   */
  async download(id: number): Promise<Blob> {
    const response = await api.get(`/transcripts/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Verify transcript by number and hash
   */
  async verify(
    transcriptNumber: string,
    hash: string
  ): Promise<{ valid: boolean; transcript?: TranscriptContent }> {
    const response = await api.post<{ valid: boolean; transcript?: TranscriptContent }>(
      '/transcripts/verify',
      { transcriptNumber, hash }
    );
    return response.data;
  },

  /**
   * Revoke a transcript
   */
  async revoke(id: number): Promise<Transcript> {
    const response = await api.post<Transcript>(`/transcripts/${id}/revoke`);
    return response.data;
  },

  /**
   * Delete a transcript (admin only)
   */
  async delete(id: number): Promise<SuccessResponse> {
    const response = await api.delete<SuccessResponse>(`/transcripts/${id}`);
    return response.data;
  },
};
