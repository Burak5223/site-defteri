import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Send,
  ChevronLeft,
  MessageSquare,
  Users,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { messageService, Message } from '../../services/message.service';
import { lightTheme } from '../../theme';

type ChatView = 'list' | 'group' | 'direct-chat';

interface MessageDisplay extends Message {
  senderRole?: string;
  chatType?: string;
  apartmentId?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  type: 'admin' | 'security' | 'cleaning';
}

const SecurityMessages = () => {
  const { user } = useAuth();
  const [chatView, setChatView] = useState<ChatView>('list');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts] = useState<Contact[]>([
    { id: '1', name: 'Yönetici', role: 'Admin', type: 'admin' }, // Admin user ID
  ]);

  const apartmentScrollRef = useRef<ScrollView | null>(null);
  const groupScrollRef = useRef<ScrollView | null>(null);

  const currentSiteId = user?.siteId || '1';
  const userId = user?.userId || '1';

  useEffect(() => {
    loadMessages();
  }, [user?.siteId]);

  useEffect(() => {
    if (chatView === 'direct-chat' && apartmentScrollRef.current) {
      setTimeout(() => apartmentScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    if (chatView === 'group' && groupScrollRef.current) {
      setTimeout(() => groupScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatView, messages.length]);

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.role.toLowerCase().includes(query)
    );
  });

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const siteId = user?.siteId || '1';
      const data = await messageService.getMessages(siteId);
      const sortedMessages = data.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages.map(msg => ({
        ...msg,
        senderRole: msg.senderRole || 'resident',
        chatType: msg.chatType || 'group'
      })));
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
      Alert.alert('Hata', 'Mesajlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (chatType: 'group' | 'direct', receiverId?: string) => {
    if (!messageText.trim()) return;

    const messageData: any = {
      siteId: currentSiteId,
      chatType: chatType,
      body: messageText.trim(),
    };

    if (chatType === 'direct' && receiverId) {
      messageData.receiverId = receiverId;
    }

    console.log('Sending message:', JSON.stringify(messageData, null, 2));

    try {
      await messageService.sendMessage(messageData);
      setMessageText('');
      await loadMessages();
    } catch (error: any) {
      console.error('Send message error:', error);
      Alert.alert('Hata', error?.message || 'Mesaj gönderilemedi');
    }
  };

  const groupMessages = messages.filter(m => m.chatType === 'group');
  
  const directMessages = selectedContact 
    ? messages.filter(m => 
        m.chatType === 'direct' && 
        ((m.senderId === userId && m.receiverId === selectedContact.id) ||
         (m.senderId === selectedContact.id && m.receiverId === userId))
      )
    : [];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getInitials = (name: string) => {
    return (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (r: string) => {
    switch (r) {
      case 'ADMIN':
      case 'admin':
        return lightTheme.colors.primary;
      case 'SECURITY':
      case 'security':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderChatList = () => (
    <View style={styles.flexContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Mesajlar</Text>
      </View>

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listScrollContent}
      >
        <Pressable
          style={styles.chatCard}
          onPress={() => setChatView('group')}
        >
          <View style={styles.chatCardRow}>
            <View style={styles.chatIconPrimary}>
              <Users size={24} color={lightTheme.colors.primary} />
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatTitle}>Site Yönetimi</Text>
              <Text style={styles.chatSubtitle}>Grup Sohbeti</Text>
              {groupMessages && groupMessages.length > 0 && (
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  {groupMessages[groupMessages.length - 1].senderName}:{' '}
                  {groupMessages[groupMessages.length - 1].body}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Özel Mesajlar</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Kişi ara..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredContacts.map((contact) => (
          <Pressable
            key={contact.id}
            style={styles.chatCard}
            onPress={() => {
              setSelectedContact(contact);
              setChatView('direct-chat');
            }}
          >
            <View style={styles.chatCardRow}>
              <View style={styles.chatIconContact}>
                <MessageSquare size={20} color="#6366f1" />
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>{contact.name}</Text>
                <Text style={styles.chatSubtitle}>{contact.role}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderMessages = (msgs: MessageDisplay[], scrollRef: any) => {
    if (!msgs || msgs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color="rgba(148,163,184,0.7)" />
          <Text style={styles.emptyText}>Henüz mesaj yok</Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesScrollContent}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {msgs.map((message, index) => {
          const isOwn = message.senderId === userId;
          const showDate =
            index === 0 ||
            formatDate(message.createdAt) !==
              formatDate(msgs[index - 1].createdAt);
          const dateLabel = formatDate(message.createdAt);

          return (
            <View key={message.id}>
              {showDate && (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>{dateLabel}</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageRow,
                  isOwn && styles.messageRowOwn,
                ]}
              >
                {!isOwn && (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: getRoleColor(message.senderRole),
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(message.senderName)}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubbleWrapper,
                    isOwn && styles.messageBubbleWrapperOwn,
                  ]}
                >
                  {!isOwn && (
                    <Text style={styles.senderName}>
                      {message.senderName}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isOwn
                        ? styles.messageBubbleOwn
                        : styles.messageBubbleOther,
                    ]}
                  >
                    <Text style={[styles.messageText, isOwn && { color: '#fff' }]}>{message.body}</Text>
                  </View>
                  <Text
                    style={[
                      styles.messageTime,
                      isOwn
                        ? styles.messageTimeOwn
                        : styles.messageTimeOther,
                    ]}
                  >
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderDirectChat = () => {
    if (!selectedContact) return null;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexContainer}>
        <View style={styles.chatHeader}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              setSelectedContact(null);
              setChatView('list');
            }}
          >
            <ChevronLeft size={24} color="#020617" />
          </Pressable>
          <View style={styles.chatHeaderIconContact}>
            <MessageSquare size={20} color="#6366f1" />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>{selectedContact.name}</Text>
            <Text style={styles.chatHeaderSubtitle}>{selectedContact.role}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingMessages}>
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          </View>
        ) : (
          renderMessages(directMessages, apartmentScrollRef)
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={() => sendMessage('direct', selectedContact.id)}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage('direct', selectedContact.id)}
            disabled={!messageText.trim()}
          >
            <Send size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderGroupChat = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexContainer}>
      <View style={styles.chatHeader}>
        <Pressable
          style={styles.headerBackButton}
          onPress={() => setChatView('list')}
        >
          <ChevronLeft size={24} color="#020617" />
        </Pressable>
        <View style={styles.chatHeaderIconPrimary}>
          <Users size={20} color={lightTheme.colors.primary} />
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>Site Yönetimi</Text>
          <Text style={styles.chatHeaderSubtitle}>Grup Sohbeti</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingMessages}>
          <ActivityIndicator size="small" color={lightTheme.colors.primary} />
        </View>
      ) : (
        renderMessages(groupMessages, groupScrollRef)
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor="#9ca3af"
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={() => sendMessage('group')}
          returnKeyType="send"
        />
        <Pressable
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={() => sendMessage('group')}
          disabled={!messageText.trim()}
        >
          <Send size={18} color="#ffffff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  if (isLoading && chatView === 'list') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {chatView === 'list' && renderChatList()}
      {chatView === 'group' && renderGroupChat()}
      {chatView === 'direct-chat' && renderDirectChat()}
    </View>
  );
};

export default SecurityMessages;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flexContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#020617',
    backgroundColor: '#f9fafb',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    rowGap: 12,
  },
  chatCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  chatCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIconApartment: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatIconPrimary: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatIconContact: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  apartmentIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#020617',
  },
  chatSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  chatLastMessage: {
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  chatHeaderIconApartment: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatHeaderIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatHeaderIconContact: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  apartmentHeaderIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#020617',
  },
  chatHeaderSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  loadingMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    rowGap: 4,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateSeparatorText: {
    fontSize: 11,
    color: '#6b7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  messageBubbleWrapper: {
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  messageBubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 2,
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  messageBubbleOwn: {
    backgroundColor: lightTheme.colors.primary,
  },
  messageBubbleOther: {
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 13,
    color: '#020617',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  messageTimeOwn: {
    textAlign: 'right',
    marginRight: 2,
  },
  messageTimeOther: {
    marginLeft: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#020617',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
});
