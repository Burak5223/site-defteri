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
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Building2,
  Users,
  Home,
  Search,
  Plus,
  Eye,
  Edit,
  MapPin,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { superAdminService, SiteWithStats } from '../../services/superadmin.service';
import SiteDetailModal from './SiteDetailModal';
import AddSiteModal from './AddSiteModal';
import EditSiteModal from './EditSiteModal';
import AddManagerModal from './AddManagerModal';

const SuperAdminSitesScreen = ({ navigation, route }: any) => {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [filteredSites, setFilteredSites] = useState<SiteWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Modal states
  const [siteDetailModal, setSiteDetailModal] = useState<{
    visible: boolean;
    site: SiteWithStats | null;
  }>({ visible: false, site: null });
  const [addSiteModal, setAddSiteModal] = useState(false);
  const [editSiteModal, setEditSiteModal] = useState<{
    visible: boolean;
    site: SiteWithStats | null;
  }>({ visible: false, site: null });
  const [addManagerModal, setAddManagerModal] = useState<{
    visible: boolean;
    siteId: string | null;
  }>({ visible: false, siteId: null });

  const handleAddSite = useCallback(() => {
    setSiteDetailModal({ visible: false, site: null });
    setEditSiteModal({ visible: false, site: null });
    setAddManagerModal({ visible: false, siteId: null });
    setAddSiteModal(true);
  }, []);

  useEffect(() => {
    loadSites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSites();
    }, [])
  );

  useEffect(() => {
    filterSites();
  }, [searchQuery, sites, selectedFilter]);

  const loadSites = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading sites...');
      const sitesData = await superAdminService.getAllSites();
      console.log('✅ Sites loaded:', sitesData.length);
      setSites(sitesData);
    } catch (error: any) {
      console.error('❌ Failed to load sites:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Siteler yüklenemedi'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSites();
  };

  const filterSites = () => {
    let filtered = sites;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(site => {
        if (selectedFilter === 'active') {
          return site.subscriptionStatus === 'aktif';
        } else {
          return site.subscriptionStatus !== 'aktif';
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(query) ||
          site.city?.toLowerCase().includes(query) ||
          site.address?.toLowerCase().includes(query)
      );
    }

    setFilteredSites(filtered);
  };

  const handleSitePress = (site: SiteWithStats) => {
    setSiteDetailModal({ visible: true, site });
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

  const handleModalSuccess = () => {
    loadSites();
  };

  const handleImpersonate = async (site: SiteWithStats) => {
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
      
      console.log('Impersonation response:', response);
      
      // Create proper user object with roles
      const impersonatedUser = {
        ...response.user,
        userId: response.user.id,
        firstName: response.user.fullName.split(' ')[0] || 'Admin',
        lastName: response.user.fullName.split(' ').slice(1).join(' ') || '',
        phoneNumber: response.user.phone || '',
        roles: response.roles || ['ROLE_ADMIN'], // Ensure roles are included
      };
      
      console.log('Impersonated user:', impersonatedUser);
      
      // Store the impersonation data
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(impersonatedUser));
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

  const getStatusColor = (status: string) => {
    return status === 'aktif' ? colors.success : colors.error;
  };

  const getStatusIcon = (status: string) => {
    return status === 'aktif' ? CheckCircle : XCircle;
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Building2 size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Site Yönetimi</Text>
            <Text style={styles.headerSubtitle}>
              {filteredSites.length} site
            </Text>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.75} onPress={handleAddSite} style={styles.addButton}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            Tümü ({sites.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'active' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.filterText, selectedFilter === 'active' && styles.filterTextActive]}>
            Aktif ({sites.filter(s => s.subscriptionStatus === 'aktif').length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'inactive' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('inactive')}
        >
          <Text style={[styles.filterText, selectedFilter === 'inactive' && styles.filterTextActive]}>
            Pasif ({sites.filter(s => s.subscriptionStatus !== 'aktif').length})
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Site ara..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredSites.map((site) => {
          const StatusIcon = getStatusIcon(site.subscriptionStatus);
          return (
            <Pressable
              key={site.id}
              style={styles.siteCard}
              onPress={() => handleSitePress(site)}
            >
              <View style={styles.siteHeader}>
                <View style={styles.siteIcon}>
                  <Building2 size={22} color={colors.primary} />
                </View>
                <View style={styles.siteInfo}>
                  <View style={styles.siteTitleRow}>
                    <Text numberOfLines={1} style={styles.siteName}>
                      {site.name}
                    </Text>
                    <View style={styles.siteActions}>
                      <StatusIcon 
                        size={16} 
                        color={getStatusColor(site.subscriptionStatus)} 
                      />
                    </View>
                  </View>
                  <View style={styles.siteLocationRow}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={styles.siteLocation}>{site.city}</Text>
                  </View>
                  <View style={styles.siteStatsRow}>
                    <View style={styles.statItem}>
                      <Home size={14} color={colors.textSecondary} />
                      <Text style={styles.statText}>{site.totalApartments || 0} daire</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Users size={14} color={colors.textSecondary} />
                      <Text style={styles.statText}>{site.totalResidents || 0} sakin</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.siteFooter}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleEditSite(site)}
                >
                  <Edit size={16} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Düzenle</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => handleImpersonate(site)}
                  disabled={impersonating === site.id}
                >
                  {impersonating === site.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Eye size={16} color={colors.white} />
                      <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                        Görüntüle
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        {filteredSites.length === 0 && (
          <View style={styles.emptyState}>
            <Building2 size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Site bulunamadı</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Arama kriterlerini değiştirin' : 'Henüz site eklenmemiş'}
            </Text>
            {!searchQuery && (
              <Pressable style={styles.emptyButton} onPress={handleAddSite}>
                <Plus size={18} color={colors.white} />
                <Text style={styles.emptyButtonText}>İlk Siteyi Ekle</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <SiteDetailModal
        visible={siteDetailModal.visible}
        site={siteDetailModal.site}
        onClose={() => setSiteDetailModal({ visible: false, site: null })}
        onAddManager={handleAddManager}
        onEditSite={handleEditSite}
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

      <AddManagerModal
        visible={addManagerModal.visible}
        siteId={addManagerModal.siteId}
        sites={sites}
        onClose={() => setAddManagerModal({ visible: false, siteId: null })}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
};

export default SuperAdminSitesScreen;

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray50,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primaryLight,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  siteCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  siteInfo: {
    flex: 1,
  },
  siteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  siteName: {
    flex: 1,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  siteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  siteLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  siteLocation: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  siteStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  siteFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  actionButtonTextPrimary: {
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
