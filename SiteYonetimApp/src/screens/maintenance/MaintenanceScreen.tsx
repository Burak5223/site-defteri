import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Wrench,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { maintenanceService } from '../../services/maintenance.service';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../../theme';
import { useI18n } from '../../context/I18nContext';

interface MaintenanceItem {
  id: string;
  equipmentName: string;
  equipmentType: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceInterval: number;
  status: 'upcoming' | 'due' | 'overdue';
  notes?: string;
}

const MaintenanceScreen = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMaintenanceItems();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Ekrana her gelindiğinde verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadMaintenanceItems();
      }
    }, [user?.siteId])
  );

  useEffect(() => {
    loadMaintenanceItems();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadMaintenanceItems = async () => {
    if (!user?.siteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const siteId = user.siteId;
      const data = await maintenanceService.getAll(siteId);
      
      setItems(
        data.map((item: any) => ({
          id: item.id,
          equipmentName: item.equipmentName,
          equipmentType: item.equipmentType,
          lastMaintenanceDate: item.lastMaintenanceDate,
          nextMaintenanceDate: item.nextMaintenanceDate || calculateNextDate(item.lastMaintenanceDate, item.maintenanceIntervalDays),
          maintenanceInterval: item.maintenanceIntervalDays || 30,
          status: determineStatus(item.nextMaintenanceDate || calculateNextDate(item.lastMaintenanceDate, item.maintenanceIntervalDays)),
          notes: item.notes,
        }))
      );
    } catch (error) {
      console.error('Load maintenance error:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const calculateNextDate = (lastDate: string, intervalDays: number) => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + intervalDays);
    return date.toISOString().split('T')[0];
  };

  const determineStatus = (nextDate: string): 'upcoming' | 'due' | 'overdue' => {
    const days = calculateDaysUntil(nextDate);
    if (days < 0) return 'overdue';
    if (days <= 7) return 'due';
    return 'upcoming';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMaintenanceItems();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { bg: colors.infoLight, color: colors.infoDark };
      case 'due':
        return { bg: colors.warningLight, color: colors.warningDark };
      case 'overdue':
        return { bg: colors.errorLight, color: colors.errorDark };
      default:
        return { bg: colors.gray200, color: colors.gray600 };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return t('maintenance.upcoming');
      case 'due':
        return t('maintenance.due');
      case 'overdue':
        return t('maintenance.overdue');
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Clock;
      case 'due':
      case 'overdue':
        return AlertCircle;
      default:
        return CheckCircle2;
    }
  };

  const calculateDaysUntil = (date: string) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Wrench size={iconSize.cardIcon} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{t('maintenance.title')}</Text>
              <Text style={styles.headerSubtitle}>{items.length} {t('maintenance.equipment')}</Text>
            </View>
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Henüz bakım kaydı bulunmuyor</Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {items.map((item) => {
              const statusColors = getStatusColor(item.status);
              const StatusIcon = getStatusIcon(item.status);
              const days = calculateDaysUntil(item.nextMaintenanceDate);

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.itemName}>{item.equipmentName}</Text>
                      <Text style={styles.itemType}>{item.equipmentType}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                      <StatusIcon size={14} color={statusColors.color} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusPillText, { color: statusColors.color }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDatesRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Son Bakım</Text>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>{formatDate(item.lastMaintenanceDate)}</Text>
                      </View>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Sonraki Bakım</Text>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>{formatDate(item.nextMaintenanceDate)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <Text style={styles.intervalText}>{item.maintenanceInterval} {t('maintenance.maintenancePeriod')}</Text>
                    <Text style={styles.daysText}>
                      {days > 0 
                        ? `${days} ${t('maintenance.daysRemaining')}` 
                        : days === 0 
                        ? t('maintenance.today') 
                        : `${Math.abs(days)} ${t('maintenance.daysOverdue')}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.screenPaddingVertical,
    paddingBottom: spacing.screenPaddingBottom,
    rowGap: spacing.sectionGap,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardPadding,
  },
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.buttonPaddingHorizontal,
    paddingVertical: spacing.buttonPaddingVertical,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: fontSize.buttonText,
    color: colors.textSecondary,
  },
  listSpace: {
    rowGap: spacing.cardPadding,
  },
  card: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.cardPadding,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.iconMargin,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  itemType: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  statusPillText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.medium,
  },
  cardDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  intervalText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  daysText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
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
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
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
    backgroundColor: colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.gray100,
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
    color: colors.white,
  },
});
