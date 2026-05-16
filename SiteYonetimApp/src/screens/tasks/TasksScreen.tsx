import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  ClipboardList,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Settings,
  ChevronDown,
  Building,
  Sparkles,
  Shield,
  Wrench,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { taskService, Task } from '../../services/task.service';
import { useI18n } from '../../context/I18nContext';
import { SecurityTasks } from './SecurityTasks';
import { CleaningTasks } from './CleaningTasks';
import { useTheme } from '../../context/ThemeContext';

type TabValue = 'all' | 'pending' | 'completed';

const TasksScreen = () => {
  const { t } = useI18n();
  const { user, hasRole } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  // Güvenlik kullanıcısı için SecurityTasks ekranını göster
  if (hasRole('ROLE_SECURITY')) {
    return <SecurityTasks />;
  }
  
  // Temizlikçi kullanıcısı için CleaningTasks ekranını göster
  if (hasRole('ROLE_CLEANING')) {
    return <CleaningTasks />;
  }
  
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('Temizlik');
  const [assignedRole, setAssignedRole] = useState('ROLE_SECURITY'); // Rol olarak değiştirildi
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskLocation, setTaskLocation] = useState('');

  useEffect(() => {
    loadData();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadData = async () => {
    try {
      const siteId = user?.siteId || '1';
      const data = await taskService.getTasks(siteId);
      setTasks(data);
    } catch (error) {
      console.error('Tasks data load error:', error);
      Alert.alert(t('tickets.error'), t('tasksScreen.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTaskType('Temizlik');
    setAssignedRole('ROLE_SECURITY');
    setPriority('medium');
    setDueDate(new Date().toISOString().split('T')[0]);
    setTaskLocation('');
  };

  const handleAdd = async () => {
    if (!title || !description) {
      Alert.alert(t('tickets.error'), t('tasksScreen.fillAllFields'));
      return;
    }

    try {
      const siteId = user?.siteId || '1';
      await taskService.createTask({
        title,
        description,
        assignedTo: assignedRole, // Rol olarak gönderiliyor
        taskType,
        priority,
        dueDate,
        location: taskLocation,
      }, siteId);
      Alert.alert(t('tickets.success'), t('tasksScreen.createSuccess'));
      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert(t('tickets.error'), t('tasksScreen.operationFailed'));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const siteId = user?.siteId || '1';
      await taskService.completeTask(siteId, taskId);
      Alert.alert(t('tickets.success'), t('tasksScreen.completeSuccess'));
      await loadData();
    } catch (error) {
      console.error('Complete task error:', error);
      Alert.alert(t('tickets.error'), t('tasksScreen.completeError'));
    }
  };

  const getTaskTypeColors = (type: string) => {
    switch (type.toLowerCase()) {
      case 'temizlik':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', icon: Sparkles };
      case 'güvenlik':
        return { bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', icon: Shield };
      case 'bakım':
        return { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', icon: Wrench };
      default:
        return { bg: 'rgba(148, 163, 184, 0.08)', color: colors.textTertiary, icon: ClipboardList };
    }
  };

  const filteredTasks = activeTab === 'all' ? tasks : tasks.filter(t => {
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const normalizeRoleValue = (value?: string) => {
    return (value || '')
      .trim()
      .toLocaleUpperCase('tr-TR')
      .replace(/\s+/g, '_');
  };

  const getRoleLabel = (role?: string) => {
    const normalizedRole = normalizeRoleValue(role);
    const roleMap: { [key: string]: string } = {
      'ROLE_SECURITY': t('tasksScreen.security'),
      'ROLE_CLEANING': t('tasksScreen.cleaning'),
      'ROLE_MAINTENANCE': t('tasksScreen.maintenanceRole'),
      'SECURITY': t('tasksScreen.security'),
      'CLEANING': t('tasksScreen.cleaning'),
      'MAINTENANCE': t('tasksScreen.maintenanceRole'),
      'GUVENLIK': t('tasksScreen.security'),
      'GÜVENLIK': t('tasksScreen.security'),
      'GÜVENLİK': t('tasksScreen.security'),
      'TEMIZLIK': t('tasksScreen.cleaning'),
      'TEMİZLİK': t('tasksScreen.cleaning'),
      'BAKIM': t('tasksScreen.maintenanceRole'),
    };
    if (roleMap[normalizedRole]) return roleMap[normalizedRole];
    if (
      normalizedRole.includes('SECURITY') ||
      normalizedRole.includes('GUVEN') ||
      normalizedRole.includes('GÜVEN') ||
      normalizedRole.includes('GÃ¼VEN')
    ) {
      return t('tasksScreen.security');
    }
    if (
      normalizedRole.includes('CLEANING') ||
      normalizedRole.includes('TEMIZ') ||
      normalizedRole.includes('TEMİZ')
    ) {
      return t('tasksScreen.cleaning');
    }
    if (
      normalizedRole.includes('MAINTENANCE') ||
      normalizedRole.includes('BAKIM') ||
      normalizedRole.includes('BAKÄ')
    ) {
      return t('tasksScreen.maintenanceRole');
    }
  };

  const getAssignedRoleLabel = (task: Task) => {
    return getRoleLabel(task.assignedTo) ||
      getRoleLabel(task.assignedToName) ||
      getRoleLabel(task.taskType) ||
      getRoleLabel(task.title) ||
      getRoleLabel(task.description) ||
      t('tasksScreen.security');
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
        <View style={styles.siteSelector}>
          <View style={styles.siteSelectorLeft}>
            <View style={styles.siteIcon}>
              <Building size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.siteLabel}>{t('ui.siteName')}</Text>
              <Text style={styles.siteSubLabel}>{t('ui.admin')}</Text>
            </View>
          </View>
          <ChevronDown size={20} color="#64748b" />
        </View>
        <Pressable style={styles.settingsButton}>
          <Settings size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{t('tasksScreen.title')}</Text>
            <Text style={styles.subtitle}>{tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length} {t('tasksScreen.pendingTasks')}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['all', 'pending', 'completed'] as TabValue[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'all' ? t('tasksScreen.all') : tab === 'pending' ? t('tasksScreen.pending') : t('tasksScreen.completed')}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('tasksScreen.noTasks')}</Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const colors = getTaskTypeColors(task.title);
            const TaskIcon = colors.icon;
            const isPending = task.status === 'pending' || task.status === 'in_progress';
            const assignedRoleLabel = getAssignedRoleLabel(task);

            return (
              <View key={task.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
                      <TaskIcon size={20} color={colors.color} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{task.title}</Text>
                      <Text style={styles.cardDescription}>{task.description}</Text>
                      <Text style={styles.cardDescription}>
                        {t('tasksScreen.assignedTo')} {assignedRoleLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.color }]}>
                      {task.status === 'pending' ? t('tasksScreen.pendingStatus') : task.status === 'in_progress' ? t('tasksScreen.inProgressStatus') : t('tasksScreen.completedStatus')}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.cardMeta}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{formatDate(task.dueDate)}</Text>
                  </View>
                  {isPending && hasRole('ADMIN') && (
                    <Pressable style={styles.completeButton} onPress={() => handleCompleteTask(task.id)}>
                      <CheckCircle2 size={14} color="#ffffff" />
                      <Text style={styles.completeButtonText}>{t('tasksScreen.complete')}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer Button - Rol bazlı */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.footerButton,
            !hasRole('ADMIN') && styles.footerButtonDisabled
          ]}
          onPress={() => {
            if (!hasRole('ADMIN')) return;
            setShowAddModal(true);
          }}
          disabled={!hasRole('ADMIN')}
        >
          <Plus size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.footerButtonText}>{t('tasksScreen.addNewTask')}</Text>
        </Pressable>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('tasksScreen.createTaskTitle')}</Text>
              <Text style={styles.modalSubtitle}>{t('tasksScreen.createTaskSubtitle')}</Text>
              <Pressable style={styles.closeButton} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.title')}</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('tasksScreen.titlePlaceholder')}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('tasksScreen.descriptionPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.assignedRole')}</Text>
                <View style={styles.typeButtonsRow}>
                  {[
                    { value: 'ROLE_SECURITY', label: t('tasksScreen.security') },
                    { value: 'ROLE_CLEANING', label: t('tasksScreen.cleaning') },
                    { value: 'ROLE_MAINTENANCE', label: t('tasksScreen.maintenanceRole') }
                  ].map((role) => (
                    <Pressable
                      key={role.value}
                      style={[
                        styles.typeButton,
                        assignedRole === role.value && styles.typeButtonActive
                      ]}
                      onPress={() => setAssignedRole(role.value)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        assignedRole === role.value && styles.typeButtonTextActive
                      ]}>
                        {role.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.taskType')}</Text>
                <View style={styles.typeButtonsRow}>
                  {[
                    { value: 'Temizlik', label: t('tasksScreen.cleaningType') },
                    { value: 'Güvenlik', label: t('tasksScreen.securityType') },
                    { value: 'Bakım', label: t('tasksScreen.maintenanceType') },
                    { value: 'Diğer', label: t('tasksScreen.otherType') }
                  ].map((type) => (
                    <Pressable
                      key={type.value}
                      style={[
                        styles.typeButton,
                        taskType === type.value && styles.typeButtonActive
                      ]}
                      onPress={() => setTaskType(type.value)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        taskType === type.value && styles.typeButtonTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.location')}</Text>
                <TextInput
                  style={styles.input}
                  value={taskLocation}
                  onChangeText={setTaskLocation}
                  placeholder={t('tasksScreen.locationPlaceholder')}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tasksScreen.priority')}</Text>
                <View style={styles.typeButtonsRow}>
                  {[
                    { value: 'low', label: t('tasksScreen.lowPriority') },
                    { value: 'medium', label: t('tasksScreen.mediumPriority') },
                    { value: 'high', label: t('tasksScreen.highPriority') }
                  ].map((p) => (
                    <Pressable
                      key={p.value}
                      style={[
                        styles.typeButton,
                        priority === p.value && styles.typeButtonActive
                      ]}
                      onPress={() => setPriority(p.value as 'low' | 'medium' | 'high')}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        priority === p.value && styles.typeButtonTextActive
                      ]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bitiş Tarihi</Text>
                <Pressable style={styles.selectInput}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={[styles.selectText, { marginLeft: 8 }]}>13.02.2026</Text>
                  <ChevronDown size={16} color="#64748b" style={{ marginLeft: 'auto' }} />
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => { setShowAddModal(false); resetForm(); }}
              >
                <Text style={styles.buttonSecondaryText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAdd}
              >
                <Text style={styles.buttonPrimaryText}>{t('tasksScreen.createTask')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  siteSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  siteLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  siteSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.background,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.background,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.textTertiary,
    shadowColor: colors.textTertiary,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

export default TasksScreen;

