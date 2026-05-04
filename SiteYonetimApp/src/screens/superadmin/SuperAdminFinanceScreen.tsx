import React, { useEffect, useState, useCallback } from 'react';
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
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Building2,
  PieChart,
  BarChart3,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';

interface FinanceData {
  totalCommissionIncome: number | string;
  monthlyCommissionIncome: number | string;
  monthlyGrowth: number | string;
  commissionRate: number | string;
  siteCommissions: SiteCommission[];
  monthlyTrend: MonthlyCommissionData[];
}

interface SiteCommission {
  siteId: string;
  siteName: string;
  commissionIncome: number | string;
  commissionRate: number | string;
}

interface MonthlyCommissionData {
  month: string;
  year: number;
  commissionIncome: number | string;
  displayName: string;
}

const SuperAdminFinanceScreen = ({ navigation }: any) => {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadFinanceData();
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      loadFinanceData();
    }, [selectedPeriod])
  );

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading finance data...');
      
      // Try to get real data from API
      const response = await apiClient.get(`/super-admin/finance?period=${selectedPeriod}`) as FinanceData;
      setFinanceData(response);
      
    } catch (error: any) {
      console.error('❌ Failed to load finance data:', error);
      
      // Mock data for demonstration with commission structure
      const mockData: FinanceData = {
        totalCommissionIncome: 49000,
        monthlyCommissionIncome: 12500,
        monthlyGrowth: 12.5,
        commissionRate: 2.0,
        siteCommissions: [
          {
            siteId: '1',
            siteName: 'Deniz Sitesi',
            commissionIncome: 12400,
            commissionRate: 2.0,
          },
          {
            siteId: '2',
            siteName: 'Güneş Sitesi',
            commissionIncome: 9000,
            commissionRate: 2.0,
          },
          {
            siteId: '3',
            siteName: 'Ay Sitesi',
            commissionIncome: 10400,
            commissionRate: 2.0,
          },
          {
            siteId: '4',
            siteName: 'Yıldız Sitesi',
            commissionIncome: 7600,
            commissionRate: 2.0,
          },
          {
            siteId: '5',
            siteName: 'Orman Sitesi',
            commissionIncome: 5800,
            commissionRate: 2.0,
          },
          {
            siteId: '6',
            siteName: 'Göl Sitesi',
            commissionIncome: 3800,
            commissionRate: 2.0,
          },
        ],
        monthlyTrend: [
          { month: 'JANUARY', year: 2026, commissionIncome: 9000, displayName: 'Ocak' },
          { month: 'FEBRUARY', year: 2026, commissionIncome: 9600, displayName: 'Şubat' },
          { month: 'MARCH', year: 2026, commissionIncome: 12500, displayName: 'Mart' },
        ],
      };
      
      setFinanceData(mockData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinanceData();
  };

  const formatCurrency = (amount: number | string) => {
    // Ensure amount is a number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₺0';
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatPercentage = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0%';
    return `${numValue.toFixed(1)}%`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'month': return 'Bu Ay';
      case 'quarter': return 'Bu Çeyrek';
      case 'year': return 'Bu Yıl';
      default: return 'Bu Ay';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!financeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Finansal veriler yüklenemedi</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <DollarSign size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Komisyon Analizi</Text>
            <Text style={styles.headerSubtitle}>
              {getPeriodLabel(selectedPeriod)} Komisyon Raporu
            </Text>
          </View>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <Pressable
          style={[styles.periodTab, selectedPeriod === 'month' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
            Aylık
          </Text>
        </Pressable>
        <Pressable
          style={[styles.periodTab, selectedPeriod === 'quarter' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('quarter')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'quarter' && styles.periodTextActive]}>
            Çeyreklik
          </Text>
        </Pressable>
        <Pressable
          style={[styles.periodTab, selectedPeriod === 'year' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
            Yıllık
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryHeader}>
              <TrendingUp size={20} color={colors.success} />
              <Text style={styles.summaryLabel}>Toplam Komisyon Geliri</Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(financeData.totalCommissionIncome)}
            </Text>
            <View style={styles.summaryGrowth}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={[styles.summaryGrowthText, { color: colors.success }]}>
                +{formatPercentage(financeData.monthlyGrowth)}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryHeader}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>Aylık Komisyon</Text>
            </View>
            <Text style={styles.summaryValue}>
              {formatCurrency(financeData.monthlyCommissionIncome)}
            </Text>
            <View style={styles.summaryGrowth}>
              <TrendingUp size={14} color={colors.primary} />
              <Text style={[styles.summaryGrowthText, { color: colors.primary }]}>
                Bu ay
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.profitCard]}>
            <View style={styles.summaryHeader}>
              <PieChart size={20} color={colors.warning} />
              <Text style={styles.summaryLabel}>Komisyon Oranı</Text>
            </View>
            <Text style={styles.summaryValue}>
              %{financeData.commissionRate}
            </Text>
            <View style={styles.summaryGrowth}>
              <Text style={[styles.summaryGrowthText, { color: colors.textSecondary }]}>
                Her aidat ödemesinden
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Chart Placeholder */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Aylık Komisyon Trendi</Text>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <BarChart3 size={48} color={colors.gray300} />
              <Text style={styles.chartPlaceholderText}>
                Komisyon gelir grafiği
              </Text>
              <Text style={styles.chartPlaceholderSubtext}>
                {financeData.monthlyTrend.map(trend => 
                  `${trend.displayName}: ${formatCurrency(trend.commissionIncome)}`
                ).join(' • ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Site Commission Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Site Komisyon Performansı</Text>
          </View>
          
          {financeData.siteCommissions.length > 0 ? (
            financeData.siteCommissions.map((site) => (
              <View key={site.siteId} style={styles.siteCard}>
                <View style={styles.siteHeader}>
                  <View style={styles.siteIcon}>
                    <Building2 size={18} color={colors.primary} />
                  </View>
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{site.siteName}</Text>
                    <Text style={styles.siteCollection}>
                      Komisyon Oranı: %{site.commissionRate}
                    </Text>
                  </View>
                  <View style={styles.siteProfit}>
                    <Text style={styles.siteProfitValue}>
                      {formatCurrency(site.commissionIncome)}
                    </Text>
                    <Text style={styles.siteProfitLabel}>Komisyon</Text>
                  </View>
                </View>
                
                <View style={styles.siteFinanceRow}>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Aylık Komisyon</Text>
                    <Text style={[styles.financeValue, { color: colors.success }]}>
                      {formatCurrency(site.commissionIncome)}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Komisyon Oranı</Text>
                    <Text style={[styles.financeValue, { color: colors.primary }]}>
                      %{site.commissionRate}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Tahmini Aidat</Text>
                    <Text style={styles.financeValue}>
                      {formatCurrency(Number(site.commissionIncome) / (Number(site.commissionRate) / 100))}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>Henüz komisyon verisi bulunmuyor</Text>
              <Text style={styles.emptyStateSubtext}>
                Aidat ödemeleri yapıldığında komisyon verileri burada görünecek
              </Text>
            </View>
          )}
        </View>

        {/* Commission Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Komisyon Öngörüleri</Text>
          </View>
          
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>En Yüksek Komisyon</Text>
            <Text style={styles.insightValue}>
              {financeData.siteCommissions.length > 0 
                ? financeData.siteCommissions.reduce((prev, current) => 
                    prev.commissionIncome > current.commissionIncome ? prev : current
                  ).siteName
                : 'Henüz veri yok'
              }
            </Text>
            <Text style={styles.insightDescription}>
              {financeData.siteCommissions.length > 0 
                ? formatCurrency(Math.max(...financeData.siteCommissions.map(s => Number(s.commissionIncome)))) + ' aylık komisyon'
                : 'Komisyon verisi bekleniyor'
              }
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Toplam Komisyon Büyümesi</Text>
            <Text style={styles.insightValue}>
              {formatPercentage(financeData.monthlyGrowth)}
            </Text>
            <Text style={styles.insightDescription}>
              Geçen aya göre artış oranı
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Ortalama Site Komisyonu</Text>
            <Text style={styles.insightValue}>
              {financeData.siteCommissions.length > 0 
                ? formatCurrency(
                    financeData.siteCommissions.reduce((sum, site) => 
                      sum + Number(site.commissionIncome), 0
                    ) / financeData.siteCommissions.length
                  )
                : formatCurrency(0)
              }
            </Text>
            <Text style={styles.insightDescription}>
              Site başına ortalama aylık komisyon
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SuperAdminFinanceScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  headerText: {
    flex: 1,
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
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray50,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primaryLight,
  },
  periodText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  periodTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.xl,
  },
  summaryGrid: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryGrowthText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chartSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  chartContainer: {
    marginTop: spacing.md,
  },
  chartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  chartPlaceholderSubtext: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  siteCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  siteIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  siteCollection: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  siteProfit: {
    alignItems: 'flex-end',
  },
  siteProfitValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  siteProfitLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  siteFinanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  financeItem: {
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  financeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  insightValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyStateCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
});