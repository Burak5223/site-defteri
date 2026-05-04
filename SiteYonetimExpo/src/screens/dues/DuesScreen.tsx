import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../api/apiClient';
import { Due } from '../../types';
import { spacing, fontSize } from '../../theme';

const DuesScreen = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDues();
  }, []);

  const loadDues = async () => {
    try {
      const data = await apiClient.get<Due[]>('/dues/my-dues');
      setDues(data);
    } catch (error) {
      console.error('Aidatlar yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDues();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#16a34a';
      case 'UNPAID': return '#eab308';
      case 'OVERDUE': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Ödendi';
      case 'UNPAID': return 'Ödenmedi';
      case 'OVERDUE': return 'Gecikmiş';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: Due }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#ffffff' }}
          >
            {getStatusLabel(item.status)}
          </Chip>
          <Text style={styles.amount}>₺{item.amount.toLocaleString()}</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.date}>
          Son Ödeme: {new Date(item.dueDate).toLocaleDateString('tr-TR')}
        </Text>
        {item.status !== 'PAID' && (
          <Button
            mode="contained"
            style={styles.payButton}
            onPress={() => {/* TODO: Implement payment */}}
          >
            Ödeme Yap
          </Button>
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
        data={dues}
        renderItem={renderItem}
        keyExtractor={(item) => item.dueId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cash-check" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aidat kaydı bulunamadı</Text>
          </View>
        }
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
  amount: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  description: {
    fontSize: fontSize.md,
    color: '#475569',
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
    marginBottom: spacing.md,
  },
  payButton: {
    marginTop: spacing.sm,
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

export default DuesScreen;
