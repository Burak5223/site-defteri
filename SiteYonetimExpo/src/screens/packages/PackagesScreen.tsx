import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../api/apiClient';
import { Package } from '../../types';
import { spacing, fontSize } from '../../theme';

const PackagesScreen = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getStatusColor = (status: string) => {
    return status === 'DELIVERED' ? '#16a34a' : '#ea580c';
  };

  const getStatusLabel = (status: string) => {
    return status === 'DELIVERED' ? 'Teslim Alındı' : 'Bekliyor';
  };

  const renderItem = ({ item }: { item: Package }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#ffffff' }}
          >
            {getStatusLabel(item.status)}
          </Chip>
          <Icon name="package-variant" size={24} color="#2563eb" />
        </View>
        <Text style={styles.recipientName}>{item.recipientName}</Text>
        <Text style={styles.phone}>{item.recipientPhone}</Text>
        <Text style={styles.date}>
          Geliş: {new Date(item.arrivalDate).toLocaleDateString('tr-TR')}
        </Text>
        {item.deliveryDate && (
          <Text style={styles.date}>
            Teslim: {new Date(item.deliveryDate).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={packages}
        renderItem={renderItem}
        keyExtractor={(item) => item.packageId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package-variant-closed" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Paket kaydı bulunamadı</Text>
          </View>
        }
      />
      <FAB
        icon="qrcode-scan"
        style={styles.fab}
        onPress={() => {/* TODO: Implement QR scanner */}}
        label="QR Tara"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recipientName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.xs,
  },
  phone: {
    fontSize: fontSize.md,
    color: '#475569',
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: '#94a3b8',
    marginTop: spacing.md,
  },
});

export default PackagesScreen;
