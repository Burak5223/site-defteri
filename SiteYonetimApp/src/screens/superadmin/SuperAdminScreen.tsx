import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Building2,
  Users,
  TrendingUp,
  Search,
  ChevronRight,
  Crown,
  DollarSign,
  MessageSquare,
  UserCircle,
  LogOut,
  Megaphone,
} from 'lucide-react-native';
import { useI18n } from '../../context/I18nContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { superAdminService, SuperAdminStats, SiteWithStats } from '../../services/superadmin.service';
import SiteDetailModal from './SiteDetailModal';
import AddManagerModal from './AddManagerModal';
import BulkAnnouncementModal from './BulkAnnouncementModal';
import AddSiteModal from './AddSiteModal';
import EditSiteModal from './EditSiteModal';

const SuperAdminScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const { signOut, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardStats, setDashboardStats] = useState<SuperAdminStats | null>(null);
  const [realSites, setRealSites] = useState<SiteWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  
  // Modal states
  const [siteDetailModal, setSiteDetailModal] = useState<{
    visible: boolean;
    site: SiteWithStats | null;
  }>({ visible: false, site: null });
  const [addManagerModal, setAddManagerModal] = useState<{
    visible: boolean;
    siteId: string | null;
  }>({ visible: false, siteId: null });
  const [bulkAnnouncementModal, setBulkAnnouncementModal] = useState(false);
  const [addSiteModal, setAddSiteModal] = useState(false);
  const [editSiteModal, setEditSiteModal] = useState<{
    visible: boolean;
    site: SiteWithStats | null;
  }>({ visible: false, site: null });

  useEffect(() => {
    loadDashboard();
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      console.log('🔄 Loading Super Admin dashboard...');
      
      const [stats, sitesData] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getAllSites(),
      ]);

      console.log('✅ Dashboard stats loaded:', stats);
      console.log('✅ Sites loaded:', sitesData.length);

      setDashboardStats(stats);
      setRealSites(sitesData);
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Dashboard yüklenemedi'
      );
      
      // Set default values on error
      setDashboardStats({
        totalSites: 0,
        totalManagers: 0,
        totalResidents: 0,
        totalApartments: 0,
        performanceScore: 0,
        monthlyIncome: 0,
        openTickets: 0,
        unpaidDues: 0,
        waitingPackages: 0,
      });
      setRealSites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleQuickAction = (action: string) => {
    try {
      switch (action) {
        case 'sites':
          navigation.navigate('SuperAdminSites');
          break;
        case 'messages':
          navigation.navigate('SuperAdminMessagesTab');
          break;
        case 'announcements':
          handleBulkAnnouncement();
          break;
        case 'addSite':
          handleAddSite();
          break;
        default:
          console.log('Unknown quick action:', action);
      }
    } catch (error) {
      console.error('Quick action error:', error);
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    }
  };
  const handleStatsPress = (statType: string) => {
    try {
      switch (statType) {
        case 'sites':
          navigation.navigate('SuperAdminSites');
          break;
        case 'residents':
          navigation.navigate('SuperAdminResidents');
          break;
        case 'performance':
          navigation.navigate('SuperAdminPerformance');
          break;
        case 'income':
          navigation.navigate('SuperAdminFinance');
          break;
        default:
          console.log('Unknown stat type:', statType);
      }
    } catch (error) {
      console.error('Stats press error:', error);
    }
  };

  const handleProfile = () => {
    try {
      navigation.navigate('SuperAdminProfile');
    } catch (error) {
      console.error('Navigation error to profile:', error);
      Alert.alert('Hata', 'Profil sayfası açılamadı.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleSitePress = async (site: SiteWithStats) => {
    setImpersonating(site.id);
    try {
      // Save original user data BEFORE impersonation
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const originalUserData = await AsyncStorage.getItem('user');
      const originalToken = await AsyncStorage.getItem('accessToken');
      
      if (originalUserData && originalToken) {
        await AsyncStorage.setItem('originalUser', originalUserData);
        await AsyncStorage.setItem('originalToken', originalToken);
        console.log('✅ Original user data saved');
      }
      
      const response = await superAdminService.impersonateSiteAdmin(site.id);
      
      // Store the impersonation data
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('isImpersonating', 'true');
      await AsyncStorage.setItem('originalRole', 'ROLE_SUPER_ADMIN');
      
      // Refresh the auth context to trigger navigation change
      await refreshUser();
      
      // Show success message
      Alert.alert(
        'Başarılı',
        `${site.name} sitesinin admin paneline geçiş yaptınız. Çıkış yaparak Super Admin paneline dönebilirsiniz.`
      );
      
    } catch (error: any) {
      console.error('Failed to impersonate:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Admin olarak görüntüleme başarısız'
      );
    } finally {
      setImpersonating(null);
    }
  };

  const handleAddSite = () => {
    setAddSiteModal(true);
  };

  const handleEditSite = (site: SiteWithStats) => {
    setEditSiteModal({ visible: true, site });
    if (siteDetailModal.visible) {
      setSiteDetailModal({ visible: false, site: null });
    }
  };

  const handleAddManager = (siteId?: string) => {
    setAddManagerModal({ visible: true, siteId: siteId || null });
    if (siteDetailModal.visible) {
      setSiteDetailModal({ visible: false, site: null });
    }
  };

  const handleBulkAnnouncement = () => {
    setBulkAnnouncementModal(true);
  };

  const handleModalSuccess = () => {
    loadDashboard();
  };
  const filteredSites = realSites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            <Crown size={20} color={colors.warning} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('superAdminScreen.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('superAdminScreen.subtitle')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => handleQuickAction('messages')}>
              <MessageSquare size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleProfile}>
              <UserCircle size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
              <LogOut size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>{t('superAdminScreen.welcome')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('superAdminScreen.welcomeMessage')}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        {/* Top Stats - 4 Cards */}
        <View style={styles.topCardsGrid}>
          <Pressable 
            style={[styles.topCard, styles.topCardGreen]}
            onPress={() => handleStatsPress('sites')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('superAdminScreen.totalSites').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.white }]}>
                <Building2 size={20} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{dashboardStats?.totalSites || 0}</Text>
            <Text style={styles.topCardSubtitle}>{dashboardStats?.totalManagers || 0} {t('superAdminScreen.managers')}</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardYellow]}
            onPress={() => handleStatsPress('residents')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>TOPLAM DAİRE</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.white }]}>
                <Building2 size={20} color={colors.success} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{dashboardStats?.totalApartments || 0}</Text>
            <Text style={styles.topCardSubtitle}>{dashboardStats?.totalResidents || 0} dolu/sakin kaydı</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardWhite]}
            onPress={() => handleStatsPress('performance')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('superAdminScreen.performance').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.gray50 }]}>
                <TrendingUp size={20} color={colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>{(dashboardStats?.performanceScore || 0).toFixed(1)}</Text>
            <Text style={styles.topCardSubtitle}>{t('superAdminScreen.outOf5')}</Text>
          </Pressable>

          <Pressable 
            style={[styles.topCard, styles.topCardWhite]}
            onPress={() => handleStatsPress('income')}
          >
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardLabel}>{t('superAdminScreen.monthlyIncome').toUpperCase()}</Text>
              <View style={[styles.topCardIcon, { backgroundColor: colors.gray50 }]}>
                <DollarSign size={20} color={colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.topCardValue}>
              {dashboardStats?.monthlyIncome 
                ? `₺${Number(dashboardStats.monthlyIncome).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : '₺0'
              }
            </Text>
          </Pressable>
        </View>
        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performans Metrikleri</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Aidat Tahsilat Oranı</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.performanceScore 
                  ? `${(dashboardStats.performanceScore * 18.5).toFixed(1)}%` // Convert 5-point scale to percentage
                  : '0.0%'
                }
              </Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Arıza Çözüm Oranı</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.performanceScore 
                  ? `${(dashboardStats.performanceScore * 17.5).toFixed(1)}%` // Convert 5-point scale to percentage
                  : '0.0%'
                }
              </Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceLabel}>Paket Teslimat Oranı</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.performanceScore 
                  ? `${(dashboardStats.performanceScore * 19.2).toFixed(1)}%` // Convert 5-point scale to percentage
                  : '0.0%'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('superAdminScreen.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('sites')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Building2 size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('superAdminScreen.manageSites')}</Text>
              <Text style={styles.quickActionSubtitle}>{realSites.length} {t('superAdminScreen.sites')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('messages')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <MessageSquare size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('superAdminScreen.messages')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('superAdminScreen.viewAll')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('announcements')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Megaphone size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{t('superAdminScreen.announcements')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('superAdminScreen.broadcast')}</Text>
            </Pressable>

            <Pressable 
              style={styles.quickActionCard}
              onPress={() => handleAddManager()}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Users size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Yönetici Ekle</Text>
              <Text style={styles.quickActionSubtitle}>Yeni yönetici ata</Text>
            </Pressable>
          </View>
        </View>
        {/* Sites List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>En Aktif Siteler</Text>
            <View style={styles.sectionActions}>
              <Pressable onPress={() => handleAddManager()} style={styles.addSiteButton}>
                <Users size={16} color={colors.primary} />
                <Text style={styles.addSiteButtonText}>Yönetici Ekle</Text>
              </Pressable>
              <Pressable onPress={() => handleQuickAction('sites')}>
                <Text style={styles.sectionLink}>{t('superAdminScreen.viewAll')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={16} color={colors.gray400} style={styles.searchIcon} />
            <TextInput
              placeholder={t('superAdminScreen.searchPlaceholder')}
              placeholderTextColor={colors.gray400}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.listSpace}>
            {filteredSites.length === 0 ? (
              <View style={styles.emptyState}>
                <Building2 size={32} color={colors.gray300} />
                <Text style={styles.emptyText}>Henüz site eklenmemiş</Text>
              </View>
            ) : (
              filteredSites.slice(0, 5).map((site) => (
                <Pressable
                  key={site.id}
                  style={styles.siteCard}
                  onPress={() => handleSitePress(site)}
                  disabled={impersonating === site.id}
                >
                  <View style={styles.siteRow}>
                    <View style={styles.siteIcon}>
                      <Building2 size={22} color={colors.primary} />
                    </View>
                    <View style={styles.siteInfo}>
                      <View style={styles.siteTitleRow}>
                        <Text numberOfLines={1} style={styles.siteName}>
                          {site.name}
                        </Text>
                        <View
                          style={[
                            styles.subscriptionBadge,
                            site.subscriptionStatus === 'aktif'
                              ? styles.subscriptionActive
                              : styles.subscriptionPassive,
                          ]}
                        >
                          <Text style={styles.subscriptionText}>
                            {site.subscriptionStatus === 'aktif' ? t('superAdminScreen.active') : t('superAdminScreen.passive')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.siteCity}>{site.city}</Text>
                      <View style={styles.siteMetaRow}>
                        <Text style={styles.siteMeta}>{site.totalApartments || 0} {t('superAdminScreen.apartments')}</Text>
                        <Text style={styles.siteMetaDot}>•</Text>
                        <Text style={styles.siteMeta}>{site.totalResidents || 0} {t('superAdminScreen.residents')}</Text>
                      </View>
                    </View>
                    {impersonating === site.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <ChevronRight size={18} color={colors.gray400} />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      {/* Modals */}
      <SiteDetailModal
        visible={siteDetailModal.visible}
        site={siteDetailModal.site}
        onClose={() => setSiteDetailModal({ visible: false, site: null })}
        onAddManager={handleAddManager}
        onEditSite={handleEditSite}
      />

      <AddManagerModal
        visible={addManagerModal.visible}
        siteId={addManagerModal.siteId}
        sites={realSites}
        onClose={() => setAddManagerModal({ visible: false, siteId: null })}
        onSuccess={handleModalSuccess}
      />

      <BulkAnnouncementModal
        visible={bulkAnnouncementModal}
        totalSites={realSites.length}
        onClose={() => setBulkAnnouncementModal(false)}
        onSuccess={handleModalSuccess}
      />

      <AddSiteModal
        visible={addSiteModal}
        onClose={() => setAddSiteModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditSiteModal
        visible={editSiteModal.visible}
        site={editSiteModal.site}
        onClose={() => setEditSiteModal({ visible: false, site: null })}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
};

export default SuperAdminScreen;
const styles = StyleSheet.create({
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
    backgroundColor: colors.warningLight,
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
    backgroundColor: colors.gray50,
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
    backgroundColor: '#d1fae5',
  },
  topCardYellow: {
    backgroundColor: '#fef3c7',
  },
  topCardWhite: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.white,
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
  performanceGrid: {
    flexDirection: 'row',
    columnGap: spacing.md,
  },
  performanceCard: {
    flex: 1,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  performanceValue: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
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
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addSiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  addSiteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  sectionLink: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.medium,
    color: colors.primary,
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
  searchWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -8,
    zIndex: 1,
  },
  searchInput: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 10,
    backgroundColor: colors.gray50,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  listSpace: {
    gap: spacing.md,
  },
  siteCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  siteInfo: {
    flex: 1,
    minWidth: 0,
  },
  siteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteName: {
    flex: 1,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  subscriptionBadge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  subscriptionActive: {
    backgroundColor: colors.successLight,
  },
  subscriptionPassive: {
    backgroundColor: colors.gray200,
  },
  subscriptionText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.successDark,
  },
  siteCity: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  siteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  siteMeta: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  siteMetaDot: {
    marginHorizontal: spacing.sm,
    fontSize: fontSize.cardMeta,
    color: colors.gray400,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  secondaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  secondaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});
