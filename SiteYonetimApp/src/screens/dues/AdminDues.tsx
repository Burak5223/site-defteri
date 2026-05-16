import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Users,
  CreditCard,
  ChevronRight,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { dueService, Due } from '../../services/due.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

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

const AdminDues = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);

  useEffect(() => {
    loadDues();
  }, [user?.siteId]);

  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadDues();
      }
    }, [user?.siteId])
  );

  const loadDues = async () => {
    if (!user?.siteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await dueService.getDues(user.siteId);
      groupDuesByMonth(data);
    } catch (error) {
      console.error('Load dues error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupDuesByMonth = (duesData: Due[]) => {
    const groups: { [key: string]: MonthGroup } = {};

    duesData.forEach(due => {
      const dueDate = new Date(due.dueDate);
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
        const monthName = t(`months.${monthKeys[dueDate.getMonth()]}`);
        groups[monthKey] = {
          month: monthKey,
          year: dueDate.getFullYear(),
          displayName: `${monthName} ${dueDate.getFullYear()}`,
          dues: [],
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
          totalAmount: 0,
        };
      }

      groups[monthKey].dues.push(due);
      groups[monthKey].totalAmount += due.amount;

      const status = getDueStatus(due);
      if (status === 'paid') groups[monthKey].paidCount++;
      else if (status === 'overdue') groups[monthKey].overdueCount++;
      else groups[monthKey].pendingCount++;
    });

    const sortedGroups = Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
    setMonthGroups(sortedGroups);
  };

  const getDueStatus = (due: Due): 'paid' | 'pending' | 'overdue' => {
    if (due.status === 'odendi' || due.status === 'paid') return 'paid';
    
    const today = new Date();
    const dueDate = new Date(due.dueDate);
    
    if (dueDate < today) return 'overdue';
    return 'pending';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDues();
  };

  const handleMonthPress = (group: MonthGroup) => {
    navigation.navigate('MonthDuesDetail', { monthGroup: group });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('dues.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('dues.monthlyTracking')}</Text>
        </View>

        {/* Month List */}
        <View style={styles.monthsList}>
          {monthGroups.map(group => (
            <Pressable
              key={group.month}
              style={styles.monthCard}
              onPress={() => handleMonthPress(group)}
            >
              <View style={styles.monthIcon}>
                <CreditCard size={20} color={colors.primary} />
              </View>
              <View style={styles.monthInfo}>
                <Text style={styles.monthName}>{group.displayName}</Text>
                <Text style={styles.monthSubtitle}>
                  {group.dues.length} aidat • ₺{group.totalAmount.toLocaleString('tr-TR')}
                </Text>
                <View style={styles.monthStats}>
                  <View style={styles.monthStatItem}>
                    <View style={[styles.monthStatDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.monthStatText}>{group.paidCount} Ödendi</Text>
                  </View>
                  <View style={styles.monthStatItem}>
                    <View style={[styles.monthStatDot, { backgroundColor: colors.info }]} />
                    <Text style={styles.monthStatText}>{group.pendingCount} Bekliyor</Text>
                  </View>
                  <View style={styles.monthStatItem}>
                    <View style={[styles.monthStatDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.monthStatText}>{group.overdueCount} Gecikti</Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {monthGroups.length === 0 && (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>Henüz aidat atanmamış</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('DueAssignment')}
        >
          <Users size={20} color={colors.white} />
          <Text style={styles.fabText}>Toplu Aidat Ata</Text>
        </Pressable>
      </View>
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
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 4,
  },
  monthsList: {
    padding: spacing.screenPaddingHorizontal,
    gap: spacing.md,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  monthSubtitle: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  monthStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  monthStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthStatText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  emptyText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.screenPaddingHorizontal,
    right: spacing.screenPaddingHorizontal,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.button,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default AdminDues;

