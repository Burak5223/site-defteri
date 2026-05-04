import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Mail, UserCircle2, Plus } from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { Message } from '../../types';
import { spacing } from '../../theme';

const MessagesScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await apiClient.get<Message[]>('/messages/inbox');
      setMessages(data);
    } catch (error) {
      console.error('Mesajlar yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });

  const renderItem = ({ item }: { item: Message }) => {
    const initials = getInitials(item.senderName || 'Kullanıcı');

    return (
      <Pressable
        onPress={() => navigation.navigate('MessageDetail', { message: item })}
        style={[
          styles.card,
          !item.isRead && styles.cardUnread,
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.senderName} numberOfLines={1}>
                {item.senderName}
              </Text>
              <Text style={styles.dateText}>{formatDate(item.sentAt)}</Text>
            </View>
            <Text style={styles.subjectText} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={styles.previewText} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
          {!item.isRead && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Yeni</Text>
            </View>
          )}
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length} mesaj
          </Text>
        </View>
        <Pressable style={styles.headerButton}>
          <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.headerButtonText}>Yeni Mesaj</Text>
        </Pressable>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Mail size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Mesaj bulunamadı</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  headerSubtitle: {
    marginLeft: 8,
    fontSize: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: '#0f766e',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,118,110,0.08)',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f766e',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#020617',
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  subjectText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  previewText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    marginLeft: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(15,118,110,0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#0f766e',
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

export default MessagesScreen;
