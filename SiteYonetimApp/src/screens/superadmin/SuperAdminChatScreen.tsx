import React, { useEffect, useState, useCallback } from 'react';
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
  ArrowLeft,
  Send,
  MessageSquare,
  User,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useFocusEffect } from '@react-navigation/native';
import { superAdminService } from '../../services/superadmin.service';

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  createdAt: string;
  isRead: boolean;
}

const SuperAdminChatScreen = ({ navigation, route }: any) => {
  const { t } = useI18n();
  const { managerId, managerName, siteName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [managerInfo, setManagerInfo] = useState<any>(null);

  useEffect(() => {
    loadManagerInfo();
    loadMessages();
  }, [managerId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [managerId])
  );

  const loadManagerInfo = async () => {
    try {
      const managers = await superAdminService.getAllManagers();
      const manager = managers.find(m => m.userId === managerId);
      setManagerInfo(manager || {
        fullName: managerName || 'Yönetici',
        siteName: siteName || 'Site'
      });
    } catch (error) {
      console.error('Failed to load manager info:', error);
      setManagerInfo({
        fullName: managerName || 'Yönetici',
        siteName: siteName || 'Site'
      });
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const messagesData = await superAdminService.getMessagesWithManager(managerId);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Mesajlar yüklenemedi'
      );
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await superAdminService.sendMessageToManager(managerId, newMessage.trim());
      setNewMessage('');
      await loadMessages(); // Reload messages to show the new one
    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Mesaj gönderilemedi'
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
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
      return '';
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const showDate = index === 0 || 
      formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
    
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
              {message.body}
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
  };

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
            <User size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {managerInfo?.fullName || 'Yönetici'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {managerInfo?.siteName || 'Site'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : messages.length > 0 ? (
          messages.map((message, index) => renderMessage(message, index))
        ) : (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubtext}>
              İlk mesajı göndererek konuşmayı başlatın
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Mesajınızı yazın..."
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

export default SuperAdminChatScreen;

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
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.none,
  },
  receivedBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.none,
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
    backgroundColor: colors.primary,
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