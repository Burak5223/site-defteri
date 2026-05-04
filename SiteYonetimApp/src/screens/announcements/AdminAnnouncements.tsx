import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  Text,
} from 'react-native';
import {
  Megaphone,
  Plus,
  X,
  AlertTriangle,
  Bell,
  Info,
  ChevronDown,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { announcementService, Announcement } from '../../services/announcement.service';
import { useI18n } from '../../context/I18nContext';

function AdminAnnouncements() {
  const { t } = useI18n();
  const { hasRole, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium' as 'low' | 'medium' | 'high');

  useEffect(() => {
    loadData();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Ekrana her gelindiğinde verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadData();
      }
    }, [user?.siteId])
  );

  const loadData = async () => {
    if (!user?.siteId) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await announcementService.getAnnouncements(user.siteId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Announcements data load error:', error);
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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('medium');
  };

  const handleAdd = async () => {
    if (!title || !content) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }

    if (!user?.siteId) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }

    try {
      await announcementService.createAnnouncement({
        title,
        content,
        priority,
      }, user.siteId);
      Alert.alert(t('common.success'), t('announcements.createAnnouncement'));
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const getPriorityColors = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'acil':
        return { bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', icon: AlertTriangle };
      case 'important':
      case 'önemli':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', icon: AlertTriangle };
      case 'normal':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', icon: Bell };
      case 'info':
      case 'bilgi':
        return { bg: 'rgba(148, 163, 184, 0.08)', color: '#94a3b8', icon: Info };
      default:
        return { bg: 'rgba(148, 163, 184, 0.08)', color: '#94a3b8', icon: Info };
    }
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
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('announcements.title')}</Text>
            <Text style={styles.subtitle}>{announcements.length} {t('announcements.count')}</Text>
          </View>
          {hasRole('ROLE_ADMIN') && (
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>{t('announcements.makeAnnouncement')}</Text>
            </Pressable>
          )}
        </View>

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
                    <Text style={[styles.priorityText, { color: priorityColors.color }]}>{announcement.priority}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('announcements.newAnnouncement')}</Text>
              <Text style={styles.modalSubtitle}>{t('announcements.sendToResidents')}</Text>
              <Pressable style={styles.closeButton} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('announcements.announcementTitle')}</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('announcements.titlePlaceholder')}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('announcements.content')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder={t('announcements.contentPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('tickets.priority')}</Text>
                <Pressable style={styles.selectInput}>
                  <Text style={styles.selectText}>{t('announcements.normal')}</Text>
                  <ChevronDown size={16} color="#64748b" />
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
                <Text style={styles.buttonPrimaryText}>{t('common.add')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.iconMargin,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.cardPadding,
    borderRadius: borderRadius.button,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.white,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
  },
  modalBody: {
    padding: spacing.xl,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.labelText,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.inputPaddingHorizontal,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.inputPaddingHorizontal,
    paddingVertical: spacing.inputPaddingHorizontal,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selectText: {
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.rowGap,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray700,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default AdminAnnouncements;
