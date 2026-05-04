import { apiClient } from '../api/apiClient';

export interface SuperAdminStats {
  totalSites: number;
  totalManagers: number;
  totalResidents: number;
  totalApartments: number;
  performanceScore: number;
  monthlyIncome: number;
  openTickets: number;
  unpaidDues: number;
  waitingPackages: number;
}

export interface Manager {
  userId?: string;
  email?: string;
  fullName: string;
  phone: string;
  siteId: string;
  siteName: string;
  unreadCount?: number;
}

export interface SiteWithStats {
  id: string;
  name: string;
  city: string;
  address: string;
  subscriptionStatus: string;
  totalApartments: number;
  totalResidents: number;
}

class SuperAdminService {
  /**
   * Get Super Admin Dashboard Statistics
   */
  async getDashboardStats(): Promise<SuperAdminStats> {
    try {
      const response = await apiClient.get<SuperAdminStats>('/super-admin/dashboard');
      return response;
    } catch (error) {
      console.error('Error getting super admin dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get all managers
   */
  async getAllManagers(siteId?: string): Promise<Manager[]> {
    try {
      console.log('🔄 SuperAdminService: Getting managers...');
      const url = siteId 
        ? `/super-admin/managers?siteId=${siteId}`
        : '/super-admin/managers';
      console.log('🔗 Request URL:', url);
      
      const response = await apiClient.get<Manager[]>(url);
      console.log('✅ SuperAdminService: Raw response:', response);
      
      // Ensure we return an array
      if (Array.isArray(response)) {
        console.log('✅ SuperAdminService: Valid array response with', response.length, 'managers');
        return response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Handle wrapped response
        const data = (response as any).data;
        if (Array.isArray(data)) {
          console.log('✅ SuperAdminService: Wrapped array response with', data.length, 'managers');
          return data;
        }
      }
      
      console.warn('⚠️ SuperAdminService: Response is not an array:', response);
      return [];
    } catch (error) {
      console.error('❌ SuperAdminService: Error getting managers:', error);
      // Return empty array instead of throwing to prevent unhandled promise rejection
      return [];
    }
  }

  /**
   * Get all sites with statistics
   */
  async getAllSites(): Promise<SiteWithStats[]> {
    try {
      const response = await apiClient.get<SiteWithStats[]>('/super-admin/sites');
      return response;
    } catch (error) {
      console.error('Error getting sites:', error);
      throw error;
    }
  }

  /**
   * Create new manager
   */
  async createManager(data: {
    email: string;
    fullName: string;
    phone: string;
    password: string;
    siteId: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post('/super-admin/managers', data);
      return response;
    } catch (error) {
      console.error('Error creating manager:', error);
      throw error;
    }
  }

  /**
   * Send bulk announcement to all sites
   */
  async sendBulkAnnouncement(data: {
    title: string;
    content: string;
    priority?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post('/super-admin/bulk-announcements', data);
      return response;
    } catch (error) {
      console.error('Error sending bulk announcement:', error);
      throw error;
    }
  }

  /**
   * Generate report
   */
  async generateReport(data: {
    reportType: string;
    reportName: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post('/super-admin/reports', data);
      return response;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Impersonate site admin
   */
  async impersonateSiteAdmin(siteId: string): Promise<any> {
    try {
      const response = await apiClient.post('/super-admin/impersonate', { siteId });
      return response;
    } catch (error) {
      console.error('Error impersonating site admin:', error);
      throw error;
    }
  }

  /**
   * Get all residents across all sites
   */
  async getAllResidents(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/super-admin/residents');
      return response;
    } catch (error) {
      console.error('Error getting residents:', error);
      throw error;
    }
  }

  /**
   * Get finance data
   */
  async getFinanceData(period: string = 'month'): Promise<any> {
    try {
      const response = await apiClient.get(`/super-admin/finance?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error getting finance data:', error);
      throw error;
    }
  }

  /**
   * Get performance data
   */
  async getPerformanceData(): Promise<any> {
    try {
      const response = await apiClient.get('/super-admin/performance');
      return response;
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw error;
    }
  }

  /**
   * Get messages with a specific manager
   */
  async getMessagesWithManager(managerId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/super-admin/messages/${managerId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting messages with manager:', error);
      return [];
    }
  }

  /**
   * Send message to manager
   */
  async sendMessageToManager(recipientId: string, content: string): Promise<any> {
    try {
      const response = await apiClient.post('/super-admin/messages', {
        recipientId,
        content
      });
      return response;
    } catch (error) {
      console.error('Error sending message to manager:', error);
      throw error;
    }
  }

  /**
   * Get all system messages from all sites
   */
  async getAllSystemMessages(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/super-admin/system-messages');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting all system messages:', error);
      return [];
    }
  }

  /**
   * Get system messages from a specific site
   */
  async getSystemMessagesBySite(siteId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/super-admin/system-messages/${siteId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting system messages by site:', error);
      return [];
    }
  }

  /**
   * Reply to system message
   */
  async replyToSystemMessage(siteId: string, recipientId: string, content: string): Promise<any> {
    try {
      const response = await apiClient.post(`/super-admin/system-messages/${siteId}/reply`, {
        recipientId,
        content
      });
      return response;
    } catch (error) {
      console.error('Error replying to system message:', error);
      throw error;
    }
  }
}

export const superAdminService = new SuperAdminService();
