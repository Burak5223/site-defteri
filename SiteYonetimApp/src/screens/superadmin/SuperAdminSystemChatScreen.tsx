import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  Shield,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useFocusEffect } from '@react-navigation/native';
import { superAdminService } from '../../services/superadmin.service';

interface SystemMessage {
  id: string;
  siteId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  chatType: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const SuperAdminSystemChatScreen = ({ navigation, route }: any) => {
  const { t } = useI18n();
  const { siteId, adminId, adminName, siteName } = route.params || {};
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadMessages = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading system messages for site:', siteId);
      const messagesData = await superAdminService.getSystemMessagesBySite(siteId);
      
      if (Array.isArray(messagesData)) {
        setMessages(messagesData);
      } else {
        setMessages([]);
      }
      
      console.log('✅ System messages loaded:', messagesData?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load system messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !siteId || !adminId) {
      return;
    }

    setSending(true);
    try {
      console.log('📤 Sending system message...');
      await superAdminService.replyToSystemMessage(siteId, adminId, newMessage.trim());
      
      // Clear input immediately
      setNewMessage('');
      
      // Wait a bit then reload messages and scroll to bottom
      setTimeout(async () => {
        await loadMessages();
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 500);
      
      console.log('✅ System message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send system message:', error);
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, siteId, adminId, loadMessages]);

  const formatTime = useCallback((timestamp: string) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }, []);

  const formatDate = useCallback((timestamp: string) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Bugün';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Dün';
      } else {
        return date.toLocaleDateString('tr-TR');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

  const renderMessage = useCallback((message: SystemMessage, index: number) => {
    if (!message || !message.id) {
      return null;
    }
    
    const showDate = index === 0 || 
      formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt || '');
    
    const isFromSuperAdmin = message.senderRole === 'SUPER_ADMIN';

    return (
      <View key={message.id}>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{formatDate(message.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isFromSuperAdmin ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isFromSuperAdmin ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isFromSuperAdmin ? styles.sentText : styles.receivedText,
              ]}
            >
              {message.body || ''}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isFromSuperAdmin ? styles.sentTime : styles.receivedTime,
              ]}
            >
              {formatTime(message.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [messages, formatDate, formatTime]);

  const renderContent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Sistem mesajları yükleniyor...</Text>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Shield size={48} color={colors.gray300} />
          <Text style={styles.emptyText}>Henüz sistem mesajı yok</Text>
          <Text style={styles.emptySubtext}>
            İlk mesajı göndererek konuşmayı başlatın
          </Text>
        </View>
      );
    }

    return messages.map((message, index) => renderMessage(message, index));
  }, [loading, messages, renderMessage, colors.primary, colors.gray300]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Shield size={20} color="#8b5cf6" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sistem Mesajları</Text>
            <Text style={styles.headerSubtitle}>{siteName || 'Site'}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {renderContent()}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Sistem mesajınızı yazın..."
          placeholderTextColor={colors.gray400}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Send size={20} color={colors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SuperAdminSystemChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sentBubble: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: borderRadius.sm,
  },
  receivedBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sentText: {
    color: colors.white,
  },
  receivedText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  sentTime: {
    color: colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  receivedTime: {
    color: colors.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
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
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});