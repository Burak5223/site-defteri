import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../api/apiClient';
import { DashboardStats } from '../../types';
import { spacing, fontSize } from '../../theme';

const DashboardScreen = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiClient.get<DashboardStats>('/dashboard/super-admin');
      setStats(data);
    } catch (error) {
      console.error('Dashboard yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ana Sayfa</Text>
        <Text style={styles.subtitle}>Özet Bilgiler</Text>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon="cash"
          title="Aylık Gelir"
          value={`₺${stats?.monthlyIncome?.toLocaleString() || 0}`}
          color="#16a34a"
        />
        <StatCard
          icon="cash-minus"
          title="Aylık Gider"
          value={`₺${stats?.monthlyExpense?.toLocaleString() || 0}`}
          color="#dc2626"
        />
        <StatCard
          icon="wallet"
          title="Bakiye"
          value={`₺${stats?.balance?.toLocaleString() || 0}`}
          color="#2563eb"
        />
        <StatCard
          icon="percent"
          title="Tahsilat Oranı"
          value={`%${stats?.collectionRate?.toFixed(1) || 0}`}
          color="#7c3aed"
        />
        <StatCard
          icon="package-variant"
          title="Bekleyen Paket"
          value={stats?.waitingPackages?.toString() || '0'}
          color="#ea580c"
        />
        <StatCard
          icon="ticket"
          title="Açık Talep"
          value={stats?.openTickets?.toString() || '0'}
          color="#0891b2"
        />
        <StatCard
          icon="message"
          title="Okunmamış Mesaj"
          value={stats?.unreadMessages?.toString() || '0'}
          color="#db2777"
        />
        <StatCard
          icon="home-group"
          title="Toplam Daire"
          value={stats?.totalApartments?.toString() || '0'}
          color="#059669"
        />
      </View>
    </ScrollView>
  );
};

const StatCard = ({ icon, title, value, color }: any) => (
  <Card style={styles.card}>
    <Card.Content style={styles.cardContent}>
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </Card.Content>
  </Card>
);

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
  header: {
    padding: spacing.lg,
    backgroundColor: '#2563eb',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: '#e0e7ff',
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  card: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  cardValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    color: '#64748b',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default DashboardScreen;
