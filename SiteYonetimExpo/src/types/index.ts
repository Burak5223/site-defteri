// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tcNo: string;
  siteId: string;
  blockId: string;
  apartmentId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  siteId: string;
  roles: string[];
  permissions: string[];
}

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  siteId: string;
  blockId?: string;
  apartmentId?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSites: number;
  totalManagers: number;
  totalResidents: number;
  totalApartments: number;
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  paidDues: number;
  unpaidDues: number;
  collectionRate: number;
  openTickets: number;
  waitingPackages: number;
  totalMessages: number;
  unreadMessages: number;
}

// Announcement Types
export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  createdBy: string;
  siteId: string;
}

// Due Types
export interface Due {
  dueId: string;
  apartmentId: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  description: string;
}

// Package Types
export interface Package {
  packageId: string;
  recipientName: string;
  recipientPhone: string;
  apartmentId: string;
  status: 'WAITING' | 'DELIVERED';
  arrivalDate: string;
  deliveryDate?: string;
  qrCode: string;
}

// Message Types
export interface Message {
  messageId: string;
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  sentAt: string;
  isRead: boolean;
}

// Ticket Types
export interface Ticket {
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  createdBy: string;
}

// Notification Types
export interface Notification {
  notificationId: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}
