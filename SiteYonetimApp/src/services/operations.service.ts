import { apiClient } from '../api/apiClient';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate: string;
  siteId: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  siteId: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate: string;
}

export class OperationsService {
  // Get tasks list
  async getTasks(siteId: string): Promise<Task[]> {
    return apiClient.get(`/sites/${siteId}/tasks`);
  }

  // Create new task
  async createTask(data: CreateTaskRequest): Promise<Task> {
    return apiClient.post(`/sites/${data.siteId}/tasks`, data);
  }

  // Update task status
  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    return apiClient.patch(`/tasks/${taskId}/status`, { status });
  }

  // Complete task
  async completeTask(taskId: string): Promise<Task> {
    return apiClient.post(`/tasks/${taskId}/complete`, {});
  }

  // Get staff list
  async getStaff(siteId: string): Promise<any[]> {
    return apiClient.get(`/sites/${siteId}/staff`);
  }

  // Packages
  async getPackages(siteId: string): Promise<Package[]> {
    return apiClient.get(`/sites/${siteId}/packages`);
  }

  async createPackage(data: any): Promise<Package> {
    return apiClient.post('/packages', data);
  }

  async deliverPackage(packageId: string): Promise<void> {
    return apiClient.post(`/packages/${packageId}/deliver`, {});
  }
}

export const operationsService = new OperationsService();

export interface Package {
  id: string;
  trackingNumber: string;
  courierName: string;
  apartmentId: string;
  status: 'received' | 'delivered';
  recordedAt: string; // ISO date
  deliveredAt?: string;
  siteId: string;
}
