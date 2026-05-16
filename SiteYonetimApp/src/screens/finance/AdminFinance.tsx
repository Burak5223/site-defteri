import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { financeService, Income, Expense } from '../../services/finance.service';
import { paymentService, Payment } from '../../services/payment.service';
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

const AdminFinance = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

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
      const [incomesResult, expensesResult, pendingResult] = await Promise.allSettled([
        financeService.getIncomes(user.siteId),
        financeService.getExpenses(user.siteId),
        paymentService.getPendingPayments(user.siteId),
      ]);

      const incomes = incomesResult.status === 'fulfilled' ? incomesResult.value : [];
      const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value : [];
      const pending = pendingResult.status === 'fulfilled' ? pendingResult.value : [];

      setPendingPayments(pending);

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
      Alert.alert(t('common.error'), t('finance.loadError'));
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

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setAmount('');
    setCategory('');
  };

  const handleSubmit = async () => {
    if (!title || !amount || !category) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }

    if (!user?.siteId) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }

    try {
      if (modalType === 'income') {
        const incomeData = {
          description: title,
          category,
          amount: parseFloat(amount),
          incomeDate: new Date().toISOString().split('T')[0],
        };
        await financeService.createIncome(user.siteId, incomeData);
      } else {
        const expenseData = {
          description: title,
          category,
          amount: parseFloat(amount),
          expenseDate: new Date().toISOString().split('T')[0],
        };
        await financeService.createExpense(user.siteId, expenseData);
      }

      Alert.alert(t('common.success'), `${modalType === 'income' ? t('finance.income') : t('finance.expense')} ${t('finance.addSuccess')}`);
      closeModal();
      loadFinance();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedPayment) return;

    try {
      await paymentService.approvePayment(selectedPayment.id);
      Alert.alert(t('common.success'), t('finance.paymentApproved'));
      setShowApprovalModal(false);
      setSelectedPayment(null);
      loadFinance();
    } catch (error) {
      console.error('Approve payment error:', error);
      Alert.alert(t('common.error'), t('finance.paymentApproveError'));
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;

    Alert.prompt(
      t('finance.paymentRejection'),
      t('finance.enterRejectionReason'),
      async (reason) => {
        if (!reason) return;
        try {
          await paymentService.rejectPayment(selectedPayment.id, reason);
          Alert.alert(t('common.success'), t('finance.paymentRejected'));
          setShowApprovalModal(false);
          setSelectedPayment(null);
          loadFinance();
        } catch (error) {
          console.error('Reject payment error:', error);
          Alert.alert(t('common.error'), t('finance.paymentRejectError'));
        }
      }
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card': return t('finance.creditCard');
      case 'transfer': return t('finance.transfer');
      case 'cash': return t('finance.cash');
      default: return method;
    }
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
            <Text style={styles.legendText}>{t('finance.income')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>{t('finance.expense')}</Text>
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
            <Text style={styles.summaryLabel}>{t('finance.income')}</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ₺{totalIncome.toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.errorLight }]}>
            <View style={styles.summaryIcon}>
              <TrendingDown size={20} color={colors.error} />
            </View>
            <Text style={styles.summaryLabel}>{t('finance.expense')}</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              ₺{totalExpense.toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight }]}>
            <View style={styles.summaryIcon}>
              <Wallet size={20} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>{t('finance.balance')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              ₺{balance.toLocaleString('tr-TR')}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Bekleyen Ödemeler */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common.pending')} {t('finance.payments')} ({pendingPayments.length})</Text>
            <View style={styles.pendingPaymentsList}>
              {pendingPayments.map(payment => (
                <Pressable
                  key={payment.id}
                  style={styles.pendingPaymentCard}
                  onPress={() => {
                    setSelectedPayment(payment);
                    setShowApprovalModal(true);
                  }}
                >
                  <View style={styles.pendingPaymentHeader}>
                    <View style={[styles.pendingPaymentIcon, { backgroundColor: colors.warningLight }]}>
                      <Wallet size={20} color={colors.warning} />
                    </View>
                    <View style={styles.pendingPaymentInfo}>
                      <Text style={styles.pendingPaymentMethod}>
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </Text>
                      {payment.userName && (
                        <Text style={styles.pendingPaymentUser}>
                          {payment.userName}
                        </Text>
                      )}
                      {payment.apartmentNumber && (
                        <Text style={styles.pendingPaymentApartment}>
                          {t('packages.apartment')}: {payment.apartmentNumber}
                        </Text>
                      )}
                      <Text style={styles.pendingPaymentDate}>
                        {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.pendingPaymentAmount}>
                      ₺{payment.amount.toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.pendingPaymentBadge}>
                    <Text style={styles.pendingPaymentBadgeText}>{t('common.pending')}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Pressable 
          style={[styles.footerButton, { backgroundColor: colors.success }]}
          onPress={() => openModal('income')}
        >
          <TrendingUp size={20} color={colors.white} />
          <Text style={styles.footerButtonText}>{t('finance.addIncome')}</Text>
        </Pressable>
        <Pressable 
          style={[styles.footerButton, { backgroundColor: colors.error }]}
          onPress={() => openModal('expense')}
        >
          <TrendingDown size={20} color={colors.white} />
          <Text style={styles.footerButtonText}>{t('finance.addExpense')}</Text>
        </Pressable>
      </View>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'income' ? t('finance.addIncome') : t('finance.addExpense')}
              </Text>
              <Pressable style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finance.titleLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('finance.titlePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finance.amountLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={t('finance.amountPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finance.category')}</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder={t('finance.categoryPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={closeModal}
              >
                <Text style={styles.buttonSecondaryText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary, { 
                  backgroundColor: modalType === 'income' ? colors.success : colors.error 
                }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonPrimaryText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approval Modal */}
      <Modal visible={showApprovalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('finance.paymentApproval')}</Text>
              <Pressable style={styles.closeButton} onPress={() => {
                setShowApprovalModal(false);
                setSelectedPayment(null);
              }}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedPayment && (
              <View style={styles.modalBody}>
                {selectedPayment.userName && (
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalLabel}>{t('dashboard.resident')}</Text>
                    <Text style={styles.approvalValue}>{selectedPayment.userName}</Text>
                  </View>
                )}
                {selectedPayment.apartmentNumber && (
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalLabel}>{t('packages.apartment')}</Text>
                    <Text style={styles.approvalValue}>{selectedPayment.apartmentNumber}</Text>
                  </View>
                )}
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalLabel}>{t('finance.paymentMethod')}</Text>
                  <Text style={styles.approvalValue}>
                    {getPaymentMethodLabel(selectedPayment.paymentMethod)}
                  </Text>
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalLabel}>{t('finance.amount')}</Text>
                  <Text style={[styles.approvalValue, { fontSize: 24, fontWeight: '700', color: colors.primary }]}>
                    ₺{selectedPayment.amount.toLocaleString('tr-TR')}
                  </Text>
                </View>
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalLabel}>{t('finance.date')}</Text>
                  <Text style={styles.approvalValue}>
                    {formatDate(selectedPayment.createdAt)}
                  </Text>
                </View>
                {selectedPayment.notes && (
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalLabel}>{t('finance.notes')}</Text>
                    <Text style={styles.approvalValue}>{selectedPayment.notes}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.errorLight, borderColor: colors.error }]}
                onPress={handleRejectPayment}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.error }]}>{t('finance.reject')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.success }]}
                onPress={handleApprovePayment}
              >
                <Text style={styles.buttonPrimaryText}>{t('finance.approve')}</Text>
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
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
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
    minWidth: '47%',
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.screenPaddingHorizontal,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.button,
  },
  footerButtonText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.white,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
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
    backgroundColor: colors.background,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  pendingPaymentsList: {
    gap: spacing.md,
  },
  pendingPaymentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderLeftWidth: 4,
  },
  pendingPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pendingPaymentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pendingPaymentInfo: {
    flex: 1,
  },
  pendingPaymentMethod: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  pendingPaymentUser: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textPrimary,
    marginTop: 2,
  },
  pendingPaymentApartment: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pendingPaymentDate: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pendingPaymentAmount: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  pendingPaymentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.badge,
  },
  pendingPaymentBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  approvalInfo: {
    marginBottom: spacing.xl,
  },
  approvalLabel: {
    fontSize: fontSize.labelText,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  approvalValue: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
});

export default AdminFinance;



