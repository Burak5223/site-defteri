import { apiClient } from '../api/apiClient';

export interface Package {
  id: string;
  apartmentId: string;
  apartmentNumber?: string;
  blockName?: string;
  recipientName?: string;
  senderName?: string;
  description?: string;
  status: 'pending' | 'delivered' | 'waiting' | 'requested' | 'beklemede' | 'teslim_edildi' | 'teslim_bekliyor' | 'waiting_confirmation';
  arrivalDate?: string;
  deliveryDate?: string;
  trackingNumber?: string;
  trackingMasked?: string;
  courierCompany?: string;
  courierName?: string;
  receivedDate?: string | null;
  recordedAt?: string;
  deliveredAt?: string;
  packageSize?: string;
  notes?: string;
  photoUrl?: string;
  qrToken?: string;
  qrTokenExpiresAt?: string;
  qrTokenUsed?: boolean;
  // AI Cargo fields
  aiExtracted?: boolean;
  aiExtractionLogId?: number;
  matchedNotificationId?: number;
}

// AI Cargo interfaces
export interface CargoFormData {
  fullName: string;
  trackingNumber: string;
  date: string;
  cargoCompany?: string;
  apartmentNumber?: string;
  notes?: string;
  aiExtracted?: boolean;
  aiExtractionLogId?: number;
}

export interface ValidationResult {
  valid: boolean;
  fieldErrors: { [key: string]: string };
}

export interface MatchingResult {
  matched: boolean;
  notificationId?: number;
  residentId?: string;
  apartmentId?: string;
  residentQrId?: string;
  message?: string;
}

export interface CargoPhotoUploadResponse {
  success: boolean;
  extractedData?: CargoFormData;
  validation?: ValidationResult;
  aiExtractionLogId?: number;
  responseTimeMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface SaveCargoResponse {
  success: boolean;
  packageId?: string;
  matchingResult?: MatchingResult;
  qrToken?: string;
  status?: string;
  errorMessage?: string;
}

export interface ResidentNotificationRequest {
  residentId: string;
  siteId: string;
  apartmentId: string;
  fullName: string;
  cargoCompany?: string;
  expectedDate?: string;
}

export interface ResidentNotificationResponse {
  success: boolean;
  notificationId?: number;
  createdAt?: string;
  errorMessage?: string;
}

export interface ScanQRResponse {
  userId: string;
  fullName: string;
  apartmentId: string;
  apartmentNumber: string;
  blockName: string;
  packages: Package[];
  packageCount: number;
}

export interface CreatePackageRequest {
  apartmentId: string;
  recipientName?: string;
  senderName?: string;
  description?: string;
  trackingNumber?: string;
  courierName?: string;
  courierCompany?: string;
  packageSize?: string;
  notes?: string;
  photoUrl?: string;
  siteId?: string;
}

class PackageService {
  async getPackages(siteId: string = '1'): Promise<Package[]> {
    return apiClient.get(`/sites/${siteId}/packages`);
  }

  async getMyPackages(): Promise<Package[]> {
    return apiClient.get('/packages/my-packages');
  }

  async getPackagesByApartment(apartmentId: string): Promise<Package[]> {
    return apiClient.get(`/apartments/${apartmentId}/packages`);
  }

  async createPackage(data: CreatePackageRequest, siteId: string = '1'): Promise<Package> {
    return apiClient.post(`/sites/${siteId}/packages`, data);
  }

  async deliverPackage(id: string): Promise<void> {
    return apiClient.put(`/packages/${id}/deliver`);
  }

  // QR System Methods
  async getMyQRToken(): Promise<string> {
    const response = await apiClient.get<{ qrToken: string; type: string }>('/users/me/qr-token');
    return response.qrToken;
  }

  async scanResidentQR(userToken: string): Promise<ScanQRResponse> {
    return apiClient.post('/packages/scan-resident-qr', { userToken });
  }

  async collectPackage(packageId: string, qrToken: string): Promise<Package> {
    return apiClient.post(`/packages/${packageId}/collect`, { qrToken });
  }

  // Two-way confirmation methods
  async initiateDelivery(packageId: string): Promise<Package> {
    return apiClient.post(`/packages/${packageId}/initiate-delivery`);
  }

  async bulkInitiateDelivery(packageIds: string[]): Promise<Package[]> {
    return apiClient.post('/packages/bulk-initiate-delivery', { packageIds });
  }

  async confirmReceipt(packageId: string): Promise<Package> {
    return apiClient.post(`/packages/${packageId}/confirm-receipt`);
  }

  async bulkConfirmReceipt(packageIds: string[]): Promise<Package[]> {
    return apiClient.post('/packages/bulk-confirm-receipt', { packageIds });
  }

  async getPendingConfirmation(): Promise<Package[]> {
    return apiClient.get('/packages/pending-confirmation');
  }

  // AI Cargo Registration Methods
  async uploadCargoPhoto(data: {
    photoBase64: string;
    siteId: string;
    securityUserId: string;
  }): Promise<CargoPhotoUploadResponse> {
    return apiClient.post('/packages/upload-cargo-photo', data);
  }

  async saveCargo(data: {
    siteId: string;
    fullName: string;
    trackingNumber: string;
    date: string;
    cargoCompany?: string;
    apartmentNumber?: string;
    notes?: string;
    aiExtracted?: boolean;
    aiExtractionLogId?: number;
    securityUserId?: string;
  }): Promise<SaveCargoResponse> {
    return apiClient.post('/packages/save-cargo', data);
  }

  async createResidentNotification(data: ResidentNotificationRequest): Promise<ResidentNotificationResponse> {
    return apiClient.post('/packages/resident-notification', data);
  }

  async getMyNotifications(): Promise<any[]> {
    return apiClient.get('/packages/my-notifications');
  }

  async getPendingNotifications(siteId: string): Promise<any[]> {
    return apiClient.get(`/sites/${siteId}/cargo-notifications/pending`);
  }
}

export const packageService = new PackageService();
