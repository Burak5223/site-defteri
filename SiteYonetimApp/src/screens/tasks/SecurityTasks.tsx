import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { taskService, Task } from '../../services/task.service';

export function SecurityTasks() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentSiteId = user?.siteId || '1';

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getTasks(currentSiteId);
      console.log('SecurityTasks - All tasks:', data.length);
      console.log('SecurityTasks - Tasks data:', JSON.stringify(data, null, 2));
      
      // Backend'den gelen status'leri normalize et (bekliyor -> pending, devam_ediyor -> in_progress, tamamlandi -> completed)
      const normalizeStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'bekliyor' || statusLower === 'pending') return 'pending';
        if (statusLower === 'devam_ediyor' || statusLower === 'in_progress') return 'in_progress';
        if (statusLower === 'tamamlandi' || statusLower === 'completed') return 'completed';
        return 'pending'; // default
      };
      
      // Sadece güvenliğe atanan görevleri filtrele ve status'u normalize et
      const securityTasks = data
        .filter(task => 
          task.assignedTo?.includes('SECURITY') || 
          task.assignedTo?.toLowerCase().includes('güvenlik')
        )
        .map(task => ({
          ...task,
          status: normalizeStatus(task.status as string)
        }));
      
      console.log('SecurityTasks - Filtered tasks:', securityTasks.length);
      console.log('SecurityTasks - Filtered data:', JSON.stringify(securityTasks, null, 2));
      
      setTasks(securityTasks);
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
      Alert.alert(t('common.error'), 'Görevler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const startTask = async (taskId: string) => {
    try {
      // Backend Türkçe status bekliyor: devam_ediyor
      await taskService.updateTaskStatus(currentSiteId, taskId, 'devam_ediyor');
      await loadTasks();
      Alert.alert(t('common.success'), 'Görev başlatıldı');
    } catch (error) {
      console.error('Görev başlatılamadı:', error);
      Alert.alert(t('common.error'), 'Görev başlatılamadı');
    }
  };

  const completeTask = async (siteId: string, taskId: string) => {
    try {
      await taskService.completeTask(siteId, taskId);
      await loadTasks();
      Alert.alert(t('common.success'), 'Görev tamamlandı');
    } catch (error) {
      console.error('Görev tamamlanamadı:', error);
      Alert.alert(t('common.error'), 'Görev tamamlanamadı');
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      default:
        return tasks;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
      default:
        return colors.info;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
      default:
        return 'Düşük';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredTasks = getFilteredTasks();
  const pendingCount = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('securityTasks.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {pendingCount} {t('securityTasks.pendingTasks')}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
          >
            {t('securityTasks.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText,
            ]}
          >
            {t('securityTasks.pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            {t('securityTasks.completed')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <ScrollView style={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Shield size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Görev bulunamadı</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(task.priority || 'low')}20` },
                  ]}
                >
                  <AlertCircle
                    size={12}
                    color={getPriorityColor(task.priority || 'low')}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(task.priority || 'low') },
                    ]}
                  >
                    {getPriorityLabel(task.priority || 'low')}
                  </Text>
                </View>
              </View>

              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>

              <View style={styles.taskMeta}>
                {task.assignedBy && (
                  <View style={styles.taskMetaItem}>
                    <FileText size={14} color={colors.gray500} />
                    <Text style={styles.taskMetaText}>
                      Atayan: {task.assignedBy}
                    </Text>
                  </View>
                )}
                <View style={styles.taskMetaItem}>
                  <Clock size={14} color={colors.gray500} />
                  <Text style={styles.taskMetaText}>
                    {formatDate(task.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Butonlar - Her zaman göster */}
              <View style={styles.buttonContainer}>
                {task.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startTask(task.id)}
                  >
                    <Text style={styles.actionButtonText}>Başla</Text>
                  </TouchableOpacity>
                )}

                {task.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => completeTask(currentSiteId, task.id)}
                  >
                    <CheckCircle size={18} color={colors.white} />
                    <Text style={[styles.actionButtonText, styles.completeButtonText]}>
                      Tamamla
                    </Text>
                  </TouchableOpacity>
                )}

                {task.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <CheckCircle size={18} color={colors.success} />
                    <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.headerSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  taskList: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  taskCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.badge,
    gap: 4,
  },
  priorityText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.badge,
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
  },
  inProgressBadge: {
    backgroundColor: colors.infoLight,
  },
  completedStatusBadge: {
    backgroundColor: colors.successLight,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  pendingText: {
    color: colors.warning,
  },
  inProgressText: {
    color: colors.info,
  },
  completedStatusText: {
    color: colors.success,
  },
  taskTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: spacing.iconMarginSm,
  },
  actionButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  completeButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  completeButtonText: {
    color: colors.white,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    backgroundColor: colors.successLight,
    gap: spacing.iconMarginSm,
  },
  completedBadgeText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
});
