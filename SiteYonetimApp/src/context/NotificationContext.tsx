import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { announcementService } from '../services/announcement.service';
import { messageService } from '../services/message.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadAnnouncementsCount: number;
  unreadMessagesCount: number;
  markAnnouncementsAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshUnreadMessages: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (user?.siteId && user?.roles && !user.roles.includes('ADMIN')) {
      refreshUnreadCount();
      // Her 30 saniyede bir kontrol et
      const interval = setInterval(refreshUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.siteId, user?.roles]);

  useEffect(() => {
    if (user?.siteId && user?.userId) {
      refreshUnreadMessages();
      // Her 30 saniyede bir kontrol et
      const interval = setInterval(refreshUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.siteId, user?.userId]);

  const refreshUnreadCount = async () => {
    if (!user?.siteId || !user?.roles || user.roles.includes('ADMIN')) {
      setUnreadAnnouncementsCount(0);
      return;
    }

    try {
      // Son görülen duyuru tarihini al
      const lastSeenKey = `lastSeenAnnouncement_${user.siteId}_${user.userId}`;
      const lastSeenStr = await AsyncStorage.getItem(lastSeenKey);
      // Eğer hiç görülmemişse, 30 gün öncesini kullan (tüm yeni duyuruları göster)
      const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Tüm duyuruları çek
      const announcements = await announcementService.getAnnouncements(user.siteId);
      
      // Son görülenden sonra oluşturulan duyuruları say
      const unreadCount = announcements.filter(a => {
        const createdAt = new Date(a.createdAt);
        return createdAt > lastSeen;
      }).length;

      console.log('Unread announcements:', unreadCount, 'Last seen:', lastSeen);
      setUnreadAnnouncementsCount(unreadCount);
    } catch (error: any) {
      console.error('Refresh unread count error:', error);
      // 403 hatası ise (yetki yok) badge'i gizle
      if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
        console.log('User does not have permission to view announcements');
      }
      setUnreadAnnouncementsCount(0);
    }
  };

  const markAnnouncementsAsRead = async () => {
    if (!user?.siteId || !user?.userId) return;

    try {
      const lastSeenKey = `lastSeenAnnouncement_${user.siteId}_${user.userId}`;
      const now = new Date().toISOString();
      await AsyncStorage.setItem(lastSeenKey, now);
      console.log('Announcements marked as read at:', now);
      setUnreadAnnouncementsCount(0);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const refreshUnreadMessages = async () => {
    if (!user?.siteId || !user?.userId) {
      setUnreadMessagesCount(0);
      return;
    }

    try {
      // Tüm mesajları al
      const allMessages = await messageService.getMyMessages();
      
      // Okunmamış mesajları say (kullanıcının aldığı mesajlar)
      const unreadCount = allMessages.filter(m => 
        m.receiverId === user.userId && !m.isRead
      ).length;
      
      console.log('Total messages:', allMessages.length, 'Unread messages:', unreadCount);
      setUnreadMessagesCount(unreadCount);
    } catch (error: any) {
      console.error('Refresh unread messages error:', error);
      setUnreadMessagesCount(0);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadAnnouncementsCount,
        unreadMessagesCount,
        markAnnouncementsAsRead,
        refreshUnreadCount,
        refreshUnreadMessages,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
