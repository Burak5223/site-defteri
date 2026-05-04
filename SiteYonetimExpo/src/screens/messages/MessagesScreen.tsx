import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator, FAB, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../api/apiClient';
import { Message } from '../../types';
import { spacing, fontSize } from '../../theme';

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

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('MessageDetail', { message: item })}
    >
      <Card style={[styles.card, !item.isRead && styles.unreadCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.senderInfo}>
              <Icon name="account-circle" size={40} color="#2563eb" />
              <View style={styles.senderText}>
                <Text style={styles.senderName}>{item.senderName}</Text>
                <Text style={styles.date}>
                  {new Date(item.sentAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
            {!item.isRead && (
              <Badge style={styles.badge}>Yeni</Badge>
            )}
          </View>
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.content} numberOfLines={2}>
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
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="email-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Mesaj bulunamadı</Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* TODO: Implement new message */}}
        label="Yeni Mesaj"
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  senderName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
  },
  badge: {
    backgroundColor: '#2563eb',
  },
  subject: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.sm,
  },
  content: {
    fontSize: fontSize.md,
    color: '#64748b',
    lineHeight: 20,
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

export default MessagesScreen;
