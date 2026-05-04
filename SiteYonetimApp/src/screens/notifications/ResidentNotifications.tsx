import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { notificationService, Notification } from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

const ResidentNotifications = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning':
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'success': return { bg: 'rgba(16,185,129,0.1)', color: '#16a34a' };
      case 'warning': return { bg: 'rgba(245,158,11,0.1)', color: '#b45309' };
      case 'error': return { bg: 'rgba(239,68,68,0.1)', color: '#b91c1c' };
      case 'info': return { bg: 'rgba(59,130,246,0.1)', color: '#1d4ed8' };
      default: return { bg: '#e5e7eb', color: '#4b5563' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
            <Text style={styles.headerSubtitle}>{unreadCount} {t('notifications.unread')}</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable style={styles.markButton} onPress={markAllAsRead}>
              <Check size={14} color="#0f766e" style={{ marginRight: 4 }} />
              <Text style={styles.markButtonText}>{t('notifications.markAllRead')}</Text>
            </Pressable>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {notifications.map(notification => {
              const Icon = getTypeIcon(notification.type);
              const typeColors = getTypeColors(notification.type);
              const read = notification.isRead;

              return (
                <Pressable 
                  key={notification.id} 
                  style={[styles.card, !read && styles.cardUnread]}
                  onPress={() => markAsRead(notification.id)}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconWrapper, { backgroundColor: typeColors.bg }]}>
                      <Icon size={20} color={typeColors.color} />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleWrapper}>
                          <Text style={styles.cardTitle}>{notification.title}</Text>
                          <Text style={styles.cardMessage} numberOfLines={2}>{notification.message}</Text>
                        </View>
                        {!read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.dateText}>{formatDate(notification.createdAt)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32, rowGap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  markButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e5e7eb' },
  markButtonText: { fontSize: 11, color: '#0f766e', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 8, fontSize: 13, color: colors.textSecondary },
  listSpace: { rowGap: 8 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 10 },
  cardUnread: { borderColor: 'rgba(15,118,110,0.3)', backgroundColor: 'rgba(15,118,110,0.04)' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrapper: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  cardMessage: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  unreadDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.primary, marginLeft: 6, marginTop: 4 },
  dateText: { marginTop: 6, fontSize: 11, color: colors.textSecondary },
});

export default ResidentNotifications;
