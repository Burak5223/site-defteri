/**
 * useAuth Hook
 * React hook for authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/services';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/lib/api-types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    userId: string;
    siteId: string;
    roles: string[];
    permissions: string[];
  } | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // Initialize auth state
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    setState({
      isAuthenticated: isAuth,
      isLoading: false,
      user,
    });
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authService.login(credentials);
      
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          userId: response.userId,
          siteId: response.siteId,
          roles: response.roles,
          permissions: response.permissions,
        },
      });

      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authService.register(data);
      setState(prev => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    } catch (error) {
      // Still clear state even if API call fails
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  // Check permission
  const hasPermission = useCallback((permission: string): boolean => {
    return authService.hasPermission(permission);
  }, []);

  // Check role
  const hasRole = useCallback((role: string): boolean => {
    return authService.hasRole(role);
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
  };
}

