import { apiClient } from '../api/apiClient';

// Backend'den gelen tam response yapısı
export interface DashboardStatsResponse {
  // Genel İstatistikler
  totalSites?: number;
  totalManagers?: number;
  totalResidents?: number;
  totalApartments?: number;
  averagePerformance?: number;
  
  // Finansal İstatistikler
  monthlyIncome?: number;
  monthlyExpense?: number;
  totalBalance?: number;
  incomeGrowth?: number;
  
  // Aidat İstatistikleri
  totalDues?: number;
  paidDues?: number;
  unpaidDues?: number;
  unpaidAmount?: number;
  collectionRate?: number;
  
  // Arıza/Ticket İstatistikleri
  totalTickets?: number;
  openTickets?: number;
  inProgressTickets?: number;
  resolvedTickets?: number;
  closedTickets?: number;
  resolutionRate?: number;
  
  // Paket İstatistikleri
  totalPackages?: number;
  waitingPackages?: number;
  deliveredPackages?: number;
  deliveryRate?: number;
  
  // Mesaj İstatistikleri
  totalMessages?: number;
  unreadMessages?: number;
  
  // Duyuru İstatistikleri
  totalAnnouncements?: number;
  activeAnnouncements?: number;
  
  // Görev İstatistikleri
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  
  // Bakım İstatistikleri
  totalMaintenanceEquipment?: number;
  upcomingMaintenance?: number;
  overdueMaintenance?: number;
}

// Eski interface'ler backward compatibility için
export interface DashboardStats {
  pendingDues: number;
  pendingDuesAmount: number;
  openTickets: number;
  totalApartments: number;
  totalIncome: number;
  totalExpense: number;
  recentAnnouncements: number;
  waitingPackages: number;
}

export interface ResidentDashboardStats {
  pendingDues: number;
  pendingDuesAmount: number;
  myTickets: number;
  myPackages: number;
  unreadNotifications: number;
  unreadMessages: number;
}

class DashboardService {
  async getAdminDashboard(siteId: string): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStatsResponse>(`/sites/${siteId}/dashboard`);
    
    // Backend response'u eski format'a dönüştür
    return {
      pendingDues: response.unpaidDues || 0,
      pendingDuesAmount: response.unpaidAmount || 0,
      openTickets: response.openTickets || 0,
      totalApartments: response.totalApartments || 0,
      totalIncome: response.monthlyIncome || 0,
      totalExpense: response.monthlyExpense || 0,
      recentAnnouncements: response.activeAnnouncements || 0,
      waitingPackages: response.waitingPackages || 0,
    };
  }

  async getResidentDashboard(siteId: string): Promise<ResidentDashboardStats> {
    const response = await apiClient.get<DashboardStatsResponse>(`/sites/${siteId}/dashboard/resident`);
    
    // Backend response'u eski format'a dönüştür
    return {
      pendingDues: response.unpaidDues || 0,
      pendingDuesAmount: response.unpaidAmount || 0,
      myTickets: response.openTickets || 0,
      myPackages: response.waitingPackages || 0,
      unreadNotifications: 0, // TODO: Backend'den gelecek
      unreadMessages: response.unreadMessages || 0,
    };
  }

  async getSecurityDashboard(siteId: string): Promise<any> {
    return apiClient.get(`/sites/${siteId}/dashboard`);
  }
}

export const dashboardService = new DashboardService();
