import apiClient from '../api/apiClient';

export interface VisitorItem {
  visitorName: string;
  visitorPhone?: string;
  vehiclePlate?: string;
  stayStartDate: string; // ISO date string
  stayDurationDays?: number; // Kaç gün kalacak (varsayılan 1)
  itemNotes?: string;
}

export interface VisitorItemResponse extends VisitorItem {
  id: string;
}

export interface CreateVisitorRequestData {
  expectedVisitDate: string;
  notes?: string;
  visitors: VisitorItem[];
}

export interface VisitorRequest {
  id: string;
  apartmentId: string;
  apartmentNumber?: string;
  siteId: string;
  requestedBy: string;
  requestedByName?: string;
  requestDate: string;
  expectedVisitDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  visitors: VisitorItemResponse[];
}

export interface ReviewVisitorRequestData {
  reviewNotes?: string;
}

class VisitorRequestService {
  // Resident endpoints
  async createRequest(data: CreateVisitorRequestData): Promise<VisitorRequest> {
    return await apiClient.post('/visitor-requests', data);
  }

  async getMyRequests(): Promise<VisitorRequest[]> {
    return await apiClient.get('/visitor-requests/my');
  }

  async getRequestById(id: string): Promise<VisitorRequest> {
    return await apiClient.get(`/visitor-requests/${id}`);
  }

  async cancelRequest(id: string): Promise<void> {
    await apiClient.delete(`/visitor-requests/${id}`);
  }

  // Security/Admin endpoints
  async getAllRequests(siteId: string): Promise<VisitorRequest[]> {
    return await apiClient.get(`/visitor-requests?siteId=${siteId}`);
  }

  async getPendingRequests(siteId: string): Promise<VisitorRequest[]> {
    return await apiClient.get(`/visitor-requests/pending?siteId=${siteId}`);
  }

  async approveRequest(id: string, data?: ReviewVisitorRequestData): Promise<VisitorRequest> {
    return await apiClient.put(`/visitor-requests/${id}/approve`, data || {});
  }

  async rejectRequest(id: string, data?: ReviewVisitorRequestData): Promise<VisitorRequest> {
    return await apiClient.put(`/visitor-requests/${id}/reject`, data || {});
  }
}

export default new VisitorRequestService();
