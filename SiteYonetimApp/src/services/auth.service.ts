/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types';

export class AuthService {
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>(
      '/auth/login',
      credentials
    );

    const authResponse: AuthResponse = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || '',
      tokenType: response.tokenType || 'Bearer',
      userId: response.userId || response.user?.id || '',
      siteId: response.siteId || '1',
      roles: response.roles || [],
      permissions: response.permissions || [],
      user: {
        fullName: response.user?.fullName || response.fullName || '',
        phone: response.user?.phone || response.phone || '',
        siteId: response.siteId || '1',
        email: response.user?.email || response.email || '',
        apartmentId: response.user?.apartmentId || response.apartmentId,
        residentType: response.user?.residentType || response.residentType
      }
    };

    // Store tokens
    await AsyncStorage.setItem('accessToken', authResponse.accessToken);
    if (authResponse.refreshToken) {
      await AsyncStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    await AsyncStorage.setItem('user', JSON.stringify({
      userId: authResponse.userId,
      siteId: authResponse.siteId,
      roles: authResponse.roles,
      permissions: authResponse.permissions,
    }));

    return authResponse;
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<any> {
    return apiClient.post<any>('/auth/register', data);
  }

  /**
   * Verify OTP code
   * POST /api/auth/verify-otp
   */
  async verifyOtp(data: { phoneNumber: string; otpCode: string }): Promise<any> {
    return apiClient.post<any>('/auth/verify-otp', data);
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken } as RefreshTokenRequest
    );

    await AsyncStorage.setItem('accessToken', response.accessToken);
    await AsyncStorage.setItem('refreshToken', response.refreshToken);

    return response;
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  }

  /**
   * Get current user from AsyncStorage
   */
  async getCurrentUser(): Promise<{
    userId: string;
    siteId: string;
    roles: string[];
    permissions: string[];
  } | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  }
}

// Export singleton instance
export const authService = new AuthService();

