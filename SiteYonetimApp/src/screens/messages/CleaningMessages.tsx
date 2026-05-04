import React, { useEffect, useState, useRef } from 'react';
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
  Search,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/message.service';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useI18n } from '../../context/I18nContext';

interface Apartment {
  id: string;
  number: string;
  blockName: string;
  residentName: string;
  residentId: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

type ChatView = 'list' | 'chat';

const CleaningMessages = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);
  const [chatView, setChatView] = useState<ChatView>('list');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const currentSiteId = user?.siteId || '1';
  const userId = user?.userId || '1';

  useEffect(() => {
    loadApartments();
  }, []);

  useEffect(() => {
    filterApartments();
  }, [searchQuery, apartments]);

  useEffect(() => {
    if (selectedApartment && chatView === 'chat') {
      loadMessages();
    }
  }, [selectedApartment, chatView]);

  const loadApartments = async () => {
    setIsLoading(true);
    try {
      const mockApartments: Apartment[] = [
        { id: '1', number: 'A-1', blockName: 'A Blok', residentName: 'Ahmet Yılmaz', residentId: '1' },
        { id: '2', number: 'A-2', blockName: 'A Blok', residentName: 'Mehmet Demir', residentId: '2' },
        { id: '3', number: 'A-3', blockName: 'A Blok', residentName: 'Ayşe Kaya', residentId: '3' },
        { id: '4', number: 'B-1', blockName: 'B Blok', residentName: 'Fatma Şahin', residentId: '4' },
        { id: '5', number: 'B-2', blockName: 'B Blok', residentName: 'Ali Çelik', residentId: '5' },
      ];
      setApartments(mockApartments);
      setFilteredApartments(mockApartments);
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
      Alert.alert(t('common.error'), 'Daireler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const filterApartments = () => {
    if (!searchQuery.trim()) {
      setFilteredApartments(apartments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = apartments.filter(
      (apt) =>
        apt.number.toLowerCase().includes(query) ||
        apt.blockName.toLowerCase().includes(query) ||
        apt.residentName.toLowerCase().includes(query)
    );
    setFilteredApartments(filtered);
  };

  const openChat = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setChatView('chat');
  };

  const loadMessages = async () => {
    if (!selectedApartment) return;
    
    try {
      // TODO: Backend'den mesajları çek
      setMessages([]);
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedApartment || !messageText.trim()) return;

    setIsSending(true);
    try {
      await messageService.sendMessage({
        siteId: currentSiteId,
        receiverId: selectedApartment.residentId,
        chatType: 'security',
        body: messageText.trim(),
      });

      setMessageText('');
      await loadMessages();
    } catch (error: any) {
      console.error('Mesaj gönderilemedi:', error);
      Alert.alert(t('common.error'), error?.message || 'Mesaj gönderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderApartmentList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daire Mesajları</Text>
        <Text style={styles.headerSubtitle}>
          {filteredApartments.length} daire
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Daire veya sakin ara..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.apartmentList}>
        {filteredApartments.map((apartment) => (
          <Pressable
            key={apartment.id}
            style={styles.apartmentCard}
            onPress={() => openChat(apartment)}
          >
            <View style={styles.apartmentIcon}>
              <MessageSquare size={20} color={colors.primary} />
            </View>
            <View style={styles.apartmentInfo}>
              <Text style={styles.apartmentNumber}>
                {apartment.blockName} - {apartment.number}
              </Text>
              <Text style={styles.apartmentResident}>
                {apartment.residentName}
              </Text>
            </View>
            <View style={styles.apartmentAction}>
              <Send size={16} color={colors.gray400} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <View style={styles.chatHeader}>
        <Pressable
          style={styles.backButton}
          onPress={() => setChatView('list')}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>
            {selectedApartment?.blockName} - {selectedApartment?.number}
          </Text>
          <Text style={styles.chatHeaderSubtitle}>
            {selectedApartment?.residentName}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubtext}>İlk mesajı gönderin</Text>
          </View>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === userId;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isOwn && styles.messageRowOwn,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                  ]}
                >
                  <Text style={[styles.messageText, isOwn && { color: colors.white }]}>
                    {message.body}
                  </Text>
                  <Text style={[styles.messageTime, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={colors.gray400}
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <Pressable
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Send size={18} color={colors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return chatView === 'list' ? renderApartmentList() : renderChat();
};

export default CleaningMessages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.headerSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  apartmentList: {
    flex: 1,
    padding: spacing.lg,
  },
  apartmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  apartmentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentNumber: {
    fontSize: fontSize.cardTitle,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  apartmentResident: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  apartmentAction: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatHeaderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
  },
  messageBubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
