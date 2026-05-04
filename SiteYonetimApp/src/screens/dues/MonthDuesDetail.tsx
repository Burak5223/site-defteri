import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { Due } from '../../services/due.service';

interface MonthGroup {
  month: string;
  year: number;
  displayName: string;
  dues: Due[];
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalAmount: number;
}

type RouteParams = {
  MonthDuesDetail: {
    monthGroup: MonthGroup;
  };
};

type FilterType = 'all' | 'paid' | 'pending' | 'overdue';

const MonthDuesDetail = () => {
  const route = useRoute<RouteProp<RouteParams, 'MonthDuesDetail'>>();
  const { monthGroup } = route.params;
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const getDueStatus = (due: Due): 'paid' | 'pending' | 'overdue' => {
    if (due.status === 'odendi' || due.status === 'paid') return 'paid';
    
    const today = new Date();
    const dueDate = new Date(due.dueDate);
    
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const getFilteredDues = () => {
    if (selectedFilter === 'all') return monthGroup.dues;
    return monthGroup.dues.filter(due => getDueStatus(due) === selectedFilter);
  };

  const filteredDues = getFilteredDues();

  const getStatusBadge = (status: 'paid' | 'pending' | 'overdue') => {
    const statusConfig = {
      paid: { label: 'Ödendi', color: colors.success, bgColor: colors.successLight },
      pending: { label: 'Bekliyor', color: colors.info, bgColor: colors.infoLight },
      overdue: { label: 'Gecikti', color: colors.error, bgColor: colors.errorLight },
    };

    const config = statusConfig[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{monthGroup.displayName}</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>₺{monthGroup.totalAmount.toLocaleString('tr-TR')}</Text>
            <Text style={styles.headerStatLabel}>Toplam Tutar</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{monthGroup.dues.length}</Text>
            <Text style={styles.headerStatLabel}>Toplam Aidat</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pressable
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Tümü ({monthGroup.dues.length})
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.filterButton, selectedFilter === 'paid' && styles.filterButtonActive, { borderColor: colors.success }]}
            onPress={() => setSelectedFilter('paid')}
          >
            <View style={[styles.filterDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.filterText, selectedFilter === 'paid' && { color: colors.success }]}>
              Ödendi ({monthGroup.paidCount})
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive, { borderColor: colors.info }]}
            onPress={() => setSelectedFilter('pending')}
          >
            <View style={[styles.filterDot, { backgroundColor: colors.info }]} />
            <Text style={[styles.filterText, selectedFilter === 'pending' && { color: colors.info }]}>
              Bekliyor ({monthGroup.pendingCount})
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.filterButton, selectedFilter === 'overdue' && styles.filterButtonActive, { borderColor: colors.error }]}
            onPress={() => setSelectedFilter('overdue')}
          >
            <View style={[styles.filterDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.filterText, selectedFilter === 'overdue' && { color: colors.error }]}>
              Gecikti ({monthGroup.overdueCount})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Dues List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {filteredDues.map(due => {
          const status = getDueStatus(due);
          const residentFullName = due.residentName || due.ownerName || null;
          
          return (
            <View key={due.id} style={styles.dueCard}>
              <View style={styles.dueHeader}>
                <View style={styles.dueApartment}>
                  <View style={styles.dueApartmentInfo}>
                    <Text style={styles.dueApartmentNumber}>Daire {due.apartmentNumber}</Text>
                    {residentFullName && (
                      <Text style={styles.dueResidentName}>{residentFullName}</Text>
                    )}
                  </View>
                  {getStatusBadge(status)}
                </View>
                <Text style={styles.dueAmount}>₺{due.amount.toLocaleString('tr-TR')}</Text>
              </View>
              
              <View style={styles.dueDates}>
                <View style={styles.dueDateItem}>
                  <Text style={styles.dueDateLabel}>Son Ödeme:</Text>
                  <Text style={styles.dueDateValue}>{formatDate(due.dueDate)}</Text>
                </View>
                {due.paymentDate && (
                  <View style={styles.dueDateItem}>
                    <Text style={styles.dueDateLabel}>Ödeme Tarihi:</Text>
                    <Text style={[styles.dueDateValue, { color: colors.success }]}>
                      {formatDate(due.paymentDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {filteredDues.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Bu filtre için aidat bulunamadı</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerStatItem: {
    flex: 1,
  },
  headerStatValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  headerStatLabel: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filters: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPaddingHorizontal,
    gap: spacing.md,
    paddingBottom: spacing.screenPaddingBottom,
  },
  dueCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dueApartment: {
    flex: 1,
    gap: spacing.xs,
  },
  dueApartmentInfo: {
    gap: 2,
  },
  dueApartmentNumber: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dueResidentName: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  dueAmount: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.badge,
  },
  statusText: {
    fontSize: fontSize.badgeText,
    fontWeight: fontWeight.semibold,
  },
  dueDates: {
    gap: spacing.xs,
  },
  dueDateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateLabel: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  dueDateValue: {
    fontSize: fontSize.cardMeta,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MonthDuesDetail;
