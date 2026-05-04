/**
 * Attachment Service
 * Handles all file attachment-related API calls
 */

import { apiClient } from '../api/apiClient';

export interface AttachmentResponse {
  id: string;
  siteId: string;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description?: string;
  downloadUrl: string;
  createdAt: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileId: string;
  fileName: string;
  expiresIn: number;
}

export class AttachmentService {
  /**
   * Get attachments for entity
   * GET /api/attachments/:entityType/:entityId
   */
  async getAttachmentsByEntity(entityType: string, entityId: string): Promise<AttachmentResponse[]> {
    return apiClient.get<AttachmentResponse[]>(`/attachments/${entityType}/${entityId}`);
  }

  /**
   * Upload file
   * POST /api/attachments/upload
   */
  async uploadFile(
    file: File,
    siteId: string,
    entityType: string,
    entityId: string
  ): Promise<AttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', siteId);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/attachments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  }

  /**
   * Get attachment detail
   * GET /api/attachments/:attachmentId
   */
  async getAttachment(attachmentId: string): Promise<AttachmentResponse> {
    return apiClient.get<AttachmentResponse>(`/attachments/${attachmentId}`);
  }

  /**
   * Download file
   * GET /api/attachments/:attachmentId/download
   */
  async downloadFile(attachmentId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/attachments/${attachmentId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('File download failed');
    }

    return response.blob();
  }

  /**
   * Delete attachment
   * DELETE /api/attachments/:attachmentId
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    return apiClient.delete<void>(`/attachments/${attachmentId}`);
  }

  /**
   * Generate presigned URL
   * POST /api/attachments/presign
   */
  async generatePresignedUrl(
    fileName: string,
    entityType: string,
    entityId: string
  ): Promise<PresignedUrlResponse> {
    return apiClient.post<PresignedUrlResponse>(
      `/attachments/presign?fileName=${fileName}&entityType=${entityType}&entityId=${entityId}`,
      {}
    );
  }

  /**
   * Helper: Download file and trigger browser download
   */
  async downloadAndSave(attachmentId: string, fileName: string): Promise<void> {
    const blob = await this.downloadFile(attachmentId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Export singleton instance
export const attachmentService = new AttachmentService();
