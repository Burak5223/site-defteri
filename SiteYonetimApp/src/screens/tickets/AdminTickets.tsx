import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Wrench,
  Droplets,
  Zap,
  Settings,
  Menu,
  Camera,
  ImageIcon,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ticketService, Ticket } from '../../services/ticket.service';
import { lightTheme as theme } from '../../theme';
import { useI18n } from '../../context/I18nContext';

type TabKey = 'all' | 'open' | 'in_progress' | 'resolved';

const TicketsScreen = () => {
  const { t } = useI18n();
  const { user, hasRole } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isResident = hasRole('RESIDENT');
  const roleText = isResident ? t('ui.resident') : t('ui.admin');
  
  // Create Ticket State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
      title: '',
      description: '',
      category: 'maintenance',
      priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [solutionNote, setSolutionNote] = useState('');

  useEffect(() => {
    loadTickets();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  // Ekrana her gelindiğinde verileri yenile
  useFocusEffect(
    useCallback(() => {
      if (user?.siteId) {
        loadTickets();
      }
    }, [user?.siteId])
  );

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const siteId = user?.siteId;
      console.log('🎫 Tickets: Loading for siteId:', siteId);
      const data = await ticketService.getAllTickets(siteId);
      console.log('✅ Tickets Loaded:', { total: data.length, data });
      setTickets(data);
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
      // Mock data fallback
      setTickets([
        {
          id: '1',
          title: 'Asansör Arızası',
          description: 'B Blok asansörü çalışmıyor, 3. katta kaldı.',
          category: 'maintenance',
          status: 'in_progress',
          priority: 'high',
          createdAt: new Date().toISOString(),
          createdBy: '1',
          createdByName: 'Admin',
        },
        {
            id: '2',
            title: 'Su Sızıntısı',
            description: 'Giriş katta tavandan su damlıyor.',
            category: 'plumbing',
            status: 'open',
            priority: 'medium',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            createdBy: '2',
            createdByName: 'Sakin',
        }
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleCreateTicket = async () => {
      if (!newTicket.title || !newTicket.description) return;
      
      try {
          const siteId = user?.siteId || '1';
          await ticketService.createTicket({
              title: newTicket.title,
              description: newTicket.description,
              category: newTicket.category,
              priority: newTicket.priority,
          }, siteId);
          setShowCreateModal(false);
          setNewTicket({ title: '', description: '', category: 'maintenance', priority: 'medium' as 'low' | 'medium' | 'high' });
          setSelectedImages([]);
          loadTickets();
      } catch (error) {
          console.error('Create ticket error:', error);
          // Optimistic
          setTickets(prev => [
            {
                id: Math.random().toString(),
                title: newTicket.title,
                description: newTicket.description,
                category: newTicket.category as any,
                priority: newTicket.priority as any,
                status: 'open',
                createdAt: new Date().toISOString(),
                apartmentId: '1',
                createdBy: user?.email || '',
                createdByName: user?.fullName || 'Admin',
            },
            ...prev
          ]);
          setShowCreateModal(false);
          setSelectedImages([]);
      }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('tickets.permissionRequired'), t('tickets.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('tickets.permissionRequired'), t('tickets.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleManageTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    setAssignedPerson('');
    setSolutionNote('');
    setShowManageModal(true);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      const siteId = user?.siteId || '1';
      // Update ticket status via API
      await ticketService.updateTicketStatus(selectedTicket.id, ticketStatus, siteId);
      
      Alert.alert(t('tickets.success'), t('tickets.updateSuccess'));
      setShowManageModal(false);
      
      // Reload tickets to refresh the UI
      await loadTickets();
    } catch (error) {
      console.error('Update ticket error:', error);
      Alert.alert(t('tickets.error'), t('tickets.updateError'));
    }
  };

  const filteredTickets = tickets
    .filter((t) => activeTab === 'all' || t.status === activeTab)
    .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Sadece çözülmüş arızalar en alta gitsin, diğerleri tarihe göre sıralansın
      const aResolved = a.status === 'resolved' || a.status === 'closed';
      const bResolved = b.status === 'resolved' || b.status === 'closed';
      
      // Çözülmüş arızalar en alta
      if (aResolved && !bResolved) return 1;
      if (!aResolved && bResolved) return -1;
      
      // Her iki grup içinde tarihe göre sırala (en yeni önce)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return Wrench;
      case 'plumbing': return Droplets;
      case 'electrical': return Zap;
      default: return AlertTriangle;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'maintenance': return t('categories.maintenance');
      case 'plumbing': return t('categories.plumbing');
      case 'electrical': return t('categories.electrical');
      case 'other': return t('categories.other');
      default: return category;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { label: t('tickets.high'), bg: '#fef2f2', color: '#ef4444' };
      case 'medium': return { label: t('tickets.medium'), bg: '#fffbeb', color: '#f59e0b' };
      case 'low': return { label: t('tickets.low'), bg: '#f1f5f9', color: '#64748b' };
      // Eski değerler için backward compatibility
      case 'yuksek': return { label: t('tickets.high'), bg: '#fef2f2', color: '#ef4444' };
      case 'orta': return { label: t('tickets.medium'), bg: '#fffbeb', color: '#f59e0b' };
      case 'dusuk': return { label: t('tickets.low'), bg: '#f1f5f9', color: '#64748b' };
      default: return { label: t('tickets.medium'), bg: '#fffbeb', color: '#f59e0b' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return t('tickets.open');
      case 'in_progress': return t('tickets.inProgress');
      case 'resolved': return t('tickets.resolved');
      case 'closed': return t('tickets.closed');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#fef3c7', color: '#f59e0b' }; // Sarı
      case 'in_progress':
        return { bg: '#dbeafe', color: '#3b82f6' }; // Mavi
      case 'resolved':
        return { bg: '#d1fae5', color: '#10b981' }; // Yeşil
      case 'closed':
        return { bg: '#e5e7eb', color: '#6b7280' }; // Gri
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.settingsIcon}>
              <Settings size={20} color="#6b7280" />
            </View>
            <View>
              <Text style={styles.siteName}>{t('ui.siteName')}</Text>
              <Text style={styles.siteRole}>{roleText}</Text>
            </View>
          </View>
          <Pressable style={styles.menuIcon}>
            <Menu size={24} color="#1f2937" />
          </Pressable>
        </View>

        <View style={styles.container}>

        {/* Search */}
        <View style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
                style={styles.searchInput}
                placeholder={t('tickets.searchPlaceholder')}
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
            {(['all', 'open', 'in_progress', 'resolved'] as TabKey[]).map((tab) => (
                <Pressable
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab === 'all' ? t('common.all') : tab === 'open' ? t('tickets.open') : tab === 'in_progress' ? t('tickets.inProgress') : t('tickets.resolved')}
                    </Text>
                </Pressable>
            ))}
        </View>

        {/* List */}
        {isLoading ? (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        ) : (
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {filteredTickets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <CheckCircle2 size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('tickets.noRecords')}</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {filteredTickets.map((ticket) => {
                            const Icon = getCategoryIcon(ticket.category);
                            const priority = getPriorityBadge(ticket.priority);
                            const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
                            const statusColor = getStatusColor(ticket.status);

                            return (
                                <View key={ticket.id} style={[styles.card, isResolved && styles.cardResolved]}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconBox, isResolved && styles.iconBoxResolved]}>
                                            <Icon size={20} color={isResolved ? '#94a3b8' : theme.colors.primary} />
                                        </View>
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardTitleRow}>
                                                <Text style={[styles.cardTitle, isResolved && styles.cardTitleResolved]}>{ticket.title}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                                    <Text style={[styles.statusText, { color: statusColor.color }]}>{getStatusLabel(ticket.status)}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.cardDesc, isResolved && styles.cardDescResolved]} numberOfLines={2}>{ticket.description}</Text>
                                            
                                            <View style={styles.cardFooter}>
                                                <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                                                    <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
                                                </View>
                                                <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    {!isResident && (
                                        <TouchableOpacity 
                                            style={[styles.manageButton, isResolved && styles.manageButtonResolved]}
                                            onPress={() => handleManageTicket(ticket)}
                                        >
                                            <Text style={[styles.manageButtonText, isResolved && styles.manageButtonTextResolved]}>{t('tickets.manage')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        )}

        {/* Footer Button - Admin ve Sakin için (herkes arıza bildirebilir) */}
        <View style={styles.footer}>
            <Pressable
                style={styles.footerButton}
                onPress={() => setShowCreateModal(true)}
            >
                <Plus size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.footerButtonText}>{t('tickets.newTicket')}</Text>
            </Pressable>
        </View>

        {/* Create Ticket Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('tickets.newTicket')}</Text>
                        <Text style={styles.modalSubtitle}>{t('tickets.newTicketSubtitle')}</Text>
                        <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeButtonTop}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.formScroll}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('tickets.titleLabel')} *</Text>
                            <TextInput 
                                style={styles.input}
                                value={newTicket.title}
                                onChangeText={t => setNewTicket(prev => ({...prev, title: t}))}
                                placeholder={t('tickets.titlePlaceholder')}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('tickets.descriptionLabel')} *</Text>
                            <TextInput 
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={newTicket.description}
                                onChangeText={t => setNewTicket(prev => ({...prev, description: t}))}
                                placeholder={t('tickets.descriptionPlaceholder')}
                                multiline
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('tickets.categoryLabel')}</Text>
                            <View style={styles.pillsRow}>
                                {['maintenance', 'plumbing', 'electrical', 'other'].map(cat => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[styles.pill, newTicket.category === cat && styles.pillActive]}
                                        onPress={() => setNewTicket(prev => ({...prev, category: cat}))}
                                    >
                                        <Text style={[styles.pillText, newTicket.category === cat && styles.pillTextActive]}>
                                            {getCategoryLabel(cat)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('tickets.priorityLabel')}</Text>
                            <View style={styles.pillsRow}>
                                {(['low', 'medium', 'high'] as const).map(prio => (
                                    <TouchableOpacity 
                                        key={prio}
                                        style={[styles.pill, newTicket.priority === prio && styles.pillActive]}
                                        onPress={() => setNewTicket(prev => ({...prev, priority: prio}))}
                                    >
                                        <Text style={[styles.pillText, newTicket.priority === prio && styles.pillTextActive]}>
                                            {prio === 'low' ? t('tickets.low') : prio === 'medium' ? t('tickets.medium') : t('tickets.high')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('tickets.photosLabel')}</Text>
                            <View style={styles.photoSection}>
                                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                    <Camera size={20} color={theme.colors.primary} />
                                    <Text style={styles.photoButtonText}>{t('tickets.takePhoto')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                    <ImageIcon size={20} color={theme.colors.primary} />
                                    <Text style={styles.photoButtonText}>{t('tickets.selectFromGallery')}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.photoHint}>0/{selectedImages.length} {t('tickets.photoHint')}</Text>
                            
                            {selectedImages.length > 0 && (
                                <View style={styles.imagePreviewContainer}>
                                    {selectedImages.map((uri, index) => (
                                        <View key={index} style={styles.imagePreview}>
                                            <Image source={{ uri }} style={styles.previewImage} />
                                            <TouchableOpacity 
                                                style={styles.removeImageButton}
                                                onPress={() => removeImage(index)}
                                            >
                                                <X size={14} color="#ffffff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.saveButton} onPress={handleCreateTicket}>
                        <Text style={styles.saveButtonText}>{t('tickets.create')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Manage Ticket Modal (Admin Only) */}
        <Modal visible={showManageModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('tickets.ticketManagement')}</Text>
                        <Text style={styles.modalSubtitle}>{t('tickets.ticketManagementSubtitle')}</Text>
                        <TouchableOpacity onPress={() => setShowManageModal(false)} style={styles.closeButtonTop}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.formScroll}>
                        {selectedTicket && (
                            <>
                                <View style={styles.ticketInfoCard}>
                                    <Text style={styles.ticketInfoTitle}>{selectedTicket.title}</Text>
                                    <Text style={styles.ticketInfoDesc}>{selectedTicket.description}</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>{t('tickets.status')}</Text>
                                    <View style={styles.pillsRow}>
                                        {[
                                            { value: 'open', label: t('tickets.open'), icon: AlertTriangle },
                                            { value: 'in_progress', label: t('tickets.inProgress'), icon: Wrench },
                                            { value: 'resolved', label: t('tickets.resolved'), icon: CheckCircle2 }
                                        ].map(status => (
                                            <TouchableOpacity 
                                                key={status.value}
                                                style={[styles.statusPill, ticketStatus === status.value && styles.statusPillActive]}
                                                onPress={() => setTicketStatus(status.value)}
                                            >
                                                <status.icon size={14} color={ticketStatus === status.value ? '#ffffff' : '#64748b'} />
                                                <Text style={[styles.statusPillText, ticketStatus === status.value && styles.statusPillTextActive]}>
                                                    {status.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>{t('tickets.assignedTo')}</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={assignedPerson}
                                        onChangeText={setAssignedPerson}
                                        placeholder={t('tickets.notAssigned')}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>{t('tickets.solutionNote')}</Text>
                                    <TextInput 
                                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                        value={solutionNote}
                                        onChangeText={setSolutionNote}
                                        placeholder={t('tickets.solutionNotePlaceholder')}
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooterButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonSecondary]} 
                            onPress={() => setShowManageModal(false)}
                        >
                            <Text style={styles.modalButtonSecondaryText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonPrimary]} 
                            onPress={handleUpdateTicket}
                        >
                            <Text style={styles.modalButtonPrimaryText}>{t('tickets.update')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        </View>
    </View>
  );
};

export default TicketsScreen;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    siteName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    siteRole: {
        fontSize: 12,
        color: '#6b7280',
    },
    menuIcon: {
        padding: 8,
    },
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        color: '#0f172a',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#ffffff',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    list: {
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardResolved: {
        opacity: 0.6,
        backgroundColor: '#f8fafc',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0fdf4', // generic green tint
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxResolved: {
        backgroundColor: '#f1f5f9',
    },
    cardContent: {
        flex: 1,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    cardTitleResolved: {
        color: '#94a3b8',
    },
    statusBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeResolved: {
        backgroundColor: '#e2e8f0',
    },
    statusText: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '500',
    },
    statusTextResolved: {
        color: '#94a3b8',
    },
    cardDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 8,
        lineHeight: 18,
    },
    cardDescResolved: {
        color: '#94a3b8',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 10,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    closeButtonTop: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    closeButton: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748b',
    },
    formScroll: {
        flex: 1,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#0f172a',
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    pillActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },
    pillText: {
        fontSize: 12,
        color: '#64748b',
    },
    pillTextActive: {
        color: '#ffffff',
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    photoSection: {
        flexDirection: 'row',
        gap: 12,
    },
    photoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: 'rgba(15, 118, 110, 0.05)',
    },
    photoButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.primary,
    },
    photoHint: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 8,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 8,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    manageButton: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        alignItems: 'center',
    },
    manageButtonResolved: {
        backgroundColor: '#f1f5f9',
    },
    manageButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    manageButtonTextResolved: {
        color: '#94a3b8',
    },
    ticketInfoCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    ticketInfoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 8,
    },
    ticketInfoDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
    },
    statusPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    statusPillActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    statusPillTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    modalFooterButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonSecondary: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalButtonSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    modalButtonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    modalButtonPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});
