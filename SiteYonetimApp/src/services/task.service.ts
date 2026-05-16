import { apiClient } from '../api/apiClient';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Artık rol: ROLE_SECURITY, ROLE_CLEANING, vb.
  assignedToName?: string; // Rol adı (opsiyonel, backward compatibility için)
  assignedBy?: string; // Admin adı
  taskType?: string;
  status: 'pending' | 'in_progress' | 'completed'; // Normalized to English after fetching
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo: string; // Rol: ROLE_SECURITY, ROLE_CLEANING, vb.
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  location?: string;
}

class TaskService {
  async getTasks(siteId: string = '1'): Promise<Task[]> {
    return apiClient.get(`/sites/${siteId}/tasks`);
  }

  async createTask(data: CreateTaskRequest, siteId: string = '1'): Promise<Task> {
    return apiClient.post(`/sites/${siteId}/tasks`, data);
  }

  async completeTask(siteId: string, taskId: string): Promise<Task> {
    return apiClient.put(`/sites/${siteId}/tasks/${taskId}/complete`);
  }

  async updateTaskStatus(siteId: string, taskId: string, status: string): Promise<Task> {
    return apiClient.put(`/sites/${siteId}/tasks/${taskId}/status?status=${status}`);
  }
}

export const taskService = new TaskService();
