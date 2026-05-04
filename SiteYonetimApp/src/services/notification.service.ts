// Firebase devre dışı - Expo Go ile çalışmıyor
// Native build için Firebase eklenecek

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

/**
 * Notification Service (Firebase Disabled)
 * Firebase native modülleri Expo Go'da çalışmadığı için devre dışı
 */
class NotificationService {
  
  /**
   * FCM token al (Devre dışı)
   */
  async getFcmToken(): Promise<string | null> {
    console.log('⚠️ Firebase devre dışı - Native build gerekli');
    return null;
  }

  /**
   * FCM token'ı backend'e kaydet (Devre dışı)
   */
  async registerFcmToken(token: string): Promise<boolean> {
    console.log('⚠️ Firebase devre dışı - Native build gerekli');
    return false;
  }

  /**
   * Foreground bildirimleri dinle (Devre dışı)
   */
  setupForegroundNotificationHandler() {
    console.log('⚠️ Firebase devre dışı - Native build gerekli');
  }

  /**
   * Background bildirimleri dinle (Devre dışı)
   */
  setupBackgroundNotificationHandler() {
    console.log('⚠️ Firebase devre dışı - Native build gerekli');
  }

  /**
   * Token yenilendiğinde (Devre dışı)
   */
  setupTokenRefreshHandler() {
    console.log('⚠️ Firebase devre dışı - Native build gerekli');
  }

  /**
   * Tüm notification sistemini başlat (Devre dışı)
   */
  async initialize(): Promise<void> {
    console.log('⚠️ Notification Service devre dışı (Firebase yok)');
    console.log('ℹ️ Native build için: npx expo run:android');
  }

  /**
   * Bildirimleri getir (Devre dışı - boş liste döner)
   */
  async getNotifications(): Promise<Notification[]> {
    console.log('⚠️ getNotifications devre dışı');
    return [];
  }

  /**
   * Bildirimi okundu olarak işaretle (Devre dışı)
   */
  async markAsRead(id: string): Promise<void> {
    console.log('⚠️ markAsRead devre dışı, id:', id);
  }

  /**
   * Tüm bildirimleri okundu olarak işaretle (Devre dışı)
   */
  async markAllAsRead(): Promise<void> {
    console.log('⚠️ markAllAsRead devre dışı');
  }
}

export const notificationService = new NotificationService();
