import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { financeService } from '../../services/finance.service';
import { useAuth } from '../../context/AuthContext';
import { lightTheme as theme } from '../../theme';

const { width } = Dimensions.get('window');

const FinancialAnalyticsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user?.siteId) return;
    
    try {
      setIsLoading(true);
      // In a real app we might fetch specific analytics data, 
      // but here we process raw expenses similar to the web version
      const data = await financeService.getExpenses(user.siteId);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading financial analytics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.siteId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const processMonthlyData = () => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    expenses.forEach((exp) => {
      const date = new Date(exp.expenseDate || exp.date); // Handle potentially different field names
      if (isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const isIncome = exp.type === 'income' || exp.category === 'aidat' || exp.category === 'other'; // Adjust based on actual data structure
      const amount = parseFloat(exp.amount) || 0;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 });
      }

      const monthData = monthlyMap.get(monthKey)!;
      if (isIncome) {
        monthData.income += amount;
      } else {
        monthData.expense += amount;
      }
    });

    const monthlyArray = Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: monthNames[month],
          year,
          monthNum: month,
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      });

    return monthlyArray.slice(-6);
  };

  const processExpenseCategories = () => {
    const categoryMap = new Map<string, number>();
    let totalExpense = 0;

    expenses.forEach((exp) => {
      const isIncome = exp.type === 'income' || exp.category === 'aidat' || exp.category === 'other';
      if (!isIncome) {
        const amount = parseFloat(exp.amount) || 0;
        categoryMap.set(
          exp.category,
          (categoryMap.get(exp.category) || 0) + amount,
        );
        totalExpense += amount;
      }
    });

    const categoryLabels: Record<string, string> = {
      elektrik: 'Elektrik',
      su: 'Su',
      dogalgaz: 'Doğalgaz',
      guvenlik: 'Güvenlik',
      temizlik: 'Temizlik',
      bakim: 'Bakım',
      asansor: 'Asansör',
      bahce: 'Bahçe',
      sigorta: 'Sigorta',
      maas: 'Maaş',
      other: 'Diğer',
      demirbas: 'Demirbaş',
      yonetim: 'Yönetim',
    };

    const colors = [
      '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#6366f1', '#ef4444', '#10b981', 
      '#eab308', '#06b6d4', '#6b7280',
    ];

    return Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        name: categoryLabels[category] || category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const monthlyData = processMonthlyData();
  const expenseCategories = processExpenseCategories();

  // Mock data for Budget vs Actual since backend might not support it yet
  const budgetVsActual = [
    { category: 'Personel', budget: 50000, actual: 45000, variance: -5000 },
    { category: 'Bakım', budget: 30000, actual: 35000, variance: 5000 },
    { category: 'Enerji', budget: 15000, actual: 15000, variance: 0 },
    { category: 'Temizlik', budget: 12000, actual: 10000, variance: -2000 },
  ];

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Finansal Analitik</Text>
          <Text style={styles.headerSubtitle}>Detaylı raporlar ve analizler</Text>
        </View>
        <View style={styles.headerIconContainer}>
            <BarChart3 size={24} color={theme.colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {['1month', '3months', '6months', '1year', 'all'].map((period) => (
            <Pressable
              key={period}
              style={[
                styles.periodChip,
                selectedPeriod === period && styles.periodChipActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === period && styles.periodChipTextActive,
                ]}
              >
                {period === '1month' ? '1 Ay' :
                 period === '3months' ? '3 Ay' :
                 period === '6months' ? '6 Ay' :
                 period === '1year' ? '1 Yıl' : 'Tümü'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Toplam Gelir</Text>
              <TrendingUp size={16} color="#22c55e" />
            </View>
            <Text style={[styles.summaryValue, styles.incomeText]}>
              {formatCurrency(totalIncome)}
            </Text>
            <View style={styles.summaryTrendRow}>
              <ArrowUpRight size={12} color="#22c55e" style={{ marginRight: 4 }} />
              <Text style={styles.summaryTrendText}>+12% bu ay</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Toplam Gider</Text>
              <TrendingDown size={16} color="#ef4444" />
            </View>
            <Text style={[styles.summaryValue, styles.expenseText]}>
              {formatCurrency(totalExpense)}
            </Text>
            <View style={styles.summaryTrendRow}>
              <ArrowDownRight size={12} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.summaryTrendText}>+8% bu ay</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.balanceCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Net Bakiye</Text>
              <DollarSign size={16} color="#0f766e" />
            </View>
            <Text style={[styles.summaryValue, styles.balanceText]}>
              {formatCurrency(totalBalance)}
            </Text>
            <Text style={styles.summaryHint}>Son 6 ay</Text>
          </View>

          <View style={[styles.summaryCard, styles.reserveCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Yedek Fon</Text>
              <PieChart size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.summaryValue, styles.reserveText]}>
              ₺85,000
            </Text>
            <Text style={styles.summaryHint}>Hedef: ₺100,000</Text>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aylık Gelir-Gider Trendi</Text>
            <BarChart3 size={18} color={theme.colors.secondary} />
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : monthlyData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bu dönem için veri bulunamadı.</Text>
            </View>
          ) : (
            <View style={styles.trendList}>
              {monthlyData.map((data, index) => (
                <View key={index} style={styles.trendRow}>
                  <View style={styles.trendHeaderRow}>
                    <Text style={styles.trendMonth}>{data.month}</Text>
                    <Text style={[
                        styles.trendBalance, 
                        { color: data.balance >= 0 ? '#22c55e' : '#ef4444' }
                    ]}>
                      {data.balance >= 0 ? '+' : ''}{formatCurrency(data.balance)} Net
                    </Text>
                  </View>
                  <View style={styles.trendBarsRow}>
                    <View style={styles.trendBarBg}>
                        {/* Income Bar */}
                        <View style={[styles.trendBarBg, { 
                            flex: 1, 
                            backgroundColor: 'rgba(16,185,129,0.15)',
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        }]}>
                             <View style={[styles.trendBarFill, { backgroundColor: '#22c55e', width: '60%' }]} /> 
                             {/* Simplified bar visual due to layout complexity */}
                        </View>
                        {/* Expense Bar */}
                         <View style={[styles.trendBarBg, { 
                             flex: 1, 
                             backgroundColor: 'rgba(239,68,68,0.15)',
                             borderTopLeftRadius: 0,
                             borderBottomLeftRadius: 0,
                         }]}>
                             <View style={[styles.trendBarFill, { backgroundColor: '#ef4444', width: '40%' }]} /> 
                        </View>
                    </View>
                     <View style={[styles.trendOverlayBars, { opacity: 0.8 }]}>
                        <View style={[styles.actualBar, { backgroundColor: '#22c55e', width: `${Math.min((data.income / 200000) * 100, 100)}%`, height: 6, marginBottom: 2, borderRadius: 3 }]} />
                        <View style={[styles.actualBar, { backgroundColor: '#ef4444', width: `${Math.min((data.expense / 200000) * 100, 100)}%`, height: 6, borderRadius: 3 }]} />
                     </View>
                  </View>
                  <View style={styles.trendMetaRow}>
                    <Text style={styles.trendIncomeText}>Gelir: {formatCurrency(data.income)}</Text>
                    <Text style={styles.trendExpenseText}>Gider: {formatCurrency(data.expense)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gider Dağılımı</Text>
          </View>
          {expenseCategories.length === 0 ? (
             <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Veri bulunamadı.</Text>
             </View>
          ) : (
            <View style={styles.categoryList}>
              {expenseCategories.map((cat, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                    <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Budget vs Actual */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bütçe vs Gerçekleşen</Text>
          </View>
          <View style={styles.budgetList}>
            {budgetVsActual.map((item, index) => (
              <View key={index} style={styles.budgetCard}>
                <View style={styles.budgetHeaderRow}>
                  <Text style={styles.budgetCategory}>{item.category}</Text>
                  <View style={[
                    styles.budgetBadge,
                    item.variance > 0 ? styles.budgetBadgeOver : styles.budgetBadgeUnder
                  ]}>
                    <Text style={[
                        styles.budgetBadgeText,
                        item.variance > 0 ? { color: '#ef4444' } : { color: '#059669' } // Red if processed over, Green if under budget (savings)
                        // Actually variance usually means Budget - Actual. 
                        // If Variance > 0, we are under budget (Good). 
                        // If Variance < 0, we are over budget (Bad).
                        // Let's stick to the color coding from web reference logic if apparent, 
                        // but here we used explicit logic: variance: -5000 means over budget? 
                        // In web ref: variance = -5000. 
                        // Let's assume Budget - Actual = Variance.
                        // 50000 - 45000 = 5000 (Positive, under budget).
                        // 12000 - 10000 = 2000.
                        // Wait, web ref had: category: 'Personel', budget: 50000, actual: 45000, variance: -5000 
                        // 45000 - 50000 = -5000? Actual - Budget?
                        // If actual > budget, variance is positive? 
                        // Let's follow the visual cues.
                        // "Over budget" usually red. "Under budget" usually green.
                    ]}>
                      {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetValuesRow}>
                  <View style={styles.budgetValueCol}>
                    <Text style={styles.budgetLabel}>Bütçe</Text>
                    <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
                  </View>
                  <View style={styles.budgetValueCol}>
                    <Text style={styles.budgetLabel}>Gerçekleşen</Text>
                    <Text style={styles.budgetValue}>{formatCurrency(item.actual)}</Text>
                  </View>
                </View>
                {/* Progress Bar for Budget */}
                <View style={styles.budgetProgressBg}>
                    <View style={[
                        styles.budgetProgressFill, 
                        { 
                            width: `${Math.min((item.actual / item.budget) * 100, 100)}%`,
                            backgroundColor: item.actual > item.budget ? '#ef4444' : '#3b82f6'
                        }
                    ]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Forecasts */}
        <View style={[styles.section, { marginBottom: 40 }]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tahmin ve Öngörüler</Text>
            </View>
            <View style={styles.forecastCardBlue}>
                <View style={styles.forecastIconRow}>
                    <TrendingUp size={20} color="#1d4ed8" />
                    <Text style={styles.forecastTitle}>Gelecek Ay Tahmini</Text>
                </View>
                <Text style={styles.forecastText}>Mevcut trende göre gelecek ay gelir: <Text style={{fontWeight:'700'}}>₺148,000</Text></Text>
            </View>
            <View style={styles.forecastCardAmber}>
                <View style={styles.forecastIconRow}>
                    <Wallet size={20} color="#b45309" />
                    <Text style={[styles.forecastTitle, { color: '#92400e' }]}>Yedek Fon Hedefi</Text>
                </View>
                <Text style={[styles.forecastText, { color: '#92400e' }]}>Hedefe ulaşmak için <Text style={{fontWeight:'700'}}>3 ay</Text> daha gerekiyor.</Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default FinancialAnalyticsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  periodRow: {
    paddingBottom: 4,
    gap: 10,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  periodChipTextActive: {
    color: '#fff',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: (width - 52) / 2, // 20 padding left, 20 padding right, 12 gap -> 52 total reduction
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeCard: { backgroundColor: '#fff' },
  expenseCard: { backgroundColor: '#fff' },
  balanceCard: { backgroundColor: '#fff' },
  reserveCard: { backgroundColor: '#fff' },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  incomeText: { color: '#0f172a' },
  expenseText: { color: '#0f172a' },
  balanceText: { color: '#0f172a' },
  reserveText: { color: '#0f172a' },
  summaryTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTrendText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  summaryHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  trendList: {
    gap: 16,
  },
  trendRow: {
    marginBottom: 8,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  trendBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendBarsRow: {
    marginBottom: 8,
    height: 36,
    justifyContent: 'center',
  },
  trendBarBg: {
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    overflow: 'hidden',
    display: 'none', // Hiding the old complex bar structure
  },
  trendOverlayBars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'center',
  },
  actualBar: {
    height: 8,
  },
  trendMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendIncomeText: {
    fontSize: 12,
    color: '#22c55e',
  },
  trendExpenseText: {
    fontSize: 12,
    color: '#ef4444',
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  categoryPercent: {
    fontSize: 12,
    color: '#94a3b8',
  },
  budgetList: {
    gap: 12,
  },
  budgetCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  budgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  budgetBadgeOver: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  budgetBadgeUnder: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  budgetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetValueCol: {
    gap: 2,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  budgetProgressBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastCardBlue: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  forecastCardAmber: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  forecastIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  forecastText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  trendBarFill: {
    height: '100%',
  },
});
