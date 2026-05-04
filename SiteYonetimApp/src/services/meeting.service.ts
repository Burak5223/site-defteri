/**
 * Meeting Service
 * Handles all meeting-related API calls
 */

import { apiClient } from '../api/apiClient';

export interface MeetingResponse {
  id: string;
  siteId: string;
  title: string;
  description: string;
  meetingDate: string;
  location: string;
  agenda?: string;
  minutes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  description: string;
  meetingDate: string;
  location: string;
  agenda?: string;
}

export class MeetingService {
  /**
   * Get all meetings for site
   * GET /api/sites/:siteId/meetings
   */
  async getMeetings(siteId: string): Promise<MeetingResponse[]> {
    return apiClient.get<MeetingResponse[]>(`/sites/${siteId}/meetings`);
  }

  /**
   * Get meeting by ID
   * GET /api/meetings/:meetingId
   */
  async getMeetingById(meetingId: string): Promise<MeetingResponse> {
    return apiClient.get<MeetingResponse>(`/meetings/${meetingId}`);
  }

  /**
   * Create meeting
   * POST /api/sites/:siteId/meetings
   */
  async createMeeting(siteId: string, data: CreateMeetingRequest): Promise<MeetingResponse> {
    return apiClient.post<MeetingResponse>(`/sites/${siteId}/meetings`, data);
  }

  /**
   * Update meeting
   * PUT /api/meetings/:meetingId
   */
  async updateMeeting(meetingId: string, data: CreateMeetingRequest): Promise<MeetingResponse> {
    return apiClient.put<MeetingResponse>(`/meetings/${meetingId}`, data);
  }

  /**
   * Update meeting status
   * PUT /api/meetings/:meetingId/status
   */
  async updateMeetingStatus(meetingId: string, status: string): Promise<MeetingResponse> {
    return apiClient.put<MeetingResponse>(`/meetings/${meetingId}/status?status=${status}`, {});
  }

  /**
   * Add meeting minutes
   * PUT /api/meetings/:meetingId/minutes
   */
  async addMinutes(meetingId: string, minutes: string): Promise<MeetingResponse> {
    return apiClient.put<MeetingResponse>(`/meetings/${meetingId}/minutes`, { minutes });
  }

  /**
   * Delete meeting
   * DELETE /api/meetings/:meetingId
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    return apiClient.delete<void>(`/meetings/${meetingId}`);
  }
}

// Export singleton instance
export const meetingService = new MeetingService();
