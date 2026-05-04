import { apiClient } from '../api/apiClient';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  apartmentNumber?: string;
  blockName?: string;
  status: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get('/users/me');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.put('/users/me', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.put('/users/me/password', data);
  }

  async uploadAvatar(file: FormData): Promise<string> {
    return apiClient.post('/users/me/avatar', file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

export const userService = new UserService();
