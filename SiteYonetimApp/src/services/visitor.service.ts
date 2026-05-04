/**
 * Visitor Service
 * Handles all visitor-related API calls
 */

import { apiClient } from '../api/apiClient';

export interface VisitorResponse {
  id: string;
  apartmentId: string;
  apartmentNumber?: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber?: string;
  vehiclePlate?: string;
  purpose: string;
  expectedArrival: string;
  actualArrival?: string;
  actualDeparture?: string;
  status: 'EXPECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitorRequest {
  apartmentId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber?: string;
  vehiclePlate?: string;
  purpose: string;
  expectedArrival: string;
  notes?: string;
}

export class VisitorService {
  /**
   * Get all visitors for site
   * GET /api/sites/:siteId/visitors
   */
  async getVisitors(siteId: string): Promise<VisitorResponse[]> {
    return apiClient.get<VisitorResponse[]>(`/sites/${siteId}/visitors`);
  }

  /**
   * Get visitors by apartment
   * GET /api/apartments/:apartmentId/visitors
   */
  async getVisitorsByApartment(apartmentId: string): Promise<VisitorResponse[]> {
    return apiClient.get<VisitorResponse[]>(`/apartments/${apartmentId}/visitors`);
  }

  /**
   * Create visitor
   * POST /api/sites/:siteId/visitors
   */
  async createVisitor(siteId: string, data: CreateVisitorRequest): Promise<VisitorResponse> {
    return apiClient.post<VisitorResponse>(`/sites/${siteId}/visitors`, data);
  }

  /**
   * Update visitor
   * PUT /api/visitors/:visitorId
   */
  async updateVisitor(visitorId: string, data: CreateVisitorRequest): Promise<VisitorResponse> {
    return apiClient.put<VisitorResponse>(`/visitors/${visitorId}`, data);
  }

  /**
   * Check in visitor
   * PUT /api/visitors/:visitorId/checkin
   */
  async checkInVisitor(visitorId: string): Promise<VisitorResponse> {
    return apiClient.put<VisitorResponse>(`/visitors/${visitorId}/checkin`, {});
  }

  /**
   * Check out visitor
   * PUT /api/visitors/:visitorId/checkout
   */
  async checkOutVisitor(visitorId: string): Promise<VisitorResponse> {
    return apiClient.put<VisitorResponse>(`/visitors/${visitorId}/checkout`, {});
  }

  /**
   * Delete visitor
   * DELETE /api/visitors/:visitorId
   */
  async deleteVisitor(visitorId: string): Promise<void> {
    return apiClient.delete<void>(`/visitors/${visitorId}`);
  }
}

// Export singleton instance
export const visitorService = new VisitorService();
