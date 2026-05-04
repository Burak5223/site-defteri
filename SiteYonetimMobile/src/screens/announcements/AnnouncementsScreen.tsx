import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import {
  Megaphone,
  AlertTriangle,
  Bell,
  Info,
  Plus,
} from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { Announcement } from '../../types';
import { spacing } from '../../theme';

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

  const getPriorityMeta = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          label: 'Acil',
          Icon: AlertTriangle,
          bg: 'rgba(239,68,68,0.1)',
          iconColor: '#ef4444',
          badgeBg: 'rgba(239,68,68,0.1)',
          badgeText: '#b91c1c',
        };
      case 'HIGH':
        return {
          label: 'Önemli',
          Icon: AlertTriangle,
          bg: 'rgba(249,115,22,0.1)',
          iconColor: '#f97316',
          badgeBg: 'rgba(249,115,22,0.1)',
          badgeText: '#c2410c',
        };
      case 'MEDIUM':
        return {
          label: 'Normal',
          Icon: Bell,
          bg: 'rgba(15,118,110,0.1)',
          iconColor: '#0f766e',
          badgeBg: 'rgba(15,118,110,0.1)',
          badgeText: '#0f766e',
        };
      case 'LOW':
      default:
        return {
          label: 'Bilgi',
          Icon: Info,
          bg: '#f3f4f6',
          iconColor: '#6b7280',
          badgeBg: '#e5e7eb',
          badgeText: '#4b5563',
        };
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => {
    const meta = getPriorityMeta(item.priority);
    const PriorityIcon = meta.Icon;

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('AnnouncementDetail', { announcement: item })
        }
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: meta.bg },
            ]}
          >
            <PriorityIcon size={20} color={meta.iconColor} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: meta.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.priorityBadgeText,
                    { color: meta.badgeText },
                  ]}
                >
                  {meta.label}
                </Text>
              </View>
            </View>
            <Text style={styles.cardBody} numberOfLines={3}>
              {item.content}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </Pressable>
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
          <Text style={styles.headerTitle}>Duyurular</Text>
          <Text style={styles.headerSubtitle}>
            {announcements.length} duyuru
          </Text>
        </View>
        <Pressable style={styles.headerButton}>
          <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.headerButtonText}>Duyuru Yap</Text>
        </Pressable>
      </View>

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
            <Megaphone size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Henüz duyuru yok</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 11,
    color: '#6b7280',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0f766e',
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#020617',
    marginRight: 8,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  cardDate: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '500',
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

export default AnnouncementsScreen;
