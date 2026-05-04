import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../api/apiClient';
import { Announcement } from '../../types';
import { spacing, fontSize } from '../../theme';

const AnnouncementsScreen = ({ navigation }: any) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await apiClient.get<Announcement[]>('/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Duyurular yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#16a34a';
      default: return '#64748b';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Acil';
      case 'HIGH': return 'Yüksek';
      case 'MEDIUM': return 'Orta';
      case 'LOW': return 'Düşük';
      default: return priority;
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('AnnouncementDetail', { announcement: item })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Chip
              style={{ backgroundColor: getPriorityColor(item.priority) }}
              textStyle={{ color: '#ffffff', fontSize: 12 }}
            >
              {getPriorityLabel(item.priority)}
            </Chip>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardContent} numberOfLines={2}>
            {item.content}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
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
        data={announcements}
        renderItem={renderItem}
        keyExtractor={(item) => item.announcementId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bullhorn-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Henüz duyuru yok</Text>
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
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.sm,
  },
  cardContent: {
    fontSize: fontSize.md,
    color: '#64748b',
    lineHeight: 20,
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

export default AnnouncementsScreen;
