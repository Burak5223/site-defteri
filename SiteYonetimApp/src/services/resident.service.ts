import { apiClient } from '../api/apiClient';

export interface Resident {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  apartmentId?: string;
  apartmentNumber?: string;
  blockName?: string;
  floor?: number;
  apartmentType?: string;
  residentType: 'owner' | 'tenant';
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
}

export interface InviteResidentRequest {
  fullName: string;
  email: string;
  phone: string;
  blockId?: string;
  apartmentNumber?: string;
  residentType?: 'owner' | 'tenant';
  siteId?: string;
  role?: string; // CLEANING, SECURITY, vb.
}

export interface UpdateResidentRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
}

class ResidentService {
  async getResidents(): Promise<Resident[]> {
    return apiClient.get('/users');
  }

  async getResidentById(id: string): Promise<Resident> {
    return apiClient.get(`/users/${id}`);
  }
  
  async getApartmentsByBlock(blockId: string): Promise<any[]> {
    return apiClient.get(`/blocks/${blockId}/apartments-with-residents`);
  }
  
  async getResidentsByApartment(apartmentId: string): Promise<Resident[]> {
    return apiClient.get(`/apartments/${apartmentId}/residents`);
  }

  async inviteResident(data: InviteResidentRequest, siteId: string): Promise<void> {
    return apiClient.post('/users/invite', {
      ...data,
      siteId,
    });
  }

  async updateResident(id: string, data: InviteResidentRequest): Promise<Resident> {
    return apiClient.put(`/users/${id}`, data);
  }

  async removeResident(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }

  async removeResidentFromApartment(userId: string, apartmentId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}/apartments/${apartmentId}`);
  }

  async assignApartment(userId: string, apartmentId: string, assignmentType: 'owner' | 'tenant'): Promise<Resident> {
    return apiClient.post(`/users/${userId}/assign-apartment`, {
      apartmentId,
      assignmentType,
    });
  }

  async changeApartment(userId: string, apartmentId: string, assignmentType: 'owner' | 'tenant'): Promise<Resident> {
    return apiClient.put(`/users/${userId}/change-apartment`, {
      apartmentId,
      assignmentType,
    });
  }

  async sendMessage(userId: string, message: string): Promise<void> {
    return apiClient.post('/messages', {
      recipientId: userId,
      content: message,
    });
  }
}

export const residentService = new ResidentService();
