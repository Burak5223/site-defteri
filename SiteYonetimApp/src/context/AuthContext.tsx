import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';
import { AuthResponse, User, LoginRequest } from '../types';
import { notificationService } from '../services/notification.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  switchSite: (siteId: string, siteName: string) => Promise<void>;
  switchApartment: (apartmentId: string, blockName: string, unitNumber: string) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isImpersonating: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    loadUser();
    
    // Notification service'i başlat (background handler için)
    notificationService.setupBackgroundNotificationHandler();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const impersonatingFlag = await AsyncStorage.getItem('isImpersonating');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsImpersonating(impersonatingFlag === 'true');
        
        console.log('Loading user:', parsedUser);
        console.log('Is impersonating:', impersonatingFlag === 'true');
        
        // Kullanıcı varsa notification service'i başlat
        await notificationService.initialize();
      }
    } catch (error) {
      console.error('User loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      // Get fresh user data from backend
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        await loadUser(); // Fallback to storage
        return;
      }
      
      // Call /auth/me or similar endpoint to get fresh user data
      // For now, just reload from storage
      await loadUser();
    } catch (error) {
      console.error('Refresh user error:', error);
      await loadUser();
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      console.log('🔄 Login başlatılıyor...', credentials.email);
      
      // Check if this is an impersonation call
      if (credentials.password === 'impersonated') {
        // Just reload the user from storage (already set by impersonation)
        await loadUser();
        return;
      }
      
      // Backend login request
      console.log('📡 Backend login request sending...');
      const response: AuthResponse = await apiClient.post('/auth/login', credentials);
      
      console.log('✅ Login response received:', response);
      
      // Save tokens
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken || response.accessToken);
      
      // Site bilgisini çek
      let siteName = 'Site';
      try {
        const siteId = response.user.siteId || response.siteId || '1';
        console.log('🏢 Getting site info, siteId:', siteId);
        const siteResponse = await apiClient.get(`/sites/${siteId}`);
        siteName = (siteResponse as any).name || 'Site';
        console.log('✅ Site info received:', siteName);
      } catch (error) {
        console.warn('⚠️ Could not get site info:', error);
      }
      
      // Create user data
      const nameParts = response.user.fullName.split(' ');
      const userData: User = {
        userId: response.userId,
        email: credentials.email,
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        fullName: response.user.fullName,
        phoneNumber: response.user.phone || '',
        phone: response.user.phone || '',
        roles: response.roles,
        siteId: response.user.siteId || response.siteId || '1',
        siteName: siteName,
        apartmentId: response.user.apartmentId, // Add apartmentId from backend
        blockName: (response.user as any).blockName, // Add blockName from backend
        unitNumber: (response.user as any).unitNumber, // Add unitNumber from backend
      };
      
      console.log('👤 User data created:', userData);
      console.log('🔑 User roles:', userData.roles);
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsImpersonating(false);
      
      console.log('🎉 Login successful!');
      
      // Login başarılı, notification service'i başlat
      await notificationService.initialize();
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // More detailed error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Connection timeout. Please try again.');
        } else if (error.message.includes('Network')) {
          throw new Error('Network connection problem. Check your internet connection.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Email or password incorrect.');
        } else if (error.message.includes('500')) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Check if we're impersonating
      const impersonatingFlag = await AsyncStorage.getItem('isImpersonating');
      const originalUserData = await AsyncStorage.getItem('originalUser');
      const originalToken = await AsyncStorage.getItem('originalToken');
      
      if (impersonatingFlag === 'true' && originalUserData && originalToken) {
        // Return to original user (Super Admin)
        console.log('🔄 Returning to original user...');
        
        // Restore original user and token
        await AsyncStorage.setItem('user', originalUserData);
        await AsyncStorage.setItem('accessToken', originalToken);
        await AsyncStorage.multiRemove(['isImpersonating', 'originalUser', 'originalToken', 'originalRole']);
        
        const parsedUser = JSON.parse(originalUserData);
        setUser(parsedUser);
        setIsImpersonating(false);
        
        console.log('✅ Returned to original user:', parsedUser.email);
        return;
      }
      
      // Normal logout
      await AsyncStorage.multiRemove([
        'accessToken', 
        'refreshToken', 
        'user', 
        'isImpersonating', 
        'originalUser', 
        'originalToken', 
        'originalRole'
      ]);
      setUser(null);
      setIsImpersonating(false);
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  // Alias for logout to match web interface
  const signOut = logout;

  const switchSite = async (siteId: string, siteName: string) => {
    try {
      if (!user) return;
      
      // Update user with new siteId and siteName
      const updatedUser = {
        ...user,
        siteId: siteId,
        siteName: siteName,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log(`Switched to site: ${siteName} (${siteId})`);
      
      // React Native'de CustomEvent yok, sadece state güncellemesi yeterli
      // useEffect([user?.siteId]) ile otomatik yenileniyor
    } catch (error) {
      console.error('Switch site error:', error);
      throw error;
    }
  };

  const switchApartment = async (apartmentId: string, blockName: string, unitNumber: string) => {
    try {
      if (!user) return;
      
      // Şimdilik backend çağrısı yapmadan sadece local state'i güncelle
      // Backend endpoint hazır olunca aşağıdaki satırı aktif ederiz:
      // await apiClient.post('/users/me/switch-apartment', { apartmentId });
      
      // Update user with new apartment info
      const updatedUser = {
        ...user,
        apartmentId: apartmentId,
        blockName: blockName,
        unitNumber: unitNumber,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log(`Switched to apartment: ${blockName} - ${unitNumber} (${apartmentId})`);
    } catch (error) {
      console.error('Switch apartment error:', error);
      throw error;
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user?.roles) return false;
    
    // Hem "ADMIN" hem "ROLE_ADMIN" formatını destekle
    const roleToCheck = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    const roleWithoutPrefix = role.startsWith('ROLE_') ? role.substring(5) : role;
    
    return user.roles.includes(roleToCheck) || user.roles.includes(roleWithoutPrefix);
  };

  const hasPermission = (permissionName: string): boolean => {
    // İzin kontrolü - şimdilik basit kontrol
    // Backend entegrasyonunda daha detaylı olacak
    if (!user) return false;
    
    // Super admin her şeyi yapabilir
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    
    // Admin çoğu şeyi yapabilir
    if (user.roles?.includes('ADMIN')) return true;
    
    // Diğer roller için özel izinler
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signOut,
        switchSite,
        switchApartment,
        hasRole,
        hasPermission,
        isImpersonating,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
