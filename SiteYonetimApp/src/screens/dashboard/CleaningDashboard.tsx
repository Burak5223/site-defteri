import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Sparkles, ClipboardList, CheckCircle, Bell, UserCircle, LogOut } from 'lucide-react-native';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { taskService, Task } from '../../services/task.service';
import { announcementService, Announcement } from '../../services/announcement.service';
import { useI18n } from '../../context/I18nContext';

export function CleaningDashboard() {
  const { signOut, user } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayTasks: 0,
    weekTasks: 0,
    completedToday: 0,
    completedWeek: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

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
      // Görevleri çek
      const allTasks = await taskService.getTasks(user.siteId);
      const cleaningTasks = allTasks
        .filter(task => 
          task.assignedTo?.includes('CLEANING') || 
          task.assignedTo?.toLowerCase().includes('temizlik')
        )
        .map(task => ({
          ...task,
          status: normalizeStatus(task.status as string)
        }));

      // Bugünün tarihi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Bu haftanın başlangıcı (Pazartesi)
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      // Bugün oluşturulan görevler
      const todayTasksList = cleaningTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= today && taskDate <= todayEnd;
      });

      // Bu hafta oluşturulan görevler
      const weekTasksList = cleaningTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart;
      });

      // Bugün tamamlanan görevler
      const completedToday = cleaningTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return task.status === 'completed' && taskDate >= today && taskDate <= todayEnd;
      }).length;

      // Bu hafta tamamlanan görevler
      const completedWeek = cleaningTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return task.status === 'completed' && taskDate >= weekStart;
      }).length;

      // Duyuruları çek (son 3 duyuru)
      const announcements = await announcementService.getAnnouncements(user.siteId);
      const sortedAnnouncements = announcements
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      setStats({
        todayTasks: todayTasksList.length,
        weekTasks: weekTasksList.length,
        completedToday,
        completedWeek,
      });
      setRecentAnnouncements(sortedAnnouncements);
      setTodayTasks(todayTasksList.slice(0, 3)); // Son 3 görev
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
          <Sparkles size={32} color="#9C27B0" />
          <View style={styles.siteText}>
            <Text style={styles.siteName}>{user?.siteName || t('dashboard.siteName')}</Text>
            <Text style={styles.roleText}>Temizlik Personeli</Text>
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
        <Text style={styles.welcomeSubtitle}>Bugün temizlik görevlerinizi buradan takip edebilirsiniz</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Pressable style={[styles.statCard, { backgroundColor: '#FFF4E6' }]} onPress={() => navigation.navigate('CleaningTasks')}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE4CC' }]}>
            <ClipboardList size={24} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{stats.todayTasks}</Text>
          <Text style={styles.statLabel}>Bugün Atanan</Text>
        </Pressable>

        <Pressable style={[styles.statCard, { backgroundColor: '#E8F5E9' }]} onPress={() => navigation.navigate('CleaningTasks')}>
          <View style={[styles.statIcon, { backgroundColor: '#C8E6C9' }]}>
            <CheckCircle size={24} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>Bugün Tamamlanan</Text>
        </Pressable>

        <Pressable style={[styles.statCard, { backgroundColor: '#E3F2FD' }]} onPress={() => navigation.navigate('CleaningTasks')}>
          <View style={[styles.statIcon, { backgroundColor: '#BBDEFB' }]}>
            <ClipboardList size={24} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>{stats.weekTasks}</Text>
          <Text style={styles.statLabel}>Bu Hafta Atanan</Text>
        </Pressable>

        <Pressable style={[styles.statCard, { backgroundColor: '#F3E5F5' }]} onPress={() => navigation.navigate('CleaningTasks')}>
          <View style={[styles.statIcon, { backgroundColor: '#E1BEE7' }]}>
            <CheckCircle size={24} color="#9C27B0" />
          </View>
          <Text style={styles.statValue}>{stats.completedWeek}</Text>
          <Text style={styles.statLabel}>Bu Hafta Tamamlanan</Text>
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
          <Text style={styles.sectionTitle}>Bugünkü Görevler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={32} color={colors.gray300} />
            <Text style={styles.emptyText}>Bugün için görev yok</Text>
          </View>
        ) : (
          todayTasks.map((task) => (
            <Pressable 
              key={task.id} 
              style={styles.taskCard}
              onPress={() => navigation.navigate('CleaningTasks')}
            >
              <View style={[styles.taskIcon, { 
                backgroundColor: task.status === 'completed' ? '#E8F5E9' : 
                               task.status === 'in_progress' ? '#E3F2FD' : '#FFF4E6'
              }]}>
                <Sparkles size={20} color={
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
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
