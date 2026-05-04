import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import {
  CreditCard,
  TrendingDown,
  Wallet,
  Package,
  Ticket,
  MessageCircle,
  Home,
} from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { DashboardStats } from '../../types';
import { spacing, fontSize } from '../../theme';

type StatVariant = 'primary' | 'destructive' | 'warning' | 'success' | 'default';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  variant?: StatVariant;
}

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
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeaderRow}>
          <View style={styles.welcomeTextWrapper}>
            <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
            <Text style={styles.welcomeSubtitle}>
              Yönetim panelinizin özet görünümü.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <StatCard
            title="Aylık Gelir"
            value={`₺${stats?.monthlyIncome?.toLocaleString('tr-TR') || 0}`}
            subtitle="Toplam tahsilat"
            icon={CreditCard}
            variant="primary"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Aylık Gider"
            value={`₺${stats?.monthlyExpense?.toLocaleString('tr-TR') || 0}`}
            subtitle="Toplam harcama"
            icon={TrendingDown}
            variant="destructive"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Bakiye"
            value={`₺${stats?.balance?.toLocaleString('tr-TR') || 0}`}
            subtitle="Genel durum"
            icon={Wallet}
            variant={stats && stats.balance >= 0 ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Tahsilat Oranı"
            value={`%${stats?.collectionRate?.toFixed(1) || 0}`}
            subtitle="Aidat tahsilatı"
            icon={CreditCard}
            variant="default"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Bekleyen Paket"
            value={stats?.waitingPackages?.toString() || '0'}
            subtitle="Teslim edilecek"
            icon={Package}
            variant="warning"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Açık Talep"
            value={stats?.openTickets?.toString() || '0'}
            subtitle="İşlem bekleyen"
            icon={Ticket}
            variant="warning"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Okunmamış Mesaj"
            value={stats?.unreadMessages?.toString() || '0'}
            subtitle="İletişim kutusu"
            icon={MessageCircle}
            variant="default"
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Toplam Daire"
            value={stats?.totalApartments?.toString() || '0'}
            subtitle="Sistemde kayıtlı"
            icon={Home}
            variant="default"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  const containerStyle =
    variant === 'primary'
      ? styles.statPrimary
      : variant === 'destructive'
      ? styles.statDestructive
      : variant === 'warning'
      ? styles.statWarning
      : variant === 'success'
      ? styles.statSuccess
      : styles.statDefault;

  const iconColor =
    variant === 'primary'
      ? '#0f766e'
      : variant === 'destructive'
      ? '#ef4444'
      : variant === 'warning'
      ? '#f97316'
      : variant === 'success'
      ? '#16a34a'
      : '#6b7280';

  return (
    <View style={[styles.statCard, containerStyle]}>
      <View style={styles.statIconWrapper}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    rowGap: 20,
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
  welcomeCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.15)',
    backgroundColor: 'rgba(15,118,110,0.06)',
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020617',
  },
  welcomeSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statItem: {
    width: '48%',
  },
  statCard: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statDefault: {
    backgroundColor: '#f9fafb',
  },
  statPrimary: {
    backgroundColor: 'rgba(15,118,110,0.06)',
  },
  statDestructive: {
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  statWarning: {
    backgroundColor: 'rgba(249,115,22,0.06)',
  },
  statSuccess: {
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#020617',
    marginTop: 2,
  },
  statSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
});

export default DashboardScreen;
