import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Shield, ClipboardList, CheckCircle, Package, Users, Bell, UserCircle, LogOut } from 'lucide-react-native';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { taskService, Task } from '../../services/task.service';
import { announcementService, Announcement } from '../../services/announcement.service';
import { packageService, Package as PackageType } from '../../services/package.service';
import { useI18n } from '../../context/I18nContext';

export function SecurityDashboard() {
  const { signOut, user } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    pendingPackages: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user?.siteId]);

  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadDashboard();
      }
    }, [user?.siteId])
  );

  const normalizeStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'bekliyor' || statusLower === 'pending') return 'pending';
    if (statusLower === 'devam_ediyor' || statusLower === 'in_progress') return 'in_progress';
    if (statusLower === 'tamamlandi' || statusLower === 'completed') return 'completed';
    return 'pending';
  };

  const loadDashboard = async () => {
    if (!user?.siteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Görevleri çek - görev sayfası ile aynı veri akışı
      const allTasks = await taskService.getTasks(user.siteId);
      const securityTasks = allTasks.map(task => ({
        ...task,
        status: normalizeStatus(task.status as string)
      }));

      // Görev istatistiklerini hesapla
      const totalTasks = securityTasks.length;
      const completedTasks = securityTasks.filter(t => t.status === 'completed').length;
      const pendingTasks = totalTasks - completedTasks;

      // Paketleri çek
      const allPackages = await packageService.getPackages(user.siteId);
      const pendingPackages = allPackages.filter(pkg => 
        pkg.status === 'pending' || pkg.status === 'waiting'
      ).length;

      // Duyuruları çek (son 3 duyuru)
      const announcements = await announcementService.getAnnouncements(user.siteId);
      const sortedAnnouncements = announcements
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        pendingPackages,
      });
      setRecentAnnouncements(sortedAnnouncements);
      setRecentTasks(securityTasks.slice(0, 3)); // Son 3 görev
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.siteInfo}>
          <Shield size={32} color={colors.primary} />
          <View style={styles.siteText}>
            <Text style={styles.siteName}>{user?.siteName || t('dashboard.siteName')}</Text>
            <Text style={styles.roleText}>Güvenlik Personeli</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
            <UserCircle size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Hoş Geldiniz!</Text>
        <Text style={styles.welcomeSubtitle}>Bugün güvenlik görevlerinizi buradan takip edebilirsiniz</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Pressable 
          style={[styles.statCard, { backgroundColor: '#FFF4E6' }]}
          onPress={() => navigation.navigate('SecurityTasks')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#FFE4CC' }]}>
            <ClipboardList size={24} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Toplam Görev</Text>
        </Pressable>

        <Pressable 
          style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}
          onPress={() => navigation.navigate('SecurityTasks')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#C8E6C9' }]}>
            <CheckCircle size={24} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{stats.completedTasks}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </Pressable>

        <Pressable 
          style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}
          onPress={() => navigation.navigate('SecurityTasks')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#BBDEFB' }]}>
            <ClipboardList size={24} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>{stats.pendingTasks}</Text>
          <Text style={styles.statLabel}>Bekleyen Görev</Text>
        </Pressable>

        <Pressable 
          style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}
          onPress={() => navigation.navigate('SecurityPackages')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#E1BEE7' }]}>
            <Package size={24} color="#9C27B0" />
          </View>
          <Text style={styles.statValue}>{stats.pendingPackages}</Text>
          <Text style={styles.statLabel}>Bekleyen Paket</Text>
        </Pressable>
      </View>

      {/* Son Duyurular */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Duyurular</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {recentAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={32} color={colors.gray300} />
            <Text style={styles.emptyText}>Henüz duyuru yok</Text>
          </View>
        ) : (
          recentAnnouncements.map((announcement) => (
            <Pressable 
              key={announcement.id} 
              style={styles.announcementCard}
              onPress={() => navigation.navigate('ResidentAnnouncements')}
            >
              <View style={styles.announcementIcon}>
                <Bell size={20} color={
                  announcement.priority === 'high' ? '#ef4444' :
                  announcement.priority === 'medium' ? '#FF9800' : '#4CAF50'
                } />
              </View>
              <View style={styles.announcementContent}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  {announcement.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>Önemli</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.announcementText} numberOfLines={2}>
                  {announcement.content}
                </Text>
                <Text style={styles.announcementDate}>
                  {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Bugünkü Görevler */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Görevler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {recentTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={32} color={colors.gray300} />
            <Text style={styles.emptyText}>Henüz görev yok</Text>
          </View>
        ) : (
          recentTasks.map((task) => (
            <Pressable 
              key={task.id} 
              style={styles.taskCard}
              onPress={() => navigation.navigate('SecurityTasks')}
            >
              <View style={[styles.taskIcon, { 
                backgroundColor: task.status === 'completed' ? '#E8F5E9' : 
                               task.status === 'in_progress' ? '#E3F2FD' : '#FFF4E6'
              }]}>
                <Shield size={20} color={
                  task.status === 'completed' ? colors.success :
                  task.status === 'in_progress' ? '#2196F3' : '#FF9800'
                } />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>
                <Text style={styles.taskDate}>
                  {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View style={[styles.taskStatus, {
                backgroundColor: task.status === 'completed' ? '#E8F5E9' :
                                task.status === 'in_progress' ? '#E3F2FD' : '#FFF4E6'
              }]}>
                <Text style={[styles.taskStatusText, {
                  color: task.status === 'completed' ? colors.success :
                        task.status === 'in_progress' ? '#2196F3' : '#FF9800'
                }]}>
                  {task.status === 'completed' ? 'Tamamlandı' :
                   task.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor'}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteText: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  roleText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  welcomeCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '500',
  },
  announcementText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  announcementDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskStatus: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  taskStatusText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
});

