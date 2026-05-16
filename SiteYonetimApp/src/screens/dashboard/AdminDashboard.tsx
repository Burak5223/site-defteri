import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Megaphone,
  ChevronRight,
  Home,
  Building,
  Users,
  ClipboardList,
  UserCircle,
  LogOut,
} from 'lucide-react-native';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { dueService } from '../../services/due.service';
import { ticketService } from '../../services/ticket.service';
import { packageService } from '../../services/package.service';
import { financeService } from '../../services/finance.service';
import { announcementService } from '../../services/announcement.service';
import { taskService } from '../../services/task.service';
import { residentService } from '../../services/resident.service';
import { siteService } from '../../services/site.service';
import { useI18n } from '../../context/I18nContext';
import { apiClient } from '../../api/apiClient';
import { useTheme } from '../../context/ThemeContext';

interface DashboardResponse {
  // Genel İstatistikler
  totalSites?: number;
  totalManagers?: number;
  totalResidents?: number;
  totalApartments?: number;
  averagePerformance?: number;
  
  // Finansal İstatistikler
  monthlyIncome?: number;
  monthlyExpense?: number;
  totalBalance?: number;
  incomeGrowth?: number;
  
  // Aidat İstatistikleri
  totalDues?: number;
  paidDues?: number;
  unpaidDues?: number;
  unpaidAmount?: number;
  collectionRate?: number;
  
  // Arıza/Ticket İstatistikleri
  totalTickets?: number;
  openTickets?: number;
  inProgressTickets?: number;
  resolvedTickets?: number;
  closedTickets?: number;
  resolutionRate?: number;
  
  // Paket İstatistikleri
  totalPackages?: number;
  waitingPackages?: number;
  deliveredPackages?: number;
  deliveryRate?: number;
  
  // Mesaj İstatistikleri
  totalMessages?: number;
  unreadMessages?: number;
  
  // Duyuru İstatistikleri
  totalAnnouncements?: number;
  activeAnnouncements?: number;
  
  // Görev İstatistikleri
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  
  // Bakım İstatistikleri
  totalMaintenanceEquipment?: number;
  upcomingMaintenance?: number;
  overdueMaintenance?: number;
}

function AdminDashboard() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { signOut, user } = useAuth();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingDues: 0,
    pendingDuesAmount: 0,
    openTickets: 0,
    totalApartments: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalBalance: 0,
    recentAnnouncements: 0,
    waitingPackages: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Dashboard'a her gelindiğinde verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadDashboard();
      }
    }, [user?.siteId])
  );

  const loadDashboard = async () => {
    if (!user?.siteId) {
      console.log('⚠️ Dashboard: No siteId found');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log('🔄 Dashboard: Loading data for siteId:', user.siteId);

    try {
      // Use dashboard API endpoint for consistent data
      const dashboardResponse: DashboardResponse = await apiClient.get(`/sites/${user.siteId}/dashboard`);

      console.log('✅ Dashboard API Response:', dashboardResponse);

      // Load financial data from finance service (same as AdminFinance page)
      const [incomes, expenses, announcements, tasks] = await Promise.all([
        financeService.getIncomes(user.siteId).catch(() => []),
        financeService.getExpenses(user.siteId).catch(() => []),
        announcementService.getAnnouncements(user.siteId).catch(() => []),
        taskService.getTasks(user.siteId).catch(() => []),
      ]);

      // Calculate financial stats exactly like AdminFinance page
      let totalIncome = 0;
      incomes.forEach((income: any) => totalIncome += (income.amount || 0));
      
      let totalExpense = 0;
      expenses.forEach((expense: any) => totalExpense += (expense.amount || 0));
      
      const totalBalance = totalIncome - totalExpense;

      // Update stats - use dashboard API for other data, finance service for financial data
      setStats({
        pendingDues: dashboardResponse.unpaidDues || 0,
        pendingDuesAmount: dashboardResponse.unpaidAmount || 0,
        openTickets: dashboardResponse.openTickets || 0,
        totalApartments: dashboardResponse.totalApartments || 0,
        totalIncome: totalIncome, // From finance service (same as AdminFinance)
        totalExpense: totalExpense, // From finance service (same as AdminFinance)
        totalBalance: totalBalance, // From finance service (same as AdminFinance)
        recentAnnouncements: dashboardResponse.activeAnnouncements || 0,
        waitingPackages: dashboardResponse.waitingPackages || 0,
      });

      // Recent announcements for display
      const latestAnnouncements = announcements
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setRecentAnnouncements(latestAnnouncements);

      // Today's tasks for display
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayTasksList = tasks
        .filter(t => {
          const taskDate = new Date(t.createdAt);
          return taskDate >= todayStart && taskDate < todayEnd;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setTodayTasks(todayTasksList);

      console.log('✅ Admin Dashboard Updated - Financial data from finance service:', {
        totalIncome,
        totalExpense,
        totalBalance,
        incomeCount: incomes.length,
        expenseCount: expenses.length
      });
    } catch (error) {
      console.error('❌ Dashboard API error:', error);
      // Fallback to individual service calls if dashboard API fails
      await loadDashboardFallback();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDashboardFallback = async () => {
    // Fallback method using individual service calls (original implementation)
    try {
      const [dues, tickets, packages, incomes, expenses, residents, blocks] = await Promise.all([
        dueService.getDues(user.siteId).catch(err => {
          console.error('Dues API error:', err);
          return [];
        }),
        ticketService.getTickets(user.siteId).catch(() => []),
        packageService.getPackages(user.siteId).catch(() => []),
        financeService.getIncomes(user.siteId).catch(() => []), // Use finance service
        financeService.getExpenses(user.siteId).catch(() => []), // Use finance service
        residentService.getResidents().catch(() => []),
        siteService.getSiteBlocks(user.siteId).catch(() => []),
      ]);

      // Calculate stats manually (original logic)
      const allApartmentsPromises = blocks.map((block: any) => 
        residentService.getApartmentsByBlock(block.id).catch(() => [])
      );
      const allApartmentsArrays = await Promise.all(allApartmentsPromises);
      const allApartments = allApartmentsArrays.flat();
      
      const uniqueApartments = allApartments.filter((apt: any, index: number, self: any[]) => 
        index === self.findIndex((a: any) => a.id === apt.id)
      );
      const totalApartments = uniqueApartments.length;

      const pendingDues = dues.filter((d: any) => 
        d.status === 'bekliyor' || 
        d.status === 'pending'
      );
      const pendingDuesAmount = pendingDues.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      const openTickets = tickets.filter((t: any) => {
        const status = t.status.toLowerCase();
        return status === 'open' || 
               status === 'in_progress' || 
               status === 'acik' || 
               status === 'devam_ediyor';
      }).length;

      const waitingPackages = packages.filter((p: any) => p.status === 'beklemede' || p.status === 'waiting').length;

      // Calculate financial stats exactly like AdminFinance page
      let totalIncome = 0;
      incomes.forEach((income: any) => totalIncome += (income.amount || 0));
      
      let totalExpense = 0;
      expenses.forEach((expense: any) => totalExpense += (expense.amount || 0));
      
      const totalBalance = totalIncome - totalExpense;

      setStats({
        pendingDues: pendingDues.length,
        pendingDuesAmount,
        openTickets,
        totalApartments,
        totalIncome, // From finance service (same as AdminFinance)
        totalExpense, // From finance service (same as AdminFinance)
        totalBalance, // From finance service (same as AdminFinance)
        recentAnnouncements: 0,
        waitingPackages,
      });

      console.log('✅ Fallback Dashboard Stats Updated - Financial data from finance service:', {
        pendingDues: pendingDues.length,
        pendingDuesAmount,
        openTickets,
        waitingPackages,
        totalIncome,
        totalExpense,
        totalBalance,
        incomeCount: incomes.length,
        expenseCount: expenses.length
      });
    } catch (error) {
      console.error('❌ Fallback dashboard error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Home size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{user?.siteName || t('dashboard.siteName')}</Text>
            <Text style={styles.headerSubtitle}>{t('dashboard.admin')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
              <UserCircle size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <LogOut size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hoş Geldiniz Kartı */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>{t('dashboard.welcome')}</Text>
            <Text style={styles.welcomeSubtitle}>{user?.siteName || t('dashboard.siteName')} {t('dashboard.welcomeMessage')}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Top Cards - 4 Kart */}
        <View style={styles.topCardsGrid}>
          <Pressable 
            style={[styles.topCard, styles.topCardGreen]}
            onPress={() => navigation.navigate('AdminDues')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('dashboard.pendingDues').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.background }]}>
                <CreditCard size={20} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{stats.pendingDues}</Text>
            <Text style={styles.topCardSubtitle}>₺{stats.pendingDuesAmount.toLocaleString('tr-TR')}</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardYellow]}
            onPress={() => navigation.navigate('Tickets')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('dashboard.openTickets').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.background }]}>
                <AlertTriangle size={20} color={colors.warning} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{stats.openTickets}</Text>
            <Text style={styles.topCardSubtitle}>{stats.openTickets === 0 ? t('dashboard.noIssue') : t('dashboard.waiting')}</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardWhite]}
            onPress={() => navigation.navigate('Apartments')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('dashboard.totalApartments').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.gray50 }]}>
                <Building size={20} color={colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{stats.totalApartments}</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardWhite]}
            onPress={() => navigation.navigate('Residents')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('dashboard.totalResidents').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.gray50 }]}>
                <Users size={20} color={colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{stats.totalApartments}</Text>
          </Pressable>
        </View>

        {/* Finansal Özet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.financialSummary')}</Text>
            <Pressable onPress={() => navigation.navigate('AdminFinance')}>
              <Text style={styles.sectionLink}>{t('dashboard.detail')}</Text>
            </Pressable>
          </View>

          <View style={styles.financeCard}>
            <View style={styles.financeRow}>
              <View style={styles.financeCol}>
                <View style={styles.financeColHeader}>
                  <TrendingUp size={14} color={colors.success} />
                  <Text style={styles.financeLabel}>{t('dashboard.income')}</Text>
                </View>
                <Text style={[styles.financeValue, { color: colors.success }]}>₺{stats.totalIncome.toLocaleString('tr-TR')}</Text>
              </View>

              <View style={styles.financeCol}>
                <View style={styles.financeColHeader}>
                  <TrendingDown size={14} color={colors.error} />
                  <Text style={styles.financeLabel}>{t('dashboard.expense')}</Text>
                </View>
                <Text style={[styles.financeValue, { color: colors.error }]}>₺{stats.totalExpense.toLocaleString('tr-TR')}</Text>
              </View>

              <View style={styles.financeCol}>
                <View style={styles.financeColHeader}>
                  <Wallet size={14} color={colors.warning} />
                  <Text style={styles.financeLabel}>{t('dashboard.balance')}</Text>
                </View>
                <Text style={[styles.financeValue, { color: stats.totalBalance >= 0 ? colors.success : colors.error }]}>
                  {stats.totalBalance >= 0 ? '₺' : '-₺'}
                  {Math.abs(stats.totalBalance).toLocaleString('tr-TR')}
                </Text>
              </View>
            </View>

            <View style={styles.financeFooter}>
              <Text style={styles.financeFooterLabel}>{t('dashboard.dueCollection')}</Text>
              <View style={styles.financeFooterValues}>
                <Text style={styles.financeFooterCollected}>₺{stats.totalIncome.toLocaleString('tr-TR')}</Text>
                <Text style={styles.financeFooterSeparator}>/</Text>
                <Text style={styles.financeFooterTotal}>₺{(stats.totalIncome + stats.pendingDuesAmount).toLocaleString('tr-TR')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hızlı İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AdminResidents')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Users size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.residents')}</Text>
              <Text style={styles.quickActionSubtitle}>{stats.totalApartments} {t('dashboard.people')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AdminSites')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Building size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.sites')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('dashboard.manage')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AdminFinance')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Wallet size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.finance')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('dashboard.income')}/{t('dashboard.expense')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AdminDues')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <CreditCard size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.dues')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('dashboard.track')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Announcements')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Megaphone size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.announcements')}</Text>
              <Text style={styles.quickActionSubtitle}>{stats.recentAnnouncements} {t('dashboard.new')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Tickets')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <AlertTriangle size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('dashboard.tickets')}</Text>
              <Text style={styles.quickActionSubtitle}>{stats.openTickets} {t('dashboard.open')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Son Duyurular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentAnnouncements')}</Text>
            <Pressable onPress={() => navigation.navigate('Announcements')}>
              <Text style={styles.sectionLink}>{t('dashboard.all')}</Text>
            </Pressable>
          </View>

          <View style={styles.announcementsList}>
            {recentAnnouncements.length > 0 ? (
              recentAnnouncements.map((announcement) => {
                const priorityColors = {
                  high: { bg: colors.errorLight, text: colors.errorDark, icon: colors.error },
                  medium: { bg: colors.warningLight, text: colors.warningDark, icon: colors.warning },
                  low: { bg: colors.successLight, text: colors.successDark, icon: colors.success },
                };
                const priorityLabels = {
                  high: t('dashboard.important'),
                  medium: t('dashboard.normal'),
                  low: t('dashboard.info'),
                };
                const colorScheme = priorityColors[announcement.priority] || priorityColors.low;
                
                return (
                  <Pressable 
                    key={announcement.id} 
                    style={styles.announcementCard}
                    onPress={() => navigation.navigate('Announcements')}
                  >
                    <View style={[styles.announcementIcon, { backgroundColor: colorScheme.bg }]}>
                      <Megaphone size={20} color={colorScheme.icon} />
                    </View>
                    <View style={styles.announcementContent}>
                      <View style={styles.announcementHeader}>
                        <Text style={styles.announcementTitle}>{announcement.title}</Text>
                        <View style={[styles.announcementBadge, { backgroundColor: colorScheme.bg }]}>
                          <Text style={[styles.announcementBadgeText, { color: colorScheme.text }]}>
                            {priorityLabels[announcement.priority]}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.announcementBody} numberOfLines={2}>
                        {announcement.content}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Megaphone size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t('dashboard.noAnnouncements')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bugünkü Görevler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.todayTasks')}</Text>
            <Pressable onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.sectionLink}>{t('dashboard.all')}</Text>
            </Pressable>
          </View>

          <View style={styles.tasksList}>
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => {
                const statusColors = {
                  pending: { bg: colors.warningLight, text: colors.warningDark, icon: colors.warning },
                  in_progress: { bg: colors.successLight, text: colors.successDark, icon: colors.success },
                  completed: { bg: colors.gray50, text: colors.textSecondary, icon: colors.textSecondary },
                  bekliyor: { bg: colors.warningLight, text: colors.warningDark, icon: colors.warning },
                  devam_ediyor: { bg: colors.successLight, text: colors.successDark, icon: colors.success },
                  tamamlandi: { bg: colors.gray50, text: colors.textSecondary, icon: colors.textSecondary },
                };
                const statusLabels = {
                  pending: t('dashboard.waiting'),
                  in_progress: t('dashboard.inProgress'),
                  completed: t('dashboard.completed'),
                  bekliyor: t('dashboard.waiting'),
                  devam_ediyor: t('dashboard.inProgress'),
                  tamamlandi: t('dashboard.completed'),
                };
                const colorScheme = statusColors[task.status] || statusColors.pending;
                
                return (
                  <Pressable 
                    key={task.id} 
                    style={styles.taskCard}
                    onPress={() => navigation.navigate('Tasks')}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: colorScheme.bg }]}>
                      <ClipboardList size={20} color={colorScheme.icon} />
                    </View>
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[styles.taskBadge, { backgroundColor: colorScheme.bg }]}>
                          <Text style={[styles.taskBadgeText, { color: colorScheme.text }]}>
                            {statusLabels[task.status] || task.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.taskBody} numberOfLines={1}>{task.description}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.textTertiary} />
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <ClipboardList size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t('dashboard.noTasks')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
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
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
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
  topCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  topCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  topCardGreen: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  topCardYellow: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  topCardWhite: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.liveBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.liveDot,
    marginRight: spacing.sm,
  },
  liveText: {
    fontSize: fontSize.cardSubtitle,
    fontWeight: fontWeight.semibold,
    color: colors.liveText,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  tasksList: {
    gap: spacing.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  taskBadgeText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
  },
  taskBody: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  topCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  topCardLabel: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    flex: 1,
  },
  topCardIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  topCardSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  financeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  financeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  financeCol: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  financeColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  financeLabel: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  financeValue: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
  },
  financeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
  },
  financeFooterLabel: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  financeFooterValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeFooterCollected: {
    fontSize: fontSize.cardSubtitle,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  financeFooterSeparator: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textTertiary,
    marginHorizontal: 4,
  },
  financeFooterTotal: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  announcementsList: {
    gap: spacing.md,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  announcementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.errorLight,
  },
  announcementBadgeText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.errorDark,
  },
  announcementBody: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});

export default AdminDashboard;


