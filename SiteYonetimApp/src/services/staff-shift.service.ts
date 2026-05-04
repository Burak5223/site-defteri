/**
 * Staff Shift Service
 * Handles all staff shift-related API calls
 */

import { apiClient } from '../api/apiClient';

export interface StaffShiftResponse {
  id: string;
  siteId: string;
  staffUserId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
}

export interface CreateStaffShiftRequest {
  staffUserId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export class StaffShiftService {
  /**
   * Get shifts for site
   * GET /api/sites/:siteId/staff-shifts
   */
  async getShiftsBySite(siteId: string, date?: string): Promise<StaffShiftResponse[]> {
    const query = date ? `?date=${date}` : '';
    return apiClient.get<StaffShiftResponse[]>(`/sites/${siteId}/staff-shifts${query}`);
  }

  /**
   * Create shift
   * POST /api/sites/:siteId/staff-shifts
   */
  async createShift(siteId: string, data: CreateStaffShiftRequest): Promise<StaffShiftResponse> {
    return apiClient.post<StaffShiftResponse>(`/sites/${siteId}/staff-shifts`, data);
  }

  /**
   * Check-in to shift
   * POST /api/sites/:siteId/staff-shifts/:shiftId/checkin
   */
  async checkIn(siteId: string, shiftId: string): Promise<StaffShiftResponse> {
    return apiClient.post<StaffShiftResponse>(`/sites/${siteId}/staff-shifts/${shiftId}/checkin`, {});
  }

  /**
   * Check-out from shift
   * POST /api/sites/:siteId/staff-shifts/:shiftId/checkout
   */
  async checkOut(siteId: string, shiftId: string): Promise<StaffShiftResponse> {
    return apiClient.post<StaffShiftResponse>(`/sites/${siteId}/staff-shifts/${shiftId}/checkout`, {});
  }

  /**
   * Update shift
   * PUT /api/sites/:siteId/staff-shifts/:shiftId
   */
  async updateShift(siteId: string, shiftId: string, data: CreateStaffShiftRequest): Promise<StaffShiftResponse> {
    return apiClient.put<StaffShiftResponse>(`/sites/${siteId}/staff-shifts/${shiftId}`, data);
  }

  /**
   * Delete shift
   * DELETE /api/sites/:siteId/staff-shifts/:shiftId
   */
  async deleteShift(siteId: string, shiftId: string): Promise<void> {
    return apiClient.delete<void>(`/sites/${siteId}/staff-shifts/${shiftId}`);
  }
}

// Export singleton instance
export const staffShiftService = new StaffShiftService();
