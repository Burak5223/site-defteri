import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { financeService } from '../../services/finance.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface ChartData {
  label: string;
  income: number;
  expense: number;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - spacing.screenPaddingHorizontal * 2 - spacing.lg * 2;
const chartHeight = 180;

const ResidentFinance = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadFinance();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Ekrana her gelindiğinde verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadFinance();
      }
    }, [user?.siteId])
  );

  const loadFinance = async () => {
    if (!user?.siteId) {
      setIsLoading(false);
      return;
    }

    try {
      // Backend'den gerçek verileri çek
      const [incomesResult, expensesResult] = await Promise.allSettled([
        financeService.getIncomes(user.siteId),
        financeService.getExpenses(user.siteId),
      ]);

      const incomes = incomesResult.status === 'fulfilled' ? incomesResult.value : [];
      const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value : [];

      // Combine and sort transactions
      const allTransactions: Transaction[] = [
        ...incomes.map(i => ({
          id: i.id,
          type: 'income' as const,
          title: i.description,
          amount: i.amount,
          category: i.category,
          date: i.incomeDate,
        })),
        ...expenses.map(e => ({
          id: e.id,
          type: 'expense' as const,
          title: e.description,
          amount: e.amount,
          category: e.category,
          date: e.expenseDate,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
      
      // Mock chart data (TODO: Get from backend)
      setChartData([
        { label: 'Oca', income: 15000, expense: 12000 },
        { label: 'Şub', income: 18000, expense: 14000 },
        { label: 'Mar', income: 16000, expense: 15000 },
        { label: 'Nis', income: 20000, expense: 13000 },
        { label: 'May', income: 19000, expense: 16000 },
        { label: 'Haz', income: 22000, expense: 14000 },
      ]);
    } catch (error) {
      console.error('Load finance error:', error);
      Alert.alert(t('common.error'), 'Finans verileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFinance();
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const maxValue = Math.max(
      ...chartData.map(d => Math.max(d.income, d.expense))
    );
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;
    const stepX = graphWidth / (chartData.length - 1);

    const getY = (value: number) => {
      return graphHeight - (value / maxValue) * graphHeight + padding;
    };

    const incomePoints = chartData
      .map((d, i) => `${padding + i * stepX},${getY(d.income)}`)
      .join(' ');
    const expensePoints = chartData
      .map((d, i) => `${padding + i * stepX},${getY(d.expense)}`)
      .join(' ');

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('finance.incomeExpenseTrend')}</Text>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1={padding}
              y1={padding + graphHeight * ratio}
              x2={chartWidth - padding}
              y2={padding + graphHeight * ratio}
              stroke={colors.borderLight}
              strokeWidth="1"
            />
          ))}

          {/* Income line */}
          <Polyline
            points={incomePoints}
            fill="none"
            stroke={colors.success}
            strokeWidth="3"
          />

          {/* Expense line */}
          <Polyline
            points={expensePoints}
            fill="none"
            stroke={colors.error}
            strokeWidth="3"
          />

          {/* Data points */}
          {chartData.map((d, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={padding + i * stepX}
                cy={getY(d.income)}
                r="4"
                fill={colors.success}
              />
              <Circle
                cx={padding + i * stepX}
                cy={getY(d.expense)}
                r="4"
                fill={colors.error}
              />
              <SvgText
                x={padding + i * stepX}
                y={chartHeight - 10}
                fontSize="11"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
        
        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>{t('finance.totalIncome')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>{t('finance.totalExpense')}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wallet size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('finance.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('finance.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Özet Kartlar */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.successLight }]}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={20} color={colors.success} />
            </View>
            <Text style={styles.summaryLabel}>{t('dashboard.income')}</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ₺{totalIncome.toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.errorLight }]}>
            <View style={styles.summaryIcon}>
              <TrendingDown size={20} color={colors.error} />
            </View>
            <Text style={styles.summaryLabel}>{t('dashboard.expense')}</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              ₺{totalExpense.toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight }]}>
            <View style={styles.summaryIcon}>
              <Wallet size={20} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>{t('dashboard.balance')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              ₺{balance.toLocaleString('tr-TR')}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('finance.recentTransactions')}</Text>
          <View style={styles.transactionsList}>
            {transactions.map(transaction => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        transaction.type === 'income' ? colors.successLight : colors.errorLight,
                    },
                  ]}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight size={20} color={colors.success} />
                  ) : (
                    <ArrowDownRight size={20} color={colors.error} />
                  )}
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? colors.success : colors.error,
                    },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}₺
                  {transaction.amount.toLocaleString('tr-TR')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  transactionsList: {
    gap: spacing.md,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: fontSize.cardMeta,
    color: colors.textTertiary,
  },
  transactionAmount: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
});

export default ResidentFinance;
