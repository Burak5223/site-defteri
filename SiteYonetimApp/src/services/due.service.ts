import { apiClient } from '../api/apiClient';

export interface Due {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'bekliyor' | 'odendi' | 'gecikmis' | 'kismi_odendi' | 'iptal_edildi';
  period: string;
  month?: string;
  year?: number;
  residentName?: string;
  ownerName?: string;
}

export interface BulkDueAssignRequest {
  apartmentIds: string[];
  amount: number;
  dueDate: string;
  description: string;
}

export interface PaymentRequest {
  dueId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash';
}

class DueService {
  async getDues(siteId: string): Promise<Due[]> {
    return apiClient.get(`/sites/${siteId}/dues`);
  }

  async getAllDues(siteId: string): Promise<Due[]> {
    return apiClient.get(`/sites/${siteId}/dues`);
  }

  async getMyDues(): Promise<Due[]> {
    return apiClient.get('/dues/my');
  }

  async createBulkDues(data: BulkDueAssignRequest, siteId: string): Promise<void> {
    return apiClient.post(`/sites/${siteId}/dues/bulk`, data);
  }

  async payDue(data: PaymentRequest): Promise<void> {
    return apiClient.post('/payments', data);
  }

  async getDueById(id: string): Promise<Due> {
    return apiClient.get(`/dues/${id}`);
  }

  // Apartmanları getir
  async getApartments(siteId: string): Promise<any[]> {
    return apiClient.get(`/sites/${siteId}/apartments`);
  }
}

export const dueService = new DueService();
