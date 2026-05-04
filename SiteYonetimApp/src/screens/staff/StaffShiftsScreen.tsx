import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Trash2,
  X,
  FileText,
  Users,
} from 'lucide-react-native';
import { staffShiftService } from '../../services';
import type { StaffShiftResponse, CreateStaffShiftRequest } from '../../services/staff-shift.service';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';

// ── Status Configuration ──────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  SCHEDULED: { label: 'Planlandı', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', icon: Calendar },
  IN_PROGRESS: { label: 'Devam Ediyor', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', icon: Clock },
  COMPLETED: { label: 'Tamamlandı', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', icon: CheckCircle2 },
  CANCELLED: { label: 'İptal', color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', icon: XCircle },
  NO_SHOW: { label: 'Gelmedi', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', icon: AlertCircle },
};

// ── Quick Date Filters ──────────────────────────────────────────
const dateFilters = [
  { key: 'today', label: 'Bugün' },
  { key: 'yesterday', label: 'Dün' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'all', label: 'Tümü' },
];

const getDateForFilter = (filterKey: string): string | undefined => {
  const now = new Date();
  switch (filterKey) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    default:
      return undefined;
  }
};

// ── Component ───────────────────────────────────────────────────
const StaffShiftsScreen = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<StaffShiftResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState('today');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    staffUserId: '',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    notes: '',
  });

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_MANAGER');

  // ── Data Loading ────────────────────────────────────────────
  const loadShifts = useCallback(async () => {
    if (!user?.siteId) return;
    try {
      const dateParam = getDateForFilter(activeDateFilter);
      const data = await staffShiftService.getShiftsBySite(user.siteId, dateParam);
      setShifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Vardiya yükleme hatası:', error);
      setShifts([]);
    }
  }, [user?.siteId, activeDateFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await loadShifts();
      setIsLoading(false);
    };
    fetchData();
  }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  // ── Actions ─────────────────────────────────────────────────
  const handleCheckIn = async (shiftId: string) => {
    if (!user?.siteId) return;
    try {
      await staffShiftService.checkIn(user.siteId, shiftId);
      Alert.alert('Başarılı', 'Giriş kaydedildi.');
      loadShifts();
    } catch (error) {
      Alert.alert('Hata', 'Giriş kaydedilemedi.');
    }
  };

  const handleCheckOut = async (shiftId: string) => {
    if (!user?.siteId) return;
    try {
      await staffShiftService.checkOut(user.siteId, shiftId);
      Alert.alert('Başarılı', 'Çıkış kaydedildi.');
      loadShifts();
    } catch (error) {
      Alert.alert('Hata', 'Çıkış kaydedilemedi.');
    }
  };

  const handleDelete = (shiftId: string) => {
    Alert.alert(
      'Vardiya Sil',
      'Bu vardiyayı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!user?.siteId) return;
            try {
              await staffShiftService.deleteShift(user.siteId, shiftId);
              Alert.alert('Başarılı', 'Vardiya silindi.');
              loadShifts();
            } catch (error) {
              Alert.alert('Hata', 'Vardiya silinemedi.');
            }
          },
        },
      ],
    );
  };

  const handleCreateShift = async () => {
    if (!user?.siteId) return;
    if (!form.staffUserId.trim()) {
      Alert.alert('Hata', 'Lütfen personel ID girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateStaffShiftRequest = {
        staffUserId: form.staffUserId,
        shiftDate: `${form.shiftDate}T00:00:00`,
        startTime: `${form.shiftDate}T${form.startTime}:00`,
        endTime: `${form.shiftDate}T${form.endTime}:00`,
        notes: form.notes || undefined,
      };
      await staffShiftService.createShift(user.siteId, request);
      Alert.alert('Başarılı', 'Vardiya oluşturuldu.');
      setShowCreateModal(false);
      resetForm();
      loadShifts();
    } catch (error) {
      Alert.alert('Hata', 'Vardiya oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      staffUserId: '',
      shiftDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '16:00',
      notes: '',
    });
  };

  // ── Helpers ─────────────────────────────────────────────────
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Stats ───────────────────────────────────────────────────
  const stats = {
    total: shifts.length,
    scheduled: shifts.filter(s => s.status === 'SCHEDULED').length,
    inProgress: shifts.filter(s => s.status === 'IN_PROGRESS').length,
    completed: shifts.filter(s => s.status === 'COMPLETED').length,
  };

  // ── Render: Shift Card ──────────────────────────────────────
  const renderShiftCard = ({ item }: { item: StaffShiftResponse }) => {
    const config = statusConfig[item.status] || statusConfig.SCHEDULED;
    const StatusIcon = config.icon;

    return (
      <View style={styles.shiftCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.personelIconContainer}>
              <Users size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.personelName}>
                {(item as any).staffName || `Personel #${item.staffUserId?.slice(-4) || '?'}`}
              </Text>
              <Text style={styles.shiftDateText}>{formatDate(item.shiftDate)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <StatusIcon size={12} color={config.color} />
            <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Başlangıç</Text>
            <View style={styles.timeValueRow}>
              <Clock size={13} color={colors.textSecondary} />
              <Text style={styles.timeValue}>{formatTime(item.startTime)}</Text>
            </View>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Bitiş</Text>
            <View style={styles.timeValueRow}>
              <Clock size={13} color={colors.textSecondary} />
              <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Check-in / Check-out Times */}
        {(item.checkInTime || item.checkOutTime) && (
          <View style={styles.checkTimeRow}>
            {item.checkInTime && (
              <View style={styles.checkTimeBlock}>
                <LogIn size={12} color="#22c55e" />
                <Text style={styles.checkTimeLabel}>Giriş: </Text>
                <Text style={[styles.checkTimeValue, { color: '#22c55e' }]}>
                  {formatTime(item.checkInTime)}
                </Text>
              </View>
            )}
            {item.checkOutTime && (
              <View style={styles.checkTimeBlock}>
                <LogOut size={12} color="#3b82f6" />
                <Text style={styles.checkTimeLabel}>Çıkış: </Text>
                <Text style={[styles.checkTimeValue, { color: '#3b82f6' }]}>
                  {formatTime(item.checkOutTime)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesRow}>
            <FileText size={12} color={colors.textSecondary} />
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {item.status === 'SCHEDULED' && (
            <Pressable
              style={[styles.actionBtn, styles.checkInBtn]}
              onPress={() => handleCheckIn(item.id)}
            >
              <LogIn size={14} color="#22c55e" />
              <Text style={[styles.actionBtnText, { color: '#22c55e' }]}>Giriş Yap</Text>
            </Pressable>
          )}
          {item.status === 'IN_PROGRESS' && (
            <Pressable
              style={[styles.actionBtn, styles.checkOutBtn]}
              onPress={() => handleCheckOut(item.id)}
            >
              <LogOut size={14} color="#3b82f6" />
              <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Çıkış Yap</Text>
            </Pressable>
          )}
          {isAdmin && item.status !== 'IN_PROGRESS' && (
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Sil</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ── Render: Header ──────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Planlanmış</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(34,197,94,0.08)' }]}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Biten</Text>
        </View>
      </View>

      {/* Date Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {dateFilters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              activeDateFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveDateFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeDateFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // ── Render: Empty State ─────────────────────────────────────
  const renderEmpty = () => (
    !isLoading ? (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Calendar size={40} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Vardiya Bulunamadı</Text>
        <Text style={styles.emptySubtitle}>
          Bu tarih için henüz vardiya kaydı yok.
        </Text>
        {isAdmin && (
          <Pressable
            style={styles.emptyCreateBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.emptyCreateBtnText}>Yeni Vardiya Oluştur</Text>
          </Pressable>
        )}
      </View>
    ) : null
  );

  // ── Render: Create Modal ────────────────────────────────────
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Vardiya Oluştur</Text>
            <Pressable onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtn}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Staff ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Personel ID</Text>
              <TextInput
                style={styles.formInput}
                value={form.staffUserId}
                onChangeText={(v) => setForm(prev => ({ ...prev, staffUserId: v }))}
                placeholder="Personel kullanıcı ID'si"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tarih</Text>
              <TextInput
                style={styles.formInput}
                value={form.shiftDate}
                onChangeText={(v) => setForm(prev => ({ ...prev, shiftDate: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={styles.formHint}>Örn: 2026-03-21</Text>
            </View>

            {/* Time Row */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Başlangıç Saati</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.startTime}
                  onChangeText={(v) => setForm(prev => ({ ...prev, startTime: v }))}
                  placeholder="08:00"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Bitiş Saati</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.endTime}
                  onChangeText={(v) => setForm(prev => ({ ...prev, endTime: v }))}
                  placeholder="16:00"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notlar (Opsiyonel)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={form.notes}
                onChangeText={(v) => setForm(prev => ({ ...prev, notes: v }))}
                placeholder="Vardiya notları..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalBtn, styles.modalCancelBtn]}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelBtnText}>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.modalCreateBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleCreateShift}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.modalCreateBtnText}>Oluştur</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Main Render ─────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vardiya Yönetimi</Text>
          <Text style={styles.headerSubtitle}>Personel vardiyalarını yönetin</Text>
        </View>
        {isAdmin && (
          <Pressable style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.createBtnText}>Yeni</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Vardiyalar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={renderShiftCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Create Modal */}
      {renderCreateModal()}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.button,
    gap: 6,
    ...shadows.sm,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
    gap: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Date Filters
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Shift Card
  shiftCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  personelIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personelName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shiftDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: 12,
    marginBottom: 10,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },

  // Check Times
  checkTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  checkTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkTimeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkTimeValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Notes
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.buttonSm,
    gap: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkInBtn: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  checkOutBtn: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderColor: 'rgba(239,68,68,0.15)',
    marginLeft: 'auto',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.button,
    gap: 8,
  },
  emptyCreateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
  },
  formTextarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  formHint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  formRow: {
    flexDirection: 'row',
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    gap: 6,
  },
  modalCancelBtn: {
    backgroundColor: colors.backgroundTertiary,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalCreateBtn: {
    backgroundColor: colors.primary,
  },
  modalCreateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StaffShiftsScreen;
