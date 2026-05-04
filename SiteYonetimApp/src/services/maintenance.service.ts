import { apiClient } from '../api/apiClient';

export interface Maintenance {
  id: string;
  equipmentName: string;
  equipmentType: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate?: string;
  maintenanceIntervalDays: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CreateMaintenanceRequest {
  equipmentName: string;
  equipmentType: string;
  lastMaintenanceDate: string;
  maintenanceIntervalDays: number;
  notes?: string;
}

export class MaintenanceService {
  async getAll(siteId: string): Promise<Maintenance[]> {
    try {
      return await apiClient.get(`/sites/${siteId}/maintenance`);
    } catch (error) {
      console.error('Get maintenance error:', error);
      return [];
    }
  }

  async getAllMaintenance(): Promise<Maintenance[]> {
    try {
      return await apiClient.get('/maintenance');
    } catch (error) {
      console.error('Get all maintenance error:', error);
      return [];
    }
  }

  async create(siteId: string, data: CreateMaintenanceRequest): Promise<Maintenance> {
    return apiClient.post(`/sites/${siteId}/maintenance`, data);
  }

  async update(siteId: string, id: string, data: Partial<CreateMaintenanceRequest>): Promise<Maintenance> {
    return apiClient.put(`/sites/${siteId}/maintenance/${id}`, data);
  }

  async delete(siteId: string, id: string): Promise<void> {
    return apiClient.delete(`/sites/${siteId}/maintenance/${id}`);
  }
}

export const maintenanceService = new MaintenanceService();
