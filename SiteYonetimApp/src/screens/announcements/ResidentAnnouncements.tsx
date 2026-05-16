import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Megaphone,
  AlertTriangle,
  Bell,
  Info,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { announcementService, Announcement } from '../../services/announcement.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

function ResidentAnnouncements() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { markAnnouncementsAsRead, refreshUnreadCount } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Ekran görünür olduğunda duyuruları okundu işaretle
  useFocusEffect(
    React.useCallback(() => {
      // Ekran açıldığında hemen okundu işaretle
      markAnnouncementsAsRead();
      console.log('ResidentAnnouncements screen focused - marking as read');
    }, [])
  );

  const loadData = async () => {
    if (!user?.siteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await announcementService.getAnnouncements(user.siteId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Load announcements error:', error);
      Alert.alert(t('common.error'), t('announcements.noAnnouncements'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getPriorityColors = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return { bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', icon: AlertTriangle, label: t('announcements.urgent') };
      case 'important':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', icon: AlertTriangle, label: t('announcements.important') };
      case 'normal':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', icon: Bell, label: t('announcements.normal') };
      case 'info':
        return { bg: 'rgba(148, 163, 184, 0.08)', color: '#94a3b8', icon: Info, label: t('announcements.info') };
      default:
        return { bg: 'rgba(148, 163, 184, 0.08)', color: '#94a3b8', icon: Info, label: priority };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Megaphone size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('announcements.title')}</Text>
          <Text style={styles.headerSubtitle}>{announcements.length} {t('announcements.count')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >

        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Megaphone size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('announcements.noAnnouncementsYet')}</Text>
          </View>
        ) : (
          announcements.map((announcement) => {
            const priorityColors = getPriorityColors(announcement.priority);
            const PriorityIcon = priorityColors.icon;

            return (
              <View key={announcement.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: priorityColors.bg }]}>
                      <PriorityIcon size={20} color={priorityColors.color} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{announcement.title}</Text>
                      <Text style={styles.cardContent}>{announcement.content}</Text>
                    </View>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                    <Text style={[styles.priorityText, { color: priorityColors.color }]}>{priorityColors.label}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{formatDate(announcement.createdAt)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  headerIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: borderRadius.icon, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.rowGap,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.rowGap,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.rowGap,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.iconMargin,
  },
  cardContent: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  priorityText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.bold,
  },
  cardFooter: {
    paddingTop: spacing.rowGap,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: fontSize.cardTitle,
    color: colors.textTertiary,
    marginTop: spacing.rowGap,
  },
});

export default ResidentAnnouncements;



