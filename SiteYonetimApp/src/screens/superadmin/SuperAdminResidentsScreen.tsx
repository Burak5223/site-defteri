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
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Building2,
  Home,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';

interface Resident {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  apartmentNumber: string;
  siteName: string;
  siteId: string;
  status: string;
  registrationDate: string;
}

const SuperAdminResidentsScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalSites: 0,
  });

  useEffect(() => {
    loadResidents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadResidents();
    }, [])
  );

  useEffect(() => {
    filterResidents();
  }, [searchQuery, residents, selectedFilter]);

  const loadResidents = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading residents...');
      
      // Get all residents from all sites
      const response = await apiClient.get<Resident[]>('/super-admin/residents');
      const residentsData: Resident[] = response || [];
      
      console.log('✅ Residents loaded:', residentsData.length);
      setResidents(residentsData);
      
      // Calculate stats
      const activeCount = residentsData.filter((r: Resident) => r.status === 'aktif').length;
      const inactiveCount = residentsData.length - activeCount;
      const uniqueSites = new Set(residentsData.map((r: Resident) => r.siteId)).size;
      
      setStats({
        total: residentsData.length,
        active: activeCount,
        inactive: inactiveCount,
        totalSites: uniqueSites,
      });
      
    } catch (error: any) {
      console.error('❌ Failed to load residents:', error);
      
      // Mock data for demonstration
      const mockResidents: Resident[] = [
        {
          id: '1',
          fullName: 'Ahmet Yılmaz',
          email: 'ahmet@example.com',
          phone: '+90 555 123 4567',
          apartmentNumber: 'A-101',
          siteName: 'Güneş Sitesi',
          siteId: '1',
          status: 'aktif',
          registrationDate: '2024-01-15',
        },
        {
          id: '2',
          fullName: 'Ayşe Demir',
          email: 'ayse@example.com',
          phone: '+90 555 234 5678',
          apartmentNumber: 'B-205',
          siteName: 'Yıldız Sitesi',
          siteId: '2',
          status: 'aktif',
          registrationDate: '2024-02-20',
        },
        {
          id: '3',
          fullName: 'Mehmet Kaya',
          email: 'mehmet@example.com',
          phone: '+90 555 345 6789',
          apartmentNumber: 'C-302',
          siteName: 'Ay Sitesi',
          siteId: '3',
          status: 'pasif',
          registrationDate: '2024-03-10',
        },
      ];
      
      setResidents(mockResidents);
      setStats({
        total: mockResidents.length,
        active: mockResidents.filter(r => r.status === 'aktif').length,
        inactive: mockResidents.filter(r => r.status === 'pasif').length,
        totalSites: new Set(mockResidents.map(r => r.siteId)).size,
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResidents();
  };

  const filterResidents = () => {
    let filtered = residents;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(resident => {
        if (selectedFilter === 'active') {
          return resident.status === 'aktif';
        } else {
          return resident.status !== 'aktif';
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resident) =>
          resident.fullName.toLowerCase().includes(query) ||
          resident.email.toLowerCase().includes(query) ||
          resident.siteName.toLowerCase().includes(query) ||
          resident.apartmentNumber.toLowerCase().includes(query)
      );
    }

    setFilteredResidents(filtered);
  };

  const getStatusColor = (status: string) => {
    return status === 'aktif' ? colors.success : colors.error;
  };

  const getStatusIcon = (status: string) => {
    return status === 'aktif' ? UserCheck : UserX;
  };

  const groupBySite = () => {
    const grouped = new Map<string, Resident[]>();
    filteredResidents.forEach((resident) => {
      const siteName = resident.siteName || 'Bilinmeyen Site';
      if (!grouped.has(siteName)) {
        grouped.set(siteName, []);
      }
      grouped.get(siteName)!.push(resident);
    });
    return grouped;
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
            <Users size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sakin Yönetimi</Text>
            <Text style={styles.headerSubtitle}>
              {filteredResidents.length} sakin
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Toplam Sakin</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Pasif</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSites}</Text>
            <Text style={styles.statLabel}>Site</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            Tümü ({stats.total})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'active' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.filterText, selectedFilter === 'active' && styles.filterTextActive]}>
            Aktif ({stats.active})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, selectedFilter === 'inactive' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('inactive')}
        >
          <Text style={[styles.filterText, selectedFilter === 'inactive' && styles.filterTextActive]}>
            Pasif ({stats.inactive})
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Sakin ara..."
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
        {/* Group by Site */}
        {Array.from(groupBySite().entries()).map(([siteName, siteResidents]) => (
          <View key={siteName} style={styles.siteGroup}>
            <View style={styles.siteHeader}>
              <Building2 size={16} color={colors.primary} />
              <Text style={styles.siteHeaderText}>{siteName}</Text>
              <Text style={styles.siteHeaderCount}>({siteResidents.length})</Text>
            </View>
            
            {siteResidents.map((resident) => {
              const StatusIcon = getStatusIcon(resident.status);
              return (
                <View key={resident.id} style={styles.residentCard}>
                  <View style={styles.residentHeader}>
                    <View style={styles.residentIcon}>
                      <Users size={18} color={colors.primary} />
                    </View>
                    <View style={styles.residentInfo}>
                      <View style={styles.residentTitleRow}>
                        <Text style={styles.residentName}>{resident.fullName}</Text>
                        <StatusIcon 
                          size={16} 
                          color={getStatusColor(resident.status)} 
                        />
                      </View>
                      <View style={styles.residentApartmentRow}>
                        <Home size={14} color={colors.textSecondary} />
                        <Text style={styles.residentApartment}>{resident.apartmentNumber}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.residentDetails}>
                    <View style={styles.contactRow}>
                      <Mail size={14} color={colors.textSecondary} />
                      <Text style={styles.contactText}>{resident.email}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text style={styles.contactText}>{resident.phone}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {filteredResidents.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Sakin bulunamadı</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Arama kriterlerini değiştirin' : 'Henüz sakin kaydı yok'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SuperAdminResidentsScreen;

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
  statsContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    gap: spacing.xl,
  },
  siteGroup: {
    gap: spacing.md,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  siteHeaderText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  siteHeaderCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  residentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  residentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  residentIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  residentInfo: {
    flex: 1,
  },
  residentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  residentName: {
    flex: 1,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  residentApartmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  residentApartment: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  residentDetails: {
    gap: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
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
});