import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Package as PackageIcon, Truck, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { Package } from '../../types';
import { spacing } from '../../theme';

type FilterKey = 'all' | 'waiting' | 'delivered';

const PackagesScreen = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await apiClient.get<Package[]>('/packages/my-packages');
      setPackages(data);
    } catch (error) {
      console.error('Paketler yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPackages();
  };

  const waitingCount = packages.filter((p) => p.status === 'WAITING').length;

  const filtered = packages.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'waiting') return p.status === 'WAITING';
    return p.status === 'DELIVERED';
  });

  const formatDate = (dateStr: string | null | undefined) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('tr-TR')
      : '';

  const renderItem = ({ item }: { item: Package }) => {
    const isWaiting = item.status === 'WAITING';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View
            style={[
              styles.statusIconWrapper,
              isWaiting ? styles.statusIconWarning : styles.statusIconSuccess,
            ]}
          >
            {isWaiting ? (
              <Truck size={20} color="#d97706" />
            ) : (
              <CheckCircle2 size={20} color="#16a34a" />
            )}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{item.recipientName}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.recipientPhone}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  isWaiting ? styles.badgeSecondary : styles.badgePrimary,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    !isWaiting && styles.badgeTextOnPrimary,
                  ]}
                >
                  {isWaiting ? 'Bekliyor' : 'Teslim Alındı'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>
              Geliş: {formatDate(item.arrivalDate)}
              {item.deliveryDate
                ? ` • Teslim: ${formatDate(item.deliveryDate)}`
                : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Paketler</Text>
          <Text style={styles.headerSubtitle}>
            {waitingCount} bekleyen paket
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        {(['all', 'waiting', 'delivered'] as FilterKey[]).map((key) => (
          <Pressable
            key={key}
            style={[
              styles.tab,
              activeFilter === key && styles.tabActive,
            ]}
            onPress={() => setActiveFilter(key)}
          >
            <Text
              style={[
                styles.tabText,
                activeFilter === key && styles.tabTextActive,
              ]}
            >
              {key === 'all'
                ? 'Tümü'
                : key === 'waiting'
                ? 'Bekleyen'
                : 'Teslim Edilen'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.packageId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PackageIcon size={48} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>Paket kaydı bulunamadı</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020617',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    padding: 3,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#0f766e',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    rowGap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusIconWarning: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  statusIconSuccess: {
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020617',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSecondary: {
    backgroundColor: '#e5e7eb',
  },
  badgePrimary: {
    backgroundColor: '#0f766e',
  },
  badgeText: {
    fontSize: 10,
    color: '#111827',
  },
  badgeTextOnPrimary: {
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
});

export default PackagesScreen;
