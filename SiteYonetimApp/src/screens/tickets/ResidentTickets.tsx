import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Wrench,
  X,
  Camera,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { ticketService, Ticket } from '../../services/ticket.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

type TabKey = 'all' | 'open' | 'in_progress' | 'resolved';

const ResidentTickets = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // New Ticket Modal
  const [newTicketModalVisible, setNewTicketModalVisible] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Bakım');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [ticketPhotos, setTicketPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (error) {
      console.error('Load tickets error:', error);
      Alert.alert(t('tickets.error'), t('tickets.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const filteredTickets = tickets
    .filter(t => {
      if (activeTab === 'all') return true;
      
      // Normalize status for comparison
      const status = t.status.toLowerCase();
      
      if (activeTab === 'open') {
        return status === 'open' || status === 'acik';
      } else if (activeTab === 'in_progress') {
        return status === 'in_progress' || status === 'devam_ediyor';
      } else if (activeTab === 'resolved') {
        return status === 'resolved' || status === 'cozuldu';
      }
      
      return false;
    })
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleTakePhoto = async () => {
    if (ticketPhotos.length >= 5) {
      Alert.alert(t('common.warning'), t('tickets.maxPhotos'));
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('tickets.error'), t('tickets.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTicketPhotos([...ticketPhotos, result.assets[0].uri]);
    }
  };

  const handlePickImage = async () => {
    if (ticketPhotos.length >= 5) {
      Alert.alert(t('common.warning'), t('tickets.maxPhotos'));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('tickets.error'), t('tickets.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTicketPhotos([...ticketPhotos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setTicketPhotos(ticketPhotos.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) {
      Alert.alert(t('tickets.error'), t('tickets.titleRequired'));
      return;
    }
    if (!ticketDescription.trim()) {
      Alert.alert(t('tickets.error'), t('tickets.descriptionRequired'));
      return;
    }
    if (ticketDescription.trim().length < 5) {
      Alert.alert(t('tickets.error'), 'Açıklama en az 5 karakter olmalıdır');
      return;
    }
    if (ticketDescription.trim().length > 2000) {
      Alert.alert(t('tickets.error'), 'Açıklama en fazla 2000 karakter olmalıdır');
      return;
    }

    try {
      const siteId = user?.siteId || '1';
      await ticketService.createTicket({
        title: ticketTitle,
        description: ticketDescription,
        category: ticketCategory,
        priority: ticketPriority,
      }, siteId);
      
      Alert.alert(t('tickets.success'), t('tickets.createSuccess'));
      setNewTicketModalVisible(false);
      resetNewTicketForm();
      loadTickets();
    } catch (error) {
      console.error('Create ticket error:', error);
      Alert.alert(t('tickets.error'), t('tickets.createError'));
    }
  };

  const resetNewTicketForm = () => {
    setTicketTitle('');
    setTicketDescription('');
    setTicketCategory('Bakım');
    setTicketPriority('medium');
    setTicketPhotos([]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AlertTriangle size={20} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('tickets.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {tickets.filter(t => {
              const status = t.status.toLowerCase();
              return status === 'open' || status === 'acik';
            }).length} {t('tickets.openRecords')}
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={() => setNewTicketModalVisible(true)}>
          <Plus size={16} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >

        <View style={styles.searchWrapper}>
          <Search size={16} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            placeholder={t('tickets.searchPlaceholder')}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tabsWrapper}>
          {(['all', 'open', 'in_progress', 'resolved'] as TabKey[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? t('common.all') : tab === 'open' ? t('tickets.open') : tab === 'in_progress' ? t('tickets.inProgress') : t('tickets.resolved')}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>{t('tickets.noTicketsFound')}</Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {filteredTickets.map(ticket => {
              const getStatusColor = () => {
                const status = ticket.status.toLowerCase();
                if (status === 'open' || status === 'acik') {
                  return { bg: colors.warningLight, color: colors.warning };
                } else if (status === 'in_progress' || status === 'devam_ediyor') {
                  return { bg: '#fef3c7', color: '#f59e0b' };
                } else if (status === 'resolved' || status === 'cozuldu') {
                  return { bg: colors.successLight, color: colors.success };
                }
                return { bg: colors.gray200, color: colors.textSecondary };
              };
              
              const getStatusLabel = () => {
                const status = ticket.status.toLowerCase();
                if (status === 'open' || status === 'acik') {
                  return t('tickets.open');
                } else if (status === 'in_progress' || status === 'devam_ediyor') {
                  return t('tickets.inProgress');
                } else if (status === 'resolved' || status === 'cozuldu') {
                  return t('tickets.resolved');
                }
                return ticket.status;
              };
              
              const statusColor = getStatusColor();
              
              return (
                <View key={ticket.id} style={styles.card}>
                  <View style={[styles.iconWrapper, { backgroundColor: statusColor.bg }]}>
                    <Wrench size={20} color={statusColor.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{ticket.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>{ticket.description}</Text>
                    <Text style={styles.cardDate}>{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.color }]}>
                      {getStatusLabel()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Yeni Arıza Bildirimi Modalı */}
      <Modal
        visible={newTicketModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewTicketModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('tickets.newTicket')}</Text>
                <Text style={styles.modalSubtitle}>{t('tickets.newTicketSubtitle')}</Text>
              </View>
              <Pressable onPress={() => { setNewTicketModalVisible(false); resetNewTicketForm(); }}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Başlık */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('tickets.titleLabel')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('tickets.titlePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={ticketTitle}
                  onChangeText={setTicketTitle}
                />
              </View>

              {/* Açıklama */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('tickets.descriptionLabel')}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Arıza detaylarını yazın (en az 5 karakter)..."
                  placeholderTextColor="#94a3b8"
                  value={ticketDescription}
                  onChangeText={setTicketDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.formHint}>
                  {ticketDescription.length}/2000 karakter (minimum 5)
                </Text>
              </View>

              {/* Kategori */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('tickets.categoryLabel')}</Text>
                <View style={styles.typeButtonsRow}>
                  {[
                    { value: 'Bakım', label: 'Bakım' },
                    { value: 'Temizlik', label: 'Temizlik' },
                    { value: 'Güvenlik', label: 'Güvenlik' },
                    { value: 'Diğer', label: 'Diğer' }
                  ].map((cat) => (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.typeButton,
                        ticketCategory === cat.value && styles.typeButtonActive
                      ]}
                      onPress={() => setTicketCategory(cat.value)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        ticketCategory === cat.value && styles.typeButtonTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Öncelik */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('tickets.priorityLabel')}</Text>
                <View style={styles.typeButtonsRow}>
                  {[
                    { value: 'low', label: t('tickets.low') },
                    { value: 'medium', label: t('tickets.medium') },
                    { value: 'high', label: t('tickets.high') }
                  ].map((p) => (
                    <Pressable
                      key={p.value}
                      style={[
                        styles.typeButton,
                        ticketPriority === p.value && styles.typeButtonActive
                      ]}
                      onPress={() => setTicketPriority(p.value as 'low' | 'medium' | 'high')}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        ticketPriority === p.value && styles.typeButtonTextActive
                      ]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Fotoğraflar */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('tickets.photosLabel')}</Text>
                
                <View style={styles.photoButtons}>
                  <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                    <Camera size={20} color={colors.primary} />
                    <Text style={styles.photoButtonText}>{t('tickets.takePhoto')}</Text>
                  </Pressable>
                  <Pressable style={styles.photoButton} onPress={handlePickImage}>
                    <ImageIcon size={20} color={colors.primary} />
                    <Text style={styles.photoButtonText}>{t('tickets.selectFromGallery')}</Text>
                  </Pressable>
                </View>

                <Text style={styles.formHint}>{ticketPhotos.length}/5 {t('tickets.photoHint')}</Text>

                {/* Fotoğraf Önizlemeleri */}
                {ticketPhotos.length > 0 && (
                  <View style={styles.photoPreviewGrid}>
                    {ticketPhotos.map((photo, index) => (
                      <View key={index} style={styles.photoPreviewItem}>
                        <Image source={{ uri: photo }} style={styles.photoPreviewImage} />
                        <Pressable 
                          style={styles.photoRemoveButton}
                          onPress={() => handleRemovePhoto(index)}
                        >
                          <X size={16} color="#ffffff" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable 
                style={styles.modalCancelButton}
                onPress={() => { setNewTicketModalVisible(false); resetNewTicketForm(); }}
              >
                <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable 
                style={styles.modalCreateButton}
                onPress={handleCreateTicket}
              >
                <Text style={styles.modalCreateButtonText}>{t('tickets.create')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.white, 
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  headerIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: borderRadius.icon, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  primaryButton: { 
    width: 40, 
    height: 40, 
    borderRadius: borderRadius.icon, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.screenPaddingHorizontal, paddingVertical: spacing.lg, paddingBottom: 100, rowGap: spacing.sectionGap },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 10, top: '50%', marginTop: -8 },
  searchInput: { borderRadius: 999, backgroundColor: '#f3f4f6', paddingLeft: 32, paddingRight: 12, paddingVertical: 8, fontSize: 14, color: colors.textPrimary },
  tabsWrapper: { flexDirection: 'row', borderRadius: 999, backgroundColor: '#f3f4f6', padding: 3 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 999 },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 12, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '500' },
  listSpace: { rowGap: 10 },
  card: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.border, 
    backgroundColor: colors.white, 
    padding: 12,
    alignItems: 'flex-start',
  },
  iconWrapper: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
    flexShrink: 0,
  },
  cardInfo: { 
    flex: 1,
    marginRight: 12,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: { 
    fontSize: 13, 
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardDate: { 
    fontSize: 11, 
    color: colors.textTertiary,
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 8, fontSize: 13, color: colors.textSecondary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary },
  modalBody: { padding: 20, maxHeight: 500 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.white },
  formTextArea: { height: 100, textAlignVertical: 'top' },
  formHint: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  formSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, backgroundColor: colors.white },
  formSelectText: { fontSize: 14, color: colors.textPrimary },
  typeButtonsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeButton: { flex: 1, minWidth: '22%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: colors.white, alignItems: 'center' },
  typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeButtonTextActive: { color: colors.white },
  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  photoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingVertical: 12, backgroundColor: colors.white },
  photoButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  photoPreviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoPreviewItem: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoPreviewImage: { width: '100%', height: '100%' },
  photoRemoveButton: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  modalCancelButtonText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  modalCreateButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  modalCreateButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
});

export default ResidentTickets;
