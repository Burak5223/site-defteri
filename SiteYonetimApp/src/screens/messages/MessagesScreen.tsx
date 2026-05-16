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
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiClient } from '../../api/apiClient';
import { messageService, Message } from '../../services/message.service';
import { siteService, Block } from '../../services/site.service';
import { colors, lightTheme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';

type ChatView = 'list' | 'group' | 'direct-chat' | 'apartment-chat' | 'system-chat' | 'block-view';

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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  // Role groups - her rolden bir kutucuk
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);

  const groupScrollRef = useRef<ScrollView | null>(null);
  const directScrollRef = useRef<ScrollView | null>(null);
  const apartmentScrollRef = useRef<ScrollView | null>(null);

  const currentSiteId = user?.siteId || '1';
  const userId = user?.userId || '1'; // userId zaten string
  const userRole = user?.roles?.[0] || 'RESIDENT';
  const currentSiteName = 'Site Yönetimi';
  
  // Kullanıcı admin mi? (Sistem mesajları sadece adminler için)
  const isAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN';

  useEffect(() => {
    console.log('=== MESSAGES SCREEN MOUNTED ===');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User roles array:', user?.roles);
    console.log('User Role (first):', userRole);
    console.log('Site ID:', currentSiteId);
    
    loadContacts();
    loadMessages();
    loadApartments();
    loadSystemMessages();
    loadBlocks();
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

  const loadBlocks = async () => {
    try {
      const siteId = user?.siteId || '1';
      console.log('=== LOADING BLOCKS ===');
      console.log('Site ID:', siteId);
      
      const data = await siteService.getSiteBlocks(siteId);
      console.log('✓ Blocks loaded successfully!');
      console.log('Number of blocks:', data.length);
      setBlocks(data);
      
      if (data.length === 0) {
        console.warn('⚠️ No blocks found for site:', siteId);
      }
    } catch (error: any) {
      console.error('✗ Bloklar yüklenemedi!');
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

        {/* Özel Mesajlar Bölümü - TÜM ROLLER İÇİN */}
        {roleGroups.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Özel Mesajlar</Text>
            </View>

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
                  );
                })}
          </>
        )}

        {/* Daire Mesajları Bölümü - SADECE PERSONEL İÇİN (Admin, Güvenlik, Temizlikçi) */}
        {(userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || 
          userRole === 'SECURITY' || userRole === 'ROLE_SECURITY' ||
          userRole === 'CLEANING' || userRole === 'ROLE_CLEANING') && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Daire Mesajları</Text>
            </View>

            {/* Bloklar Dropdown */}
            <Pressable
              style={styles.blockDropdownContainer}
              onPress={() => setShowBlockDropdown(!showBlockDropdown)}
            >
              <View style={styles.blockDropdownHeader}>
                <View style={styles.chatIconPrimary}>
                  <Building2 size={24} color={lightTheme.colors.primary} />
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatTitle}>Bloklar</Text>
                  <Text style={styles.chatSubtitle}>
                    {blocks.length} blok • {apartments.length} daire
                  </Text>
                </View>
                {(() => {
                  // Tüm bloklardaki okunmamış mesaj sayısı
                  const totalBlockUnread = apartments.reduce((sum, apt) => {
                    return sum + getUnreadCount(undefined, apt.id);
                  }, 0);
                  
                  return totalBlockUnread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{totalBlockUnread}</Text>
                    </View>
                  ) : null;
                })()}
                {showBlockDropdown ? (
                  <ChevronUp size={20} color="#9ca3af" />
                ) : (
                  <ChevronDown size={20} color="#9ca3af" />
                )}
              </View>
            </Pressable>

            {/* Blok Listesi - Accordion Style */}
            {showBlockDropdown && (
              <View style={styles.blockAccordion}>
                {blocks.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Blok bulunamadı</Text>
                  </View>
                )}
                
                {blocks.map((block) => {
                  const blockApartments = apartments.filter(apt => apt.block === block.name);
                  
                  // Bu bloktaki tüm dairelerin okunmamış mesaj sayısı
                  const blockUnreadCount = blockApartments.reduce((sum, apt) => {
                    return sum + getUnreadCount(undefined, apt.id);
                  }, 0);
                  
                  return (
                    <Pressable
                      key={block.id}
                      style={styles.blockAccordionItem}
                      onPress={() => {
                        setSelectedBlock(block.name);
                        setChatView('block-view');
                        setShowBlockDropdown(false);
                      }}
                    >
                      <View style={styles.chatCardRow}>
                        <View style={styles.chatIconSecondary}>
                          <Building2 size={20} color={lightTheme.colors.primary} />
                        </View>
                        <View style={styles.chatInfo}>
                          <Text style={styles.chatTitle}>{block.name}</Text>
                          <Text style={styles.chatSubtitle}>
                            {blockApartments.length} daire
                          </Text>
                        </View>
                        {blockUnreadCount > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{blockUnreadCount}</Text>
                          </View>
                        )}
                        <ChevronRight size={16} color="#9ca3af" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
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

  const renderBlockView = () => {
    if (!selectedBlock) return null;

    const blockApartments = apartments.filter(apt => apt.block === selectedBlock);
    
    // Daire numaralarına göre sırala (sayısal sıralama)
    const sortedApartments = blockApartments.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    
    const filteredBlockApartments = sortedApartments.filter(apartment => {
      const query = searchQuery.toLowerCase();
      return (
        apartment.number.toLowerCase().includes(query) ||
        apartment.residentName.toLowerCase().includes(query)
      );
    });

    return (
      <View style={styles.flexContainer}>
        <View style={styles.chatHeader}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => {
              setSelectedBlock(null);
              setSearchQuery('');
              setChatView('list');
            }}
          >
            <ChevronLeft size={24} color="#020617" />
          </Pressable>
          <View style={styles.chatHeaderIconPrimary}>
            <Building2 size={20} color={lightTheme.colors.primary} />
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle}>{selectedBlock}</Text>
            <Text style={styles.chatHeaderSubtitle}>{blockApartments.length} daire</Text>
          </View>
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

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
        >
          {filteredBlockApartments.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Daire bulunamadı</Text>
            </View>
          )}

          {filteredBlockApartments.map((apartment) => {
            const lastMsg = getLastMessage(undefined, apartment.id);
            const unreadCount = getUnreadCount(undefined, apartment.id);
            
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
                    <Text style={styles.chatTitle}>Daire {apartment.number || '?'}</Text>
                    <Text style={styles.chatSubtitle}>{apartment.residentName || 'İsimsiz Sakin'}</Text>
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
            );
          })}
        </ScrollView>
      </View>
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
      {chatView === 'block-view' && renderBlockView()}
    </View>
  );
};

export default MessagesScreen;

const createStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  flexContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listScroll: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    rowGap: 12,
  },
  chatCard: {
    borderRadius: 16,
    backgroundColor: colors.background,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIconPrimary: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(15,118,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatIconSecurity: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatIconContact: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatIconSystem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatIconApartment: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  apartmentIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  chatLastMessage: {
    marginTop: 6,
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  chatHeaderIconPrimary: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(15,118,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderIconSecurity: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderIconContact: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderIconSystem: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderIconApartment: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  apartmentHeaderIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    fontSize: 13,
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
    backgroundColor: colors.backgroundSecondary,
  },
  messagesScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    rowGap: 8,
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
    backgroundColor: colors.backgroundTertiary,
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
    color: colors.textPrimary,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.primary,
    shadowColor: lightTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 12,
  },
  unreadText: {
    fontSize: 12,
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
    backgroundColor: colors.background,
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
  blockDropdownContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blockDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  blockAccordion: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  blockAccordionItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 8,
    padding: 14,
  },
  chatIconSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});



