import { api } from '@/shared/lib/axios';
import type { UserDocument, DocumentType } from '@/shared/types/document.types';

interface UploadProfilePhotoResponse {
  message: string;
  profilePhotoUrl: string;
}

interface UploadDocumentResponse {
  message: string;
  document: UserDocument;
}

interface GetDocumentsResponse {
  documents: UserDocument[];
}

export const uploadsApi = {
  /**
   * Upload profile photo
   */
  uploadProfilePhoto: async (file: File): Promise<UploadProfilePhotoResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadProfilePhotoResponse>(
      '/uploads/profile-photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Delete profile photo
   */
  deleteProfilePhoto: async (): Promise<void> => {
    await api.delete('/uploads/profile-photo');
  },

  /**
   * Upload a document
   */
  uploadDocument: async (
    file: File,
    documentType: DocumentType,
  ): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post<UploadDocumentResponse>(
      '/uploads/documents',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Get my documents
   */
  getMyDocuments: async (): Promise<UserDocument[]> => {
    const response = await api.get<GetDocumentsResponse>('/uploads/documents');
    return response.data.documents;
  },

  /**
   * Delete a document
   */
  deleteDocument: async (documentId: number): Promise<void> => {
    await api.delete(`/uploads/documents/${documentId}`);
  },

  /**
   * Admin: Get user documents
   */
  getUserDocuments: async (userId: number): Promise<UserDocument[]> => {
    const response = await api.get<GetDocumentsResponse>(
      `/uploads/users/${userId}/documents`,
    );
    return response.data.documents;
  },
};
