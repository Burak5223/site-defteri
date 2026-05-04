import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Megaphone,
  Plus,
  X,
  AlertTriangle,
  Bell,
  Info,
  ChevronDown,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { announcementService, Announcement } from '../../services/announcement.service';

function AnnouncementsScreen() {
  const { hasRole, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Rol kontrolü - Admin veya Super Admin ise butonlar görünür
  const canManage = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.siteId) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Announcements data load error:', error);
      Alert.alert('Hata', 'Duyurular yüklenemedi');
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
    setSelectedAnnouncement(null);
  };

  const handleAdd = async () => {
    if (!title || !content) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    try {
      await announcementService.createAnnouncement({
        title,
        content,
        priority,
      });
      Alert.alert('Başarılı', 'Duyuru oluşturuldu');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!title || !content || !selectedAnnouncement) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    try {
      await announcementService.updateAnnouncement(selectedAnnouncement.id, {
        title,
        content,
        priority,
      });
      Alert.alert('Başarılı', 'Duyuru güncellendi');
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const handleDelete = (announcement: Announcement) => {
    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    Alert.alert(
      'Duyuru Sil',
      'Bu duyuruyu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!user?.siteId) return;
            try {
              await announcementService.deleteAnnouncement(announcement.id);
              Alert.alert('Başarılı', 'Duyuru silindi');
              loadData();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Hata', 'İşlem başarısız');
            }
          },
        },
      ]
    );
  };

  const getPriorityColors = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'acil':
        return { bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', icon: AlertTriangle, label: 'Acil' };
      case 'important':
      case 'önemli':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', icon: AlertTriangle, label: 'Önemli' };
      case 'normal':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', icon: Bell, label: 'Normal' };
      case 'info':
      case 'bilgi':
        return { bg: 'rgba(148, 163, 184, 0.08)', color: '#94a3b8', icon: Info, label: 'Bilgi' };
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

  const renderModal = (visible: boolean, onClose: () => void, onSave: () => void, isEdit: boolean) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Duyuru Düzenle' : 'Yeni Duyuru'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Duyuru başlığı"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>İçerik</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Duyuru içeriği"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Öncelik</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setShowPriorityPicker(!showPriorityPicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {getPriorityColors(priority).label}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </Pressable>

              {showPriorityPicker && (
                <View style={styles.pickerOptions}>
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <Pressable
                      key={p}
                      style={styles.pickerOption}
                      onPress={() => {
                        setPriority(p);
                        setShowPriorityPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>
                        {getPriorityColors(p).label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>İptal</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>{isEdit ? 'Güncelle' : 'Kaydet'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

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
            <Text style={styles.title}>Duyurular</Text>
            <Text style={styles.subtitle}>{announcements.length} duyuru</Text>
          </View>
          
          {/* Sadece Admin ve Super Admin için Ekle butonu */}
          {canManage && (
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Ekle</Text>
            </Pressable>
          )}
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Megaphone size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Henüz duyuru yok</Text>
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
                  
                  {/* Sadece Admin ve Super Admin için Düzenle/Sil butonları */}
                  {canManage && (
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => handleEdit(announcement)}
                      >
                        <Edit2 size={16} color={colors.primary} />
                        <Text style={styles.editButtonText}>Düzenle</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDelete(announcement)}
                      >
                        <Trash2 size={16} color={colors.error} />
                        <Text style={styles.deleteButtonText}>Sil</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {renderModal(showAddModal, () => { setShowAddModal(false); resetForm(); }, handleAdd, false)}
      {renderModal(showEditModal, () => { setShowEditModal(false); resetForm(); }, handleUpdate, true)}
    </View>
  );
}

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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.cardPadding,
    borderRadius: borderRadius.button,
    gap: spacing.iconMargin,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.rowGap,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textTertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.iconMargin,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: 4,
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  editButtonText: {
    fontSize: fontSize.cardMeta,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: 4,
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteButtonText: {
    fontSize: fontSize.cardMeta,
    color: colors.error,
    fontWeight: fontWeight.semibold,
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
    borderTopLeftRadius: borderRadius.modal,
    borderTopRightRadius: borderRadius.modal,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.iconMargin,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.iconMargin,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.input,
    padding: spacing.cardPadding,
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.input,
    padding: spacing.cardPadding,
  },
  pickerButtonText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
  pickerOptions: {
    marginTop: spacing.iconMargin,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.input,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: spacing.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerOptionText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.rowGap,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.cardPadding,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    padding: spacing.cardPadding,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default AnnouncementsScreen;
