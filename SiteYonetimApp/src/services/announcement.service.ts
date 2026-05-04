import { apiClient } from '../api/apiClient';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: string;
  createdByName: string;
  expiresAt?: string; // Opsiyonel son kullanma tarihi
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

class AnnouncementService {
  async getAnnouncements(siteId: string = '1'): Promise<Announcement[]> {
    return apiClient.get(`/sites/${siteId}/announcements`);
  }

  async createAnnouncement(data: CreateAnnouncementRequest, siteId: string = '1'): Promise<Announcement> {
    return apiClient.post(`/sites/${siteId}/announcements`, data);
  }

  async updateAnnouncement(id: string, data: CreateAnnouncementRequest): Promise<Announcement> {
    return apiClient.put(`/announcements/${id}`, data);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    return apiClient.delete(`/announcements/${id}`);
  }
}

export const announcementService = new AnnouncementService();
