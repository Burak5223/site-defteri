import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Building2,
  Home,
  Search,
  ChevronRight,
  Crown,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { apiClient } from '../../api/apiClient';
import { SiteWithStats } from '../../services/superadmin.service';

type ViewMode = 'sites' | 'blocks' | 'apartments' | 'residents';

interface Block {
  id: string;
  name: string;
  siteId: string;
  totalFloors?: number;
}

interface ApartmentResident {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  residentType?: 'owner' | 'tenant';
}

interface Apartment {
  id: string;
  blockId: string;
  blockName?: string;
  unitNumber: string;
  floor?: number;
  status?: string;
  residentCount?: number;
  residents?: ApartmentResident[];
}

const SuperAdminResidentsScreen = ({ navigation }: any) => {
  const [viewMode, setViewMode] = useState<ViewMode>('sites');
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteWithStats | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [blockStats, setBlockStats] = useState<Record<string, { apartments: number; residents: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'sites') {
        loadSites(false);
      }
    }, [viewMode])
  );

  const loadSites = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await apiClient.get<SiteWithStats[]>('/super-admin/sites');
      const sitesData = Array.isArray(response) ? response : [];
      setSites(sitesData);

      const hydratedSites = await Promise.all(
        sitesData.map(async (site) => {
          try {
            const siteBlocks = await apiClient.get<Block[]>(`/sites/${site.id}/blocks`);
            const blocksData = Array.isArray(siteBlocks) ? siteBlocks : [];

            const apartmentGroups = await Promise.all(
              blocksData.map(async (block) => {
                try {
                  const apartmentResponse = await apiClient.get<Apartment[]>(`/blocks/${block.id}/apartments-with-residents`);
                  return Array.isArray(apartmentResponse) ? apartmentResponse : [];
                } catch (error) {
                  console.warn('Site selection apartment count failed:', site.id, block.id, error);
                  return [];
                }
              })
            );

            const allApartments = apartmentGroups.flat();
            const totalResidents = allApartments.reduce(
              (total, apartment) => total + (apartment.residents?.length || apartment.residentCount || 0),
              0
            );

            return {
              ...site,
              totalApartments: allApartments.length || site.totalApartments || 0,
              totalResidents,
            };
          } catch (error) {
            console.warn('Site selection stats failed:', site.id, error);
            return site;
          }
        })
      );

      setSites(hydratedSites);
    } catch (error) {
      console.error('Super admin sites load error:', error);
      Alert.alert('Hata', 'Siteler yüklenemedi');
      setSites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBlocks = async (site: SiteWithStats) => {
    setSelectedSite(site);
    setSelectedBlock(null);
    setSelectedApartment(null);
    setSearchQuery('');
    setLoading(true);
    try {
      const response = await apiClient.get<Block[]>(`/sites/${site.id}/blocks`);
      const blocksData = Array.isArray(response) ? response : [];
      setBlocks(blocksData);
      setApartments([]);
      setBlockStats({});
      setViewMode('blocks');

      const statsResults = await Promise.all(
        blocksData.map(async (block) => {
          try {
            const apartmentResponse = await apiClient.get<Apartment[]>(`/blocks/${block.id}/apartments-with-residents`);
            const blockApartments = Array.isArray(apartmentResponse) ? apartmentResponse : [];
            const residents = blockApartments.reduce(
              (total, apartment) => total + (apartment.residents?.length || apartment.residentCount || 0),
              0
            );
            return [block.id, { apartments: blockApartments.length, residents }] as const;
          } catch (error) {
            console.warn('Block stats load failed:', block.id, error);
            return [block.id, { apartments: 0, residents: 0 }] as const;
          }
        })
      );
      setBlockStats(Object.fromEntries(statsResults));
    } catch (error) {
      console.error('Super admin blocks load error:', error);
      Alert.alert('Hata', 'Bloklar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadApartments = async (block: Block) => {
    setSelectedBlock(block);
    setSelectedApartment(null);
    setSearchQuery('');
    setLoading(true);
    try {
      const response = await apiClient.get<Apartment[]>(`/blocks/${block.id}/apartments-with-residents`);
      setApartments(Array.isArray(response) ? response : []);
      setViewMode('apartments');
    } catch (error) {
      console.error('Super admin apartments load error:', error);
      Alert.alert('Hata', 'Daireler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewMode === 'sites') {
      await loadSites(false);
    } else if (viewMode === 'blocks' && selectedSite) {
      await loadBlocks(selectedSite);
      setRefreshing(false);
    } else if ((viewMode === 'apartments' || viewMode === 'residents') && selectedBlock) {
      await loadApartments(selectedBlock);
      setRefreshing(false);
    } else {
      setRefreshing(false);
    }
  };

  const goBackOneStep = () => {
    if (viewMode === 'residents') {
      setSelectedApartment(null);
      setViewMode('apartments');
    } else if (viewMode === 'apartments') {
      setSelectedBlock(null);
      setApartments([]);
      setViewMode('blocks');
    } else if (viewMode === 'blocks') {
      setSelectedSite(null);
      setBlocks([]);
      setBlockStats({});
      setViewMode('sites');
    } else {
      navigation.goBack();
    }
    setSearchQuery('');
  };

  const filteredSites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter((site) =>
      site.name.toLowerCase().includes(query) ||
      (site.city || '').toLowerCase().includes(query)
    );
  }, [sites, searchQuery]);

  const filteredBlocks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return blocks;
    return blocks.filter((block) => block.name.toLowerCase().includes(query));
  }, [blocks, searchQuery]);

  const filteredApartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return apartments;
    return apartments.filter((apartment) =>
      apartment.unitNumber.toLowerCase().includes(query) ||
      (apartment.blockName || '').toLowerCase().includes(query)
    );
  }, [apartments, searchQuery]);

  const apartmentResidents = selectedApartment?.residents || [];
  const filteredResidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return apartmentResidents;
    return apartmentResidents.filter((resident) =>
      resident.fullName.toLowerCase().includes(query) ||
      (resident.email || '').toLowerCase().includes(query) ||
      (resident.phone || '').toLowerCase().includes(query)
    );
  }, [apartmentResidents, searchQuery]);

  const title = () => {
    if (viewMode === 'sites') return 'Site Seçimi';
    if (viewMode === 'blocks') return selectedSite?.name || 'Bloklar';
    if (viewMode === 'apartments') return `${selectedBlock?.name || ''} Blok`;
    return `Daire ${selectedApartment?.unitNumber || ''} Sakinleri`;
  };

  const subtitle = () => {
    if (viewMode === 'sites') return `${sites.length} site`;
    if (viewMode === 'blocks') return `${blocks.length} blok`;
    if (viewMode === 'apartments') return `${apartments.length} daire`;
    return `${apartmentResidents.length} sakin`;
  };

  const searchPlaceholder = () => {
    if (viewMode === 'sites') return 'Site ara...';
    if (viewMode === 'blocks') return 'Blok ara...';
    if (viewMode === 'apartments') return 'Daire ara...';
    return 'Sakin ara...';
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Pressable onPress={goBackOneStep} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>
            {viewMode === 'sites' ? 'Geri' : 'Önceki'}
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title()}</Text>
          <Text style={styles.headerSubtitle}>{subtitle()}</Text>
        </View>

        <View style={styles.searchInputContainer}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder()}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {viewMode === 'sites' && (
          <View style={styles.list}>
            {filteredSites.map((site) => (
              <Pressable key={site.id} style={styles.siteCard} onPress={() => loadBlocks(site)}>
                <View style={styles.iconBox}>
                  <Building2 size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{site.name}</Text>
                  <Text style={styles.cardMeta}>{site.city || 'Şehir bilgisi yok'}</Text>
                  <Text style={styles.cardMeta}>
                    {site.totalApartments || 0} daire • {site.totalResidents || 0} sakin
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
            {filteredSites.length === 0 && <EmptyState text="Site bulunamadı" icon="site" />}
          </View>
        )}

        {viewMode === 'blocks' && (
          <View style={styles.list}>
            {filteredBlocks.map((block) => (
              <Pressable key={block.id} style={styles.siteCard} onPress={() => loadApartments(block)}>
                <View style={styles.iconBox}>
                  <Building2 size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{block.name}</Text>
                  <Text style={styles.cardMeta}>{selectedSite?.name}</Text>
                  <Text style={styles.cardMeta}>
                    {blockStats[block.id]?.apartments || 0} daire • {blockStats[block.id]?.residents || 0} sakin
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
            {filteredBlocks.length === 0 && <EmptyState text="Blok bulunamadı" icon="block" />}
          </View>
        )}

        {viewMode === 'apartments' && (
          <View style={styles.apartmentsGrid}>
            {filteredApartments.map((apartment) => {
              const residents = apartment.residents || [];
              const occupied = residents.length > 0 || (apartment.residentCount || 0) > 0;
              return (
                <Pressable
                  key={apartment.id}
                  style={[styles.apartmentGridCard, !occupied && styles.emptyApartmentCard]}
                  onPress={() => {
                    setSelectedApartment(apartment);
                    setSearchQuery('');
                    setViewMode('residents');
                  }}
                >
                  <Home size={24} color={occupied ? colors.primary : colors.textSecondary} style={styles.apartmentIcon} />
                  <Text style={styles.apartmentGridNumber}>{apartment.unitNumber}</Text>
                  <Text style={styles.apartmentGridResidents}>
                    {residents.length || apartment.residentCount || 0} sakin
                  </Text>
                </Pressable>
              );
            })}
            {filteredApartments.length === 0 && <EmptyState text="Daire bulunamadı" icon="apartment" />}
          </View>
        )}

        {viewMode === 'residents' && selectedApartment && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{apartmentResidents.length}</Text>
                <Text style={styles.statLabel}>Toplam</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {apartmentResidents.filter((r) => r.residentType === 'owner').length}
                </Text>
                <Text style={styles.statLabel}>Malik</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {apartmentResidents.filter((r) => r.residentType === 'tenant').length}
                </Text>
                <Text style={styles.statLabel}>Kiracı</Text>
              </View>
            </View>

            <View style={styles.list}>
              {filteredResidents.map((resident) => (
                <View key={resident.id} style={styles.residentCard}>
                  <View style={styles.residentHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {resident.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.residentInfo}>
                      <Text style={styles.residentName}>{resident.fullName}</Text>
                      <View style={styles.contactInfo}>
                        <Crown size={14} color={colors.textSecondary} />
                        <Text style={styles.contactText}>
                          {resident.residentType === 'owner' ? 'Kat Maliki' : 'Kiracı'}
                        </Text>
                      </View>
                      {resident.email ? (
                        <View style={styles.contactInfo}>
                          <Mail size={14} color={colors.textSecondary} />
                          <Text style={styles.contactText}>{resident.email}</Text>
                        </View>
                      ) : null}
                      {resident.phone ? (
                        <View style={styles.contactInfo}>
                          <Phone size={14} color={colors.textSecondary} />
                          <Text style={styles.contactText}>{resident.phone}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
              {filteredResidents.length === 0 && (
                <EmptyState text="Bu dairede kayıtlı sakin yok" icon="resident" />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const EmptyState = ({ text, icon }: { text: string; icon: 'site' | 'block' | 'apartment' | 'resident' }) => {
  const Icon = icon === 'resident' ? Users : icon === 'apartment' ? Home : Building2;
  return (
    <View style={styles.emptyState}>
      <Icon size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButtonText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.primary, marginLeft: 4 },
  header: { marginBottom: spacing.lg },
  headerTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 4 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: fontSize.inputText, color: colors.textPrimary },
  list: { gap: spacing.md },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  cardMeta: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  apartmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  apartmentGridCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  emptyApartmentCard: {
    backgroundColor: colors.gray50,
  },
  apartmentIcon: { marginBottom: spacing.sm },
  apartmentGridNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  apartmentGridResidents: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  statsContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  statLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  residentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  residentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  avatarText: { fontSize: 20, fontWeight: fontWeight.bold, color: colors.primary },
  residentInfo: { flex: 1, gap: 6 },
  residentName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'], width: '100%' },
  emptyText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: spacing.md },
});

export default SuperAdminResidentsScreen;
