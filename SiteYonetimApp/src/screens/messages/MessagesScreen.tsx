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
  Shield,
  Users,
  ChevronLeft,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiClient } from '../../api/apiClient';
import { messageService, Message } from '../../services/message.service';
import { lightTheme } from '../../theme';
import { useI18n } from '../../context/I18nContext';

type ChatView = 'list' | 'group' | 'direct-chat' | 'apartment-chat' | 'system-chat';

interface MessageDisplay extends Message {
  senderRole?: string;
  chatType?: string;
  apartmentId?: string;
}

interface RoleGroup {
  type: 'admin' | 'security' | 'cleaning';
  name: string;
  role: string;
  users: Array<{ id: string; name: string }>; // Bu roldeki tüm kullanıcılar
}

interface Apartment {
  id: string;
  number: string;
  block: string;
  residentName: string;
  residentId?: string; // Dairenin sakini
  floor?: number;
}

// Export function to get total unread message count
export const getTotalUnreadCount = (messages: Message[], userId: string): number => {
  return messages.filter(m => 
    m.receiverId === userId && !m.isRead
  ).length;
};

const MessagesScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { refreshUnreadMessages } = useNotifications();
  const [chatView, setChatView] = useState<ChatView>('list');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<RoleGroup | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // Seçilen kullanıcı ID'si
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemMessages, setSystemMessages] = useState<MessageDisplay[]>([]);
  
  // Role groups - her rolden bir kutucuk
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);

  const groupScrollRef = useRef<ScrollView | null>(null);
  const directScrollRef = useRef<ScrollView | null>(null);
  const apartmentScrollRef = useRef<ScrollView | null>(null);

  const currentSiteId = user?.siteId || '1';
  const userId = user?.userId || '1'; // userId zaten string
  const userRole = user?.roles?.[0] || 'RESIDENT';
  const currentSiteName = 'Site Yönetimi';
  
  // Kullanıcı admin, güvenlik veya temizlik mi?
  // Check both with and without ROLE_ prefix
  const isStaff = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || 
                  userRole === 'SECURITY' || userRole === 'ROLE_SECURITY' || 
                  userRole === 'CLEANING' || userRole === 'ROLE_CLEANING';

  // Kullanıcı admin mi? (Sistem mesajları sadece adminler için)
  const isAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN';

  useEffect(() => {
    console.log('=== MESSAGES SCREEN MOUNTED ===');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User roles array:', user?.roles);
    console.log('User Role (first):', userRole);
    console.log('Is Staff:', isStaff);
    console.log('Site ID:', currentSiteId);
    
    loadContacts();
    loadMessages();
    loadApartments();
    loadSystemMessages();
  }, [user?.siteId]);

  const loadContacts = async () => {
    try {
      const data = await apiClient.get<any[]>('/users');
      
      console.log('=== LOADING ROLE GROUPS (ONE BOX PER ROLE) ===');
      console.log('User Role:', userRole);
      console.log('Total users from API:', data.length);
      
      // Her rol için kullanıcıları grupla
      const adminUsers = data.filter(u => 
        (u.roles?.includes('ADMIN') || u.roles?.includes('ROLE_ADMIN')) && 
        (u.id || u.userId) !== userId
      ).map(u => ({ id: u.id || u.userId, name: u.fullName || 'Yönetici' }));
      
      const securityUsers = data.filter(u => 
        (u.roles?.includes('SECURITY') || u.roles?.includes('ROLE_SECURITY')) && 
        (u.id || u.userId) !== userId
      ).map(u => ({ id: u.id || u.userId, name: u.fullName || 'Güvenlik' }));
      
      const cleaningUsers = data.filter(u => 
        (u.roles?.includes('CLEANING') || u.roles?.includes('ROLE_CLEANING')) && 
        (u.id || u.userId) !== userId
      ).map(u => ({ id: u.id || u.userId, name: u.fullName || 'Temizlikçi' }));
      
      // Tüm rol gruplarını oluştur
      const allRoleGroups: RoleGroup[] = [
        {
          type: 'admin',
          name: 'Yönetici',
          role: 'Site Yönetimi',
          users: adminUsers
        },
        {
          type: 'security',
          name: 'Güvenlik',
          role: 'Güvenlik Görevlisi',
          users: securityUsers
        },
        {
          type: 'cleaning',
          name: 'Temizlikçi',
          role: 'Temizlik Personeli',
          users: cleaningUsers
        }
      ];
      
      // Rol bazlı filtreleme
      let filteredRoleGroups = allRoleGroups;
      
      if (userRole === 'CLEANING' || userRole === 'ROLE_CLEANING') {
        filteredRoleGroups = allRoleGroups.filter(g => g.type === 'admin' || g.type === 'security');
        console.log('CLEANING role: Showing admin and security groups');
      } else if (userRole === 'SECURITY' || userRole === 'ROLE_SECURITY') {
        filteredRoleGroups = allRoleGroups.filter(g => g.type === 'admin' || g.type === 'cleaning');
        console.log('SECURITY role: Showing admin and cleaning groups');
      } else if (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') {
        filteredRoleGroups = allRoleGroups.filter(g => g.type === 'security' || g.type === 'cleaning');
        console.log('ADMIN role: Showing security and cleaning groups');
      } else if (userRole === 'RESIDENT' || userRole === 'ROLE_RESIDENT') {
        filteredRoleGroups = allRoleGroups;
        console.log('RESIDENT role: Showing all groups');
      }
      
      // Boş grupları filtrele
      filteredRoleGroups = filteredRoleGroups.filter(g => g.users.length > 0);
      
      console.log('Final role groups:', filteredRoleGroups.map(g => `${g.name} (${g.users.length} users)`).join(', '));
      
      setRoleGroups(filteredRoleGroups);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setRoleGroups([]);
    }
  };

  // Mesajlar okundu olarak işaretle
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (chatView === 'direct-chat' && selectedRoleGroup && selectedUserId) {
        // Seçili kullanıcıdan gelen mesajları okundu işaretle
        const unreadMessages = messages.filter(m => 
          m.chatType === 'apartment' && 
          m.senderId === selectedUserId && 
          m.receiverId === userId &&
          !m.isRead
        );
        
        for (const msg of unreadMessages) {
          try {
            await messageService.markAsRead(msg.id);
          } catch (error) {
            console.error('Mark as read error:', error);
          }
        }
        
        if (unreadMessages.length > 0) {
          await loadMessages();
          await refreshUnreadMessages();
        }
      } else if (chatView === 'apartment-chat' && selectedApartment) {
        // Apartment mesajlarını okundu işaretle
        const unreadMessages = messages.filter(m => 
          m.chatType === 'apartment' && 
          m.apartmentId === selectedApartment.id &&
          m.receiverId === userId &&
          !m.isRead
        );
        
        for (const msg of unreadMessages) {
          try {
            await messageService.markAsRead(msg.id);
          } catch (error) {
            console.error('Mark as read error:', error);
          }
        }
        
        if (unreadMessages.length > 0) {
          await loadMessages();
          await refreshUnreadMessages();
        }
      }
    };
    
    markMessagesAsRead();
  }, [chatView, selectedRoleGroup, selectedUserId, selectedApartment]);

  useEffect(() => {
    if (chatView === 'group' && groupScrollRef.current) {
      setTimeout(() => groupScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    if (chatView === 'direct-chat' && directScrollRef.current) {
      setTimeout(() => directScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    if (chatView === 'apartment-chat' && apartmentScrollRef.current) {
      setTimeout(() => apartmentScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatView, messages.length]);

  const filteredRoleGroups = roleGroups.filter(group => {
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.role.toLowerCase().includes(query) ||
      group.users.some(u => u.name.toLowerCase().includes(query))
    );
  });

  const filteredApartments = apartments.filter(apartment => {
    const query = searchQuery.toLowerCase();
    return (
      apartment.number.toLowerCase().includes(query) ||
      apartment.block.toLowerCase().includes(query) ||
      apartment.residentName.toLowerCase().includes(query)
    );
  });

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const siteId = user?.siteId || '1';
      console.log('=== LOADING MESSAGES ===');
      console.log('Site ID:', siteId);
      console.log('User ID:', userId);
      console.log('User Role:', userRole);
      
      const data = await messageService.getMessages(siteId);
      console.log('Total messages loaded:', data.length);
      
      // Mesajları tarihe göre sırala (en eski en üstte, en yeni en altta)
      const sortedMessages = data.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const mappedMessages = sortedMessages.map(msg => ({
        ...msg,
        senderRole: msg.senderRole || 'resident',
        chatType: msg.chatType || 'group'
      }));
      
      console.log('Mapped messages:', mappedMessages.length);
      console.log('Sample messages:', mappedMessages.slice(0, 3).map(m => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        chatType: m.chatType,
        body: m.body?.substring(0, 20)
      })));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
      Alert.alert(t('common.error'), t('messages.noMessages'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadApartments = async () => {
    try {
      const siteId = user?.siteId || '1';
      console.log('=== LOADING APARTMENTS ===');
      console.log('Site ID:', siteId);
      console.log('User Role:', userRole);
      console.log('Is Staff:', isStaff);
      console.log('Calling API: /sites/' + siteId + '/messages/apartments');
      
      const data = await messageService.getApartments(siteId);
      console.log('✓ Apartments loaded successfully!');
      console.log('Number of apartments:', data.length);
      console.log('Apartments data:', JSON.stringify(data, null, 2));
      setApartments(data);
      
      if (data.length === 0) {
        console.warn('⚠️ No apartments found for site:', siteId);
      }
    } catch (error: any) {
      console.error('✗ Daireler yüklenemedi!');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
    }
  };

  const loadSystemMessages = async () => {
    try {
      const siteId = user?.siteId || '1';
      console.log('=== LOADING SYSTEM MESSAGES ===');
      console.log('Site ID:', siteId);
      
      const data = await messageService.getSuperAdminMessages(siteId);
      console.log('✓ System messages loaded successfully!');
      console.log('Number of system messages:', data.length);
      
      // Mesajları tarihe göre sırala (en eski en üstte, en yeni en altta)
      const sortedMessages = data.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setSystemMessages(sortedMessages.map(msg => ({
        ...msg,
        senderRole: msg.senderRole || 'system',
        chatType: msg.chatType || 'system'
      })));
    } catch (error: any) {
      console.error('✗ Sistem mesajları yüklenemedi!');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
    }
  };

  const sendMessage = async (chatType: 'group' | 'direct' | 'apartment' | 'system', receiverId?: string, apartmentId?: string) => {
    if (!messageText.trim()) return;

    try {
      if (chatType === 'system') {
        // Sistem mesajı gönder (Super Admin'e)
        const siteId = user?.siteId || '1';
        await messageService.sendMessageToSuperAdmin(siteId, messageText.trim());
        setMessageText('');
        await loadSystemMessages();
        return;
      }

      // 1-1 mesaj gönderme
      const messageData: any = {
        siteId: currentSiteId,
        chatType: chatType,
        body: messageText.trim(),
      };

      // Direct mesaj - tek bir kullanıcıya
      if (chatType === 'apartment' && receiverId) {
        messageData.receiverId = receiverId;
        messageData.chatType = 'apartment';
        
        // Sakinin daire ID'sini ekle (eğer sakinse)
        if (user?.apartmentId) {
          messageData.apartmentId = user.apartmentId;
        }
      }

      // Daire mesajı - personelden daire sakinine
      if (chatType === 'apartment' && apartmentId) {
        messageData.apartmentId = apartmentId;
        // Dairenin sakinine gönder
        if (selectedApartment?.residentId) {
          messageData.receiverId = selectedApartment.residentId;
        }
      }

      console.log('Sending 1-1 message:', JSON.stringify(messageData, null, 2));

      await messageService.sendMessage(messageData);
      setMessageText('');
      await loadMessages();
    } catch (error: any) {
      console.error('Send message error:', error);
      Alert.alert(t('common.error'), error?.message || 'Mesaj gönderilemedi');
    }
  };

  const groupMessages = messages.filter(m => m.chatType === 'group');
  
  // Seçili kullanıcı ile 1-1 mesajlar
  const directMessages = selectedUserId 
    ? messages.filter(m => {
        const isMatch = m.chatType === 'apartment' && 
          ((m.senderId === userId && m.receiverId === selectedUserId) ||
           (m.senderId === selectedUserId && m.receiverId === userId));
        
        return isMatch;
      })
    : [];
  
  console.log('=== DIRECT MESSAGES (1-1 WITH SELECTED USER) ===');
  console.log('Selected User ID:', selectedUserId);
  console.log('Current User ID:', userId);
  console.log('Total messages:', messages.length);
  console.log('Filtered direct messages:', directMessages.length);

  // Personel için: Dairelerle apartment mesajlar
  // Her personel sadece KENDİ gönderdiği mesajları görür (2 kişi arası özel)
  const apartmentMessages = selectedApartment
    ? messages.filter(m => 
        m.chatType === 'apartment' && 
        m.apartmentId === selectedApartment.id &&
        (m.senderId === userId || m.receiverId === userId)
      )
    : [];

  const getUnreadCount = (roleGroup?: RoleGroup, apartmentId?: string, isSystem?: boolean) => {
    if (isSystem) {
      return systemMessages.filter(m => 
        m.receiverId === userId && !m.isRead
      ).length;
    }
    if (roleGroup) {
      // Rol grubundaki TÜM kullanıcılardan gelen okunmamış mesajlar
      const userIds = roleGroup.users.map(u => u.id);
      return messages.filter(m => 
        m.chatType === 'apartment' && 
        userIds.includes(m.senderId) && 
        m.receiverId === userId &&
        !m.isRead
      ).length;
    }
    if (apartmentId) {
      return messages.filter(m => 
        m.chatType === 'apartment' && 
        m.apartmentId === apartmentId &&
        m.receiverId === userId &&
        !m.isRead
      ).length;
    }
    return 0;
  };

  const getLastMessage = (roleGroup?: RoleGroup, apartmentId?: string, isSystem?: boolean) => {
    let filtered: MessageDisplay[] = [];
    
    if (isSystem) {
      filtered = systemMessages;
    } else if (roleGroup) {
      // Rol grubundaki TÜM kullanıcılarla olan mesajlar
      const userIds = roleGroup.users.map(u => u.id);
      filtered = messages.filter(m => 
        m.chatType === 'apartment' && 
        ((m.senderId === userId && userIds.includes(m.receiverId)) ||
         (userIds.includes(m.senderId) && m.receiverId === userId))
      );
    } else if (apartmentId) {
      filtered = messages.filter(m => 
        m.chatType === 'apartment' && 
        m.apartmentId === apartmentId &&
        (m.senderId === userId || m.receiverId === userId)
      );
    }
    
    if (filtered.length === 0) return null;
    return filtered[filtered.length - 1];
  };

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
        <Text style={styles.listHeaderTitle}>{t('messages.title')}</Text>
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
              <Text style={styles.chatTitle}>{currentSiteName}</Text>
              <Text style={styles.chatSubtitle}>{t('messages.groupChat')}</Text>
              {groupMessages && groupMessages.length > 0 && (
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  {groupMessages[groupMessages.length - 1].senderName || 'Bilinmeyen'}:{' '}
                  {groupMessages[groupMessages.length - 1].body || ''}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Super Admin Mesajları - Sadece Adminler için */}
        {isAdmin && (
          <Pressable
            style={styles.chatCard}
            onPress={() => setChatView('system-chat')}
          >
            <View style={styles.chatCardRow}>
              <View style={{ position: 'relative' }}>
                <View style={styles.chatIconSystem}>
                  <Shield size={24} color="#8b5cf6" />
                </View>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>Super Admin</Text>
                <Text style={styles.chatSubtitle}>Genel Yönetim</Text>
                {(() => {
                  const lastMsg = getLastMessage(undefined, undefined, true);
                  return lastMsg ? (
                    <Text style={styles.chatLastMessage} numberOfLines={1}>
                      {lastMsg.senderId === userId ? 'Sen: ' : 'Super Admin: '}{lastMsg.body || ''}
                    </Text>
                  ) : null;
                })()}
              </View>
              {getUnreadCount(undefined, undefined, true) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{getUnreadCount(undefined, undefined, true)}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}

        {/* Sakinler için: Her rolden bir kutucuk */}
        {!isStaff && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Özel Mesajlar</Text>
            </View>

            {roleGroups.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Mesajlaşabileceğiniz personel bulunamadı</Text>
              </View>
            )}

            {roleGroups.map((roleGroup) => {
              const lastMsg = getLastMessage(roleGroup);
              const unreadCount = getUnreadCount(roleGroup);
              
              return (
              <Pressable
                key={roleGroup.type}
                style={styles.chatCard}
                onPress={() => {
                  // Eğer tek kişi varsa direkt aç, yoksa kişi seçtir
                  if (roleGroup.users.length === 1) {
                    setSelectedRoleGroup(roleGroup);
                    setSelectedUserId(roleGroup.users[0].id);
                    setChatView('direct-chat');
                  } else {
                    // Birden fazla kişi var, ilkini seç (veya modal göster)
                    setSelectedRoleGroup(roleGroup);
                    setSelectedUserId(roleGroup.users[0].id);
                    setChatView('direct-chat');
                  }
                }}
              >
                <View style={styles.chatCardRow}>
                  <View style={styles.chatIconContact}>
                    <Shield size={20} color={roleGroup.type === 'admin' ? lightTheme.colors.primary : roleGroup.type === 'security' ? '#f59e0b' : '#10b981'} />
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>{roleGroup.name}</Text>
                    <Text style={styles.chatSubtitle}>
                      {roleGroup.users.length} kişi • {roleGroup.role}
                    </Text>
                    {lastMsg && (
                      <Text style={styles.chatLastMessage} numberOfLines={1}>
                        {lastMsg.senderId === userId ? 'Sen: ' : `${lastMsg.senderName}: `}{lastMsg.body || ''}
                      </Text>
                    )}
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )})}

          </>
        )}

        {/* Personel için: Her rolden bir kutucuk + daireler */}
        {isStaff && (
          <>
            {/* Özel Mesajlar - Her rolden bir kutucuk */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Özel Mesajlar</Text>
            </View>

            {roleGroups.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Mesajlaşabileceğiniz personel bulunamadı</Text>
              </View>
            )}

            {roleGroups.map((roleGroup) => {
              const lastMsg = getLastMessage(roleGroup);
              const unreadCount = getUnreadCount(roleGroup);
              
              return (
              <Pressable
                key={roleGroup.type}
                style={styles.chatCard}
                onPress={() => {
                  // Eğer tek kişi varsa direkt aç, yoksa ilkini seç
                  if (roleGroup.users.length === 1) {
                    setSelectedRoleGroup(roleGroup);
                    setSelectedUserId(roleGroup.users[0].id);
                    setChatView('direct-chat');
                  } else {
                    setSelectedRoleGroup(roleGroup);
                    setSelectedUserId(roleGroup.users[0].id);
                    setChatView('direct-chat');
                  }
                }}
              >
                <View style={styles.chatCardRow}>
                  <View style={styles.chatIconContact}>
                    <Shield size={20} color={roleGroup.type === 'admin' ? lightTheme.colors.primary : roleGroup.type === 'security' ? '#f59e0b' : '#10b981'} />
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>{roleGroup.name}</Text>
                    <Text style={styles.chatSubtitle}>
                      {roleGroup.users.length} kişi • {roleGroup.role}
                    </Text>
                    {lastMsg && (
                      <Text style={styles.chatLastMessage} numberOfLines={1}>
                        {lastMsg.senderId === userId ? 'Sen: ' : `${lastMsg.senderName}: `}{lastMsg.body || ''}
                      </Text>
                    )}
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )})}


            {/* Daire Mesajları */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Daire Mesajları</Text>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Daire ara..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {apartments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Daire bulunamadı</Text>
              </View>
            )}

            {filteredApartments.map((apartment) => {
              const lastMsg = getLastMessage(undefined, apartment.id);
              const unreadCount = getUnreadCount(undefined, apartment.id);
              
              // Personel için: Gönderen kişinin rolünü göster
              let displayName = `Daire ${apartment.number || '?'}`;
              if (lastMsg && lastMsg.senderId !== userId) {
                // Mesaj daireden gelmiş, sakin adını göster
                displayName = `Daire ${apartment.number || '?'}`;
              }
              
              return (
              <Pressable
                key={apartment.id}
                style={styles.chatCard}
                onPress={() => {
                  setSelectedApartment(apartment);
                  setChatView('apartment-chat');
                }}
              >
                <View style={styles.chatCardRow}>
                  <View style={styles.chatIconApartment}>
                    <Text style={styles.apartmentIconText}>{apartment.number || '?'}</Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>{displayName}</Text>
                    <Text style={styles.chatSubtitle}>{apartment.residentName || 'simsiz Sakin'}</Text>
                    {lastMsg && (
                      <Text style={styles.chatLastMessage} numberOfLines={1}>
                        {lastMsg.senderId === userId ? 'Sen: ' : ''}{lastMsg.body || ''}
                      </Text>
                    )}
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )})}

          </>
        )}
      </ScrollView>
    </View>
  );

  const renderMessages = (
    msgs: MessageDisplay[],
    scrollRef: any,
    isSecurity: boolean,
  ) => {
    if (!msgs || msgs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Shield size={48} color="rgba(148,163,184,0.7)" />
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
          const isUnread = !isOwn && !message.isRead;

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
                  <View style={{ position: 'relative' }}>
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
                    {isUnread && (
                      <View style={styles.messageUnreadBadge}>
                        <View style={styles.messageUnreadDot} />
                      </View>
                    )}
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
                      {message.senderName || 'Bilinmeyen'}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isOwn
                        ? isSecurity
                          ? styles.messageBubbleSecurityOwn
                          : styles.messageBubbleOwn
                        : styles.messageBubbleOther,
                    ]}
                  >
                    <Text style={[styles.messageText, isOwn && { color: '#fff' }]}>{message.body || ''}</Text>
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
          <Text style={styles.chatHeaderTitle}>{currentSiteName}</Text>
          <Text style={styles.chatHeaderSubtitle}>{t('messages.groupChat')}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingMessages}>
          <ActivityIndicator size="small" color={lightTheme.colors.primary} />
        </View>
      ) : (
        renderMessages(groupMessages, groupScrollRef, false)
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('messages.writeMessage')}
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

  const renderDirectChat = () => {
    if (!selectedRoleGroup || !selectedUserId) return null;

    const selectedUser = selectedRoleGroup.users.find(u => u.id === selectedUserId);
    if (!selectedUser) return null;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexContainer}>
        <View style={styles.chatHeader}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              setSelectedRoleGroup(null);
              setSelectedUserId(null);
              setChatView('list');
            }}
          >
            <ChevronLeft size={24} color="#020617" />
          </Pressable>
          <View style={styles.chatHeaderIconContact}>
            <Shield size={20} color={selectedRoleGroup.type === 'admin' ? lightTheme.colors.primary : selectedRoleGroup.type === 'security' ? '#f59e0b' : '#10b981'} />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>{selectedUser.name}</Text>
            <Text style={styles.chatHeaderSubtitle}>{selectedRoleGroup.role}</Text>
          </View>
          
          {/* Kişi seçici - birden fazla kişi varsa */}
          {selectedRoleGroup.users.length > 1 && (
            <Pressable
              style={{ padding: 8 }}
              onPress={() => {
                // Sonraki kişiye geç
                const currentIndex = selectedRoleGroup.users.findIndex(u => u.id === selectedUserId);
                const nextIndex = (currentIndex + 1) % selectedRoleGroup.users.length;
                setSelectedUserId(selectedRoleGroup.users[nextIndex].id);
              }}
            >
              <Text style={{ fontSize: 12, color: lightTheme.colors.primary }}>
                {selectedRoleGroup.users.findIndex(u => u.id === selectedUserId) + 1}/{selectedRoleGroup.users.length}
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingMessages}>
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          </View>
        ) : (
          renderMessages(directMessages, directScrollRef, false)
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={t('messages.writeMessage')}
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={() => sendMessage('apartment', selectedUserId)}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage('apartment', selectedUserId)}
            disabled={!messageText.trim()}
          >
            <Send size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderApartmentChat = () => {
    if (!selectedApartment) return null;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexContainer}>
        <View style={styles.chatHeader}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              setSelectedApartment(null);
              setChatView('list');
            }}
          >
            <ChevronLeft size={24} color="#020617" />
          </Pressable>
          <View style={styles.chatHeaderIconApartment}>
            <Text style={styles.apartmentHeaderIconText}>{selectedApartment.number || '?'}</Text>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>Daire {selectedApartment.number || '?'}</Text>
            <Text style={styles.chatHeaderSubtitle}>{selectedApartment.residentName || 'Isimsiz Sakin'}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingMessages}>
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          </View>
        ) : (
          renderMessages(apartmentMessages, apartmentScrollRef, false)
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={t('messages.writeMessage')}
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={() => sendMessage('apartment', undefined, selectedApartment.id)}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage('apartment', undefined, selectedApartment.id)}
            disabled={!messageText.trim()}
          >
            <Send size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderSystemChat = () => {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flexContainer}>
        <View style={styles.chatHeader}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => setChatView('list')}
          >
            <ChevronLeft size={24} color="#020617" />
          </Pressable>
          <View style={styles.chatHeaderIconSystem}>
            <Shield size={20} color="#8b5cf6" />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>Sistem</Text>
            <Text style={styles.chatHeaderSubtitle}>Genel Yönetim</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingMessages}>
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          </View>
        ) : (
          renderMessages(systemMessages, apartmentScrollRef, false)
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Super Admin'e mesaj yazın..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={() => sendMessage('system')}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage('system')}
            disabled={!messageText.trim()}
          >
            <Send size={18} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

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
      {chatView === 'apartment-chat' && renderApartmentChat()}
      {chatView === 'system-chat' && renderSystemChat()}
    </View>
  );
};

export default MessagesScreen;

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
  chatIconPrimary: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatIconSecurity: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.08)',
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
  chatIconSystem: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  apartmentIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
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
  securitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
    columnGap: 4,
  },
  securitySectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
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
  chatHeaderIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatHeaderIconSecurity: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
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
  chatHeaderIconSystem: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
  securityNotice: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.3)',
  },
  securityNoticeText: {
    fontSize: 11,
    color: '#b45309',
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
  messageBubbleSecurityOwn: {
    backgroundColor: '#f59e0b',
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
  sendButtonSecurity: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
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
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  messageUnreadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  messageUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});
