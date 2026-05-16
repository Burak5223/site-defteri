import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Pressable,
  ActivityIndicator,
  Modal,
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
  Menu,
  Package,
  Building2,
  Check,
} from 'lucide-react-native';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { dueService } from '../../services/due.service';
import { ticketService } from '../../services/ticket.service';
import { announcementService } from '../../services/announcement.service';
import { financeService } from '../../services/finance.service';
import { packageService } from '../../services/package.service';
import { apiClient } from '../../api/apiClient';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

interface DashboardStatsResponse {
  unpaidDues?: number;
  unpaidAmount?: number;
  openTickets?: number;
  waitingPackages?: number;
  unreadMessages?: number;
}

function ResidentDashboard() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user, switchApartment } = useAuth();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [stats, setStats] = useState({
    pendingDues: 0,
    pendingDuesAmount: 0,
    openTickets: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalBalance: 0,
    waitingPackages: 0,
    pendingConfirmationPackages: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user?.siteId]);

  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadDashboard();
      }
    }, [user?.siteId])
  );

  const loadDashboard = async () => {
    if (!user?.siteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Use the new resident dashboard API
      const dashboardData = await apiClient.get<DashboardStatsResponse>(`/users/me/dashboard`);

      // Also get announcements and tickets for the detailed sections
      const [announcements, tickets] = await Promise.allSettled([
        announcementService.getAnnouncements(user.siteId),
        ticketService.getMyTickets(),
      ]);

      const announcementsData = announcements.status === 'fulfilled' ? announcements.value : [];
      const ticketsData = tickets.status === 'fulfilled' ? tickets.value : [];

      // Get financial data for the financial summary section
      const [incomes, expenses] = await Promise.allSettled([
        financeService.getIncomes(user.siteId),
        financeService.getExpenses(user.siteId),
      ]);

      const incomesData = incomes.status === 'fulfilled' ? incomes.value : [];
      const expensesData = expenses.status === 'fulfilled' ? expenses.value : [];

      // Get package data directly from package service (like packages screen does)
      let waitingPackages = 0;
      let pendingConfirmationPackages = 0;
      
      try {
        if (user.apartmentId) {
          // Get packages by apartment (same as ResidentPackages screen)
          const packagesData = await packageService.getPackagesByApartment(user.apartmentId);
          
          // Count waiting packages (same logic as ResidentPackages screen)
          waitingPackages = packagesData.filter(p => 
            p.status === 'beklemede' || 
            p.status === 'waiting' || 
            p.status === 'teslim_bekliyor' || 
            p.status === 'waiting_confirmation'
          ).length;
        }
        
        // Get pending confirmation packages separately
        const pendingPackagesData = await packageService.getPendingConfirmation();
        pendingConfirmationPackages = pendingPackagesData.length;
      } catch (error) {
        console.log('Could not fetch package data:', error);
        // Keep default values (0) if package fetch fails
      }

      // Calculate financial totals
      let totalIncome = 0;
      incomesData.forEach(i => totalIncome += (i.amount || 0));
      
      let totalExpense = 0;
      expensesData.forEach(e => totalExpense += (e.amount || 0));
      
      const totalBalance = totalIncome - totalExpense;

      // Use dashboard API data for main stats (dues and tickets)
      const pendingDues = dashboardData.unpaidDues || 0;
      const pendingDuesAmount = dashboardData.unpaidAmount || 0;
      const openTickets = dashboardData.openTickets || 0;

      // Son 2 duyuru
      const latestAnnouncements = announcementsData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setRecentAnnouncements(latestAnnouncements);

      // Aktif arızalar (son 2)
      const activeTicketsList = ticketsData
        .filter(t => {
          const status = t.status.toLowerCase();
          return status === 'open' || status === 'acik' || status === 'in_progress' || status === 'devam_ediyor';
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setActiveTickets(activeTicketsList);

      setStats({
        pendingDues,
        pendingDuesAmount,
        openTickets,
        totalIncome,
        totalExpense,
        totalBalance,
        waitingPackages,
        pendingConfirmationPackages,
      });
      
      console.log('✅ Resident Dashboard Stats Updated (using API):', {
        pendingDues,
        pendingDuesAmount,
        openTickets,
        waitingPackages,
        pendingConfirmationPackages,
      });
    } catch (error) {
      console.error('Load dashboard error:', error);
      // Fallback to old method if API fails
      await loadDashboardFallback();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDashboardFallback = async () => {
    try {
      const [dues, tickets, announcements, incomes, expenses, packages, pendingPackages] = await Promise.allSettled([
        dueService.getMyDues(), // Sakin için sadece kendi aidatları
        ticketService.getMyTickets(),
        announcementService.getAnnouncements(user.siteId),
        financeService.getIncomes(user.siteId),
        financeService.getExpenses(user.siteId),
        user.apartmentId ? packageService.getPackagesByApartment(user.apartmentId) : Promise.resolve([]),
        packageService.getPendingConfirmation(),
      ]);

      // Sonuçları güvenli şekilde al
      const duesData = dues.status === 'fulfilled' ? dues.value : [];
      const ticketsData = tickets.status === 'fulfilled' ? tickets.value : [];
      const announcementsData = announcements.status === 'fulfilled' ? announcements.value : [];
      const incomesData = incomes.status === 'fulfilled' ? incomes.value : [];
      const expensesData = expenses.status === 'fulfilled' ? expenses.value : [];
      const packagesData = packages.status === 'fulfilled' ? packages.value : [];
      const pendingPackagesData = pendingPackages.status === 'fulfilled' ? pendingPackages.value : [];

      // Sakin için bekleyen aidatlar - sadece kendisine atanan ve ödemediği
      const pendingDues = duesData.filter(d => 
        d.status === 'bekliyor' || 
        d.status === 'pending'
      );
      const pendingDuesAmount = pendingDues.reduce((sum, d) => sum + (d.amount || 0), 0);

      // Açık arızalar
      const openTickets = ticketsData.filter(t => {
        const status = t.status.toLowerCase();
        return status === 'open' || status === 'acik' || status === 'in_progress' || status === 'devam_ediyor';
      }).length;

      // Bekleyen paketler
      const waitingPackages = packagesData.filter(p => 
        p.status === 'beklemede' || 
        p.status === 'waiting' || 
        p.status === 'teslim_bekliyor' || 
        p.status === 'waiting_confirmation'
      ).length;

      // Onay bekleyen paketler
      const pendingConfirmationPackages = pendingPackagesData.length;

      // Finansal özet
      let totalIncome = 0;
      incomesData.forEach(i => totalIncome += (i.amount || 0));
      
      let totalExpense = 0;
      expensesData.forEach(e => totalExpense += (e.amount || 0));
      
      const totalBalance = totalIncome - totalExpense;

      // Son 2 duyuru
      const latestAnnouncements = announcementsData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setRecentAnnouncements(latestAnnouncements);

      // Aktif arızalar (son 2)
      const activeTicketsList = ticketsData
        .filter(t => {
          const status = t.status.toLowerCase();
          return status === 'open' || status === 'acik' || status === 'in_progress' || status === 'devam_ediyor';
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      setActiveTickets(activeTicketsList);

      setStats({
        pendingDues: pendingDues.length,
        pendingDuesAmount,
        openTickets,
        totalIncome,
        totalExpense,
        totalBalance,
        waitingPackages,
        pendingConfirmationPackages,
      });
      
      console.log('✅ Resident Dashboard Stats Updated (fallback):', {
        pendingDues: pendingDues.length,
        pendingDuesAmount,
        openTickets,
        waitingPackages,
        pendingConfirmationPackages,
      });
    } catch (error) {
      console.error('Fallback dashboard load error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const loadUserApartments = async () => {
    try {
      setLoadingApartments(true);
      
      // Şimdilik kullanıcının mevcut dairesini göster
      // Backend endpoint hazır olunca gerçek veriyi çekeriz
      if (user?.apartmentId && user?.blockName && user?.unitNumber) {
        const mockApartments = [
          {
            id: user.apartmentId,
            unitNumber: user.unitNumber,
            blockName: user.blockName,
            blockId: 'mock-block-id',
            floor: 1,
            isOwner: true,
            isCurrent: true,
          }
        ];
        setApartments(mockApartments);
      } else {
        setApartments([]);
      }
    } catch (error) {
      console.error('Load apartments error:', error);
    } finally {
      setLoadingApartments(false);
    }
  };

  const handleSwitchApartment = async (apartment: any) => {
    try {
      // Şimdilik sadece local state'i güncelle
      // Backend endpoint hazır olunca gerçek API çağrısı yapacağız
      await switchApartment(apartment.id, apartment.blockName, apartment.unitNumber);
      setShowApartmentModal(false);
      // Reload dashboard with new apartment data
      loadDashboard();
    } catch (error) {
      console.error('Switch apartment error:', error);
      alert('Daire değiştirilemedi');
    }
  };

  const handleApartmentPress = () => {
    loadUserApartments();
    setShowApartmentModal(true);
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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.siteIcon}>
              <Home size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.siteName}>{user?.siteName || 'Site'}</Text>
              <Text style={styles.siteRole}>{t('dashboard.resident')}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {user?.blockName && user?.unitNumber && (
              <Pressable style={styles.apartmentButton} onPress={handleApartmentPress}>
                <Building2 size={18} color={colors.primary} />
                <Text style={styles.apartmentButtonText}>
                  {user.blockName} - {user.unitNumber}
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.menuButton} onPress={() => navigation.navigate('Profile')}>
              <Menu size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Hoş Geldiniz Kartı */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t('dashboard.welcome')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('dashboard.todayAtSite')}</Text>
        </View>

        {/* Özet Kartlar */}
        <View style={styles.summaryRow}>
          <Pressable 
            style={[styles.summaryCard, { backgroundColor: colors.errorLight, borderColor: colors.error }]}
            onPress={() => navigation.navigate('DuesTab')}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryCardLabel}>{t('dashboard.pendingDues').toUpperCase()}</Text>
              <View style={[styles.summaryCardIcon, { backgroundColor: '#ec4899' }]}>
                <CreditCard size={18} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.summaryCardValue}>{stats.pendingDues}</Text>
            <Text style={styles.summaryCardAmount}>₺{stats.pendingDuesAmount.toLocaleString('tr-TR')}</Text>
          </Pressable>

          <Pressable 
            style={[styles.summaryCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
            onPress={() => navigation.navigate('TicketsTab')}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryCardLabel}>{t('dashboard.openTickets').toUpperCase()}</Text>
              <View style={[styles.summaryCardIcon, { backgroundColor: '#f59e0b' }]}>
                <AlertTriangle size={18} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.summaryCardValue}>{stats.openTickets}</Text>
            <Text style={styles.summaryCardAmount}>{t('dashboard.waitingForAction')}</Text>
          </Pressable>
        </View>

        {/* Paket Kartları */}
        <View style={styles.summaryRow}>
          <Pressable 
            style={[styles.summaryCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}
            onPress={() => navigation.navigate('ResidentPackages')}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryCardLabel}>{t('packages.waitingPackages').toUpperCase()}</Text>
              <View style={[styles.summaryCardIcon, { backgroundColor: '#3b82f6' }]}>
                <Package size={18} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.summaryCardValue}>{stats.waitingPackages}</Text>
            <Text style={styles.summaryCardAmount}>
              {stats.waitingPackages > 0 ? t('packages.waitingAtSecurity') : t('packages.noWaitingPackages')}
            </Text>
          </Pressable>

          {stats.pendingConfirmationPackages > 0 && (
            <Pressable 
              style={[styles.summaryCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
              onPress={() => navigation.navigate('ResidentPackages')}
            >
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardLabel}>{t('common.pending').toUpperCase()}</Text>
                <View style={[styles.summaryCardIcon, { backgroundColor: '#f59e0b' }]}>
                  <Package size={18} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.summaryCardValue}>{stats.pendingConfirmationPackages}</Text>
              <Text style={styles.summaryCardAmount}>{t('packages.confirmDelivery')}</Text>
            </Pressable>
          )}
        </View>

        {/* Finansal Özet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.financialSummaryTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('ResidentFinance')}>
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
                <Text style={[styles.financeValue, { color: colors.success }]}>
                  ₺{stats.totalIncome.toLocaleString('tr-TR')}
                </Text>
              </View>

              <View style={styles.financeCol}>
                <View style={styles.financeColHeader}>
                  <TrendingDown size={14} color={colors.error} />
                  <Text style={styles.financeLabel}>{t('dashboard.expense')}</Text>
                </View>
                <Text style={[styles.financeValue, { color: colors.error }]}>
                  ₺{stats.totalExpense.toLocaleString('tr-TR')}
                </Text>
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

        {/* Son Duyurular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentAnnouncementsTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('ResidentAnnouncements')}>
              <Text style={styles.sectionLink}>{t('dashboard.allItems')}</Text>
            </Pressable>
          </View>

          <View style={styles.announcementsList}>
            {recentAnnouncements.length > 0 ? (
              recentAnnouncements.map((announcement) => {
                const priorityColors = {
                  high: { bg: '#fee2e2', text: '#dc2626', label: t('dashboard.important') },
                  medium: { bg: '#fef3c7', text: '#f59e0b', label: t('dashboard.normal') },
                  low: { bg: '#dbeafe', text: '#2563eb', label: t('dashboard.info') },
                };
                const colorScheme = priorityColors[announcement.priority] || priorityColors.low;
                
                return (
                  <Pressable 
                    key={announcement.id} 
                    style={styles.announcementCard}
                    onPress={() => navigation.navigate('ResidentAnnouncements')}
                  >
                    <View style={styles.announcementIcon}>
                      <Megaphone size={18} color={colorScheme.text} />
                    </View>
                    <View style={styles.announcementContent}>
                      <View style={styles.announcementHeader}>
                        <Text style={styles.announcementTitle} numberOfLines={1}>{announcement.title}</Text>
                        <View style={[styles.announcementBadge, { backgroundColor: colorScheme.bg }]}>
                          <Text style={[styles.announcementBadgeText, { color: colorScheme.text }]}>
                            {colorScheme.label}
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

        {/* Aktif Arızalar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.activeTicketsTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('TicketsTab')}>
              <Text style={styles.sectionLink}>{t('dashboard.allItems')}</Text>
            </Pressable>
          </View>

          <View style={styles.ticketsList}>
            {activeTickets.length > 0 ? (
              activeTickets.map((ticket) => {
                const statusColors = {
                  open: { bg: '#fef3c7', text: '#f59e0b', label: t('dashboard.inProgress') },
                  acik: { bg: '#fef3c7', text: '#f59e0b', label: t('dashboard.inProgress') },
                  in_progress: { bg: '#dbeafe', text: '#2563eb', label: t('dashboard.inProgress') },
                  devam_ediyor: { bg: '#dbeafe', text: '#2563eb', label: t('dashboard.inProgress') },
                };
                const status = ticket.status.toLowerCase();
                const colorScheme = statusColors[status] || statusColors.open;
                
                return (
                  <Pressable 
                    key={ticket.id} 
                    style={styles.ticketCard}
                    onPress={() => navigation.navigate('TicketsTab')}
                  >
                    <View style={[styles.ticketIcon, { backgroundColor: colorScheme.bg }]}>
                      <AlertTriangle size={18} color={colorScheme.text} />
                    </View>
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                        <View style={[styles.ticketBadge, { backgroundColor: colorScheme.bg }]}>
                          <Text style={[styles.ticketBadgeText, { color: colorScheme.text }]}>
                            {colorScheme.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketBody} numberOfLines={1}>{ticket.description}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.textTertiary} />
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <AlertTriangle size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t('dashboard.noActiveTickets')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Apartment Switcher Modal */}
      <Modal
        visible={showApartmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApartmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dashboard.myApartments')}</Text>
              <Pressable onPress={() => setShowApartmentModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {loadingApartments ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : apartments.length > 0 ? (
              <ScrollView style={styles.apartmentList}>
                {apartments.map((apt) => (
                  <Pressable
                    key={apt.id}
                    style={[
                      styles.apartmentItem,
                      apt.isCurrent && styles.apartmentItemActive,
                    ]}
                    onPress={() => handleSwitchApartment(apt)}
                  >
                    <View style={styles.apartmentItemLeft}>
                      <Building2 size={20} color={apt.isCurrent ? colors.primary : colors.textSecondary} />
                      <View style={styles.apartmentItemInfo}>
                        <Text style={[
                          styles.apartmentItemTitle,
                          apt.isCurrent && styles.apartmentItemTitleActive,
                        ]}>
                          {apt.blockName} - Daire {apt.unitNumber}
                        </Text>
                        <Text style={styles.apartmentItemSubtitle}>
                          {apt.floor}. Kat • {apt.isOwner ? 'Mal Sahibi' : 'Kiracı'}
                        </Text>
                      </View>
                    </View>
                    {apt.isCurrent && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyApartments}>
                <Building2 size={32} color={colors.textTertiary} />
                <Text style={styles.emptyApartmentsText}>Kayıtlı daire bulunamadı</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apartmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  apartmentButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  siteName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  siteRole: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.screenPaddingHorizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.cardLg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  welcomeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  summaryCardFull: {
    flex: 1,
    width: '100%',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  summaryCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  summaryCardAmount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  financeCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.screenPaddingHorizontal,
    borderRadius: borderRadius.cardLg,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  financeValue: {
    fontSize: fontSize.base,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  financeFooterValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeFooterCollected: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  financeFooterSeparator: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginHorizontal: 4,
  },
  financeFooterTotal: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  announcementsList: {
    gap: spacing.md,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  announcementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  announcementBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  announcementBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ticketsList: {
    gap: spacing.md,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ticketContent: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  ticketBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  ticketBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  apartmentList: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  apartmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.cardLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  apartmentItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  apartmentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  apartmentItemInfo: {
    flex: 1,
  },
  apartmentItemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  apartmentItemTitleActive: {
    color: colors.primary,
  },
  apartmentItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyApartments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyApartmentsText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});

export default ResidentDashboard;


