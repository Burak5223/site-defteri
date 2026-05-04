import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Search, Filter, UserPlus, MoreVertical, Phone, Mail, Home, Crown, X, Building2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { residentService, Resident, InviteResidentRequest } from '../../services/resident.service';
import { siteService, Block } from '../../services/site.service';
import { useAuth } from '../../context/AuthContext';

const AdminResidents = () => {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owner' | 'tenant'>('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<InviteResidentRequest>({
    fullName: '',
    email: '',
    phone: '',
    apartmentNumber: '',
    residentType: 'owner',
  });

  useEffect(() => {
    loadData();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadData = async () => {
    if (!user?.siteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [residentsData, blocksData] = await Promise.all([
        residentService.getResidents(),
        siteService.getSiteBlocks(user.siteId),
      ]);
      setResidents(residentsData);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Hata', 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredResidents = residents.filter(resident => {
    const matchesSearch = 
      resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || resident.residentType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleInvite = async () => {
    if (!formData.fullName || !formData.email || !formData.apartmentNumber) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      await residentService.inviteResident(formData);
      Alert.alert('Başarılı', 'Davet gönderildi');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert('Hata', 'Davet gönderilemedi');
    }
  };

  const handleRemove = async (id: string) => {
    Alert.alert(
      'Sakini Kaldır',
      'Bu sakini kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await residentService.removeResident(id);
              Alert.alert('Başarılı', 'Sakin kaldırıldı');
              loadData();
            } catch (error) {
              Alert.alert('Hata', 'Sakin kaldırılamadı');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = (resident: Resident) => {
    Alert.prompt(
      'Mesaj Gönder',
      `${resident.fullName} adlı sakine mesaj gönderin`,
      async (text) => {
        if (text) {
          try {
            await residentService.sendMessage(resident.id, text);
            Alert.alert('Başarılı', 'Mesaj gönderildi');
          } catch (error) {
            Alert.alert('Hata', 'Mesaj gönderilemedi');
          }
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      apartmentNumber: '',
      residentType: 'owner',
    });
  };

  const ownerCount = residents.filter(r => r.residentType === 'owner').length;
  const tenantCount = residents.filter(r => r.residentType === 'tenant').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{residents.length}</Text>
            <Text style={styles.statLabel}>Toplam Sakin</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{ownerCount}</Text>
            <Text style={styles.statLabel}>Kat Maliki</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.info }]}>{tenantCount}</Text>
            <Text style={styles.statLabel}>Kiracı</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Sakin ara..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.filterButton} onPress={() => setShowFilterMenu(true)}>
            <Filter size={16} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <UserPlus size={16} color={colors.white} />
          </Pressable>
        </View>

        {/* Filter Badge */}
        {filterType !== 'all' && (
          <View style={styles.filterBadgeContainer}>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {filterType === 'owner' ? 'Kat Malikleri' : 'Kiracılar'}
              </Text>
              <Pressable onPress={() => setFilterType('all')}>
                <X size={12} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Residents List */}
        <View style={styles.residentsList}>
          {filteredResidents.map(resident => (
            <View key={resident.id} style={styles.residentCard}>
              <View style={styles.residentHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {resident.fullName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.residentInfo}>
                  <View style={styles.residentNameRow}>
                    <Text style={styles.residentName}>{resident.fullName}</Text>
                    {resident.residentType === 'owner' && (
                      <Crown size={14} color={colors.warning} />
                    )}
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={[
                      styles.badge,
                      resident.residentType === 'owner' ? styles.badgePrimary : styles.badgeSecondary
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        resident.residentType === 'owner' ? styles.badgeTextPrimary : styles.badgeTextSecondary
                      ]}>
                        {resident.residentType === 'owner' ? 'Kat Maliki' : 'Kiracı'}
                      </Text>
                    </View>
                    <View style={[
                      styles.badge,
                      resident.status === 'active' ? styles.badgeSuccess : styles.badgeSecondary
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        resident.status === 'active' ? styles.badgeTextSuccess : styles.badgeTextSecondary
                      ]}>
                        {resident.status === 'active' ? 'Aktif' : resident.status === 'pending' ? 'Bekliyor' : 'Pasif'}
                      </Text>
                    </View>
                  </View>
                  {resident.apartmentNumber && (
                    <View style={styles.apartmentInfo}>
                      <Home size={12} color={colors.textSecondary} />
                      <Text style={styles.apartmentText}>
                        {resident.blockName} - Daire {resident.apartmentNumber}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={styles.menuButton}
                  onPress={() => setShowActionMenu(showActionMenu === resident.id ? null : resident.id)}
                >
                  <MoreVertical size={16} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Action Menu */}
              {showActionMenu === resident.id && (
                <View style={styles.actionMenu}>
                  <Pressable
                    style={styles.actionMenuItem}
                    onPress={() => {
                      setSelectedResident(resident);
                      setShowActionMenu(null);
                    }}
                  >
                    <Text style={styles.actionMenuText}>Detay Görüntüle</Text>
                  </Pressable>
                  <Pressable style={styles.actionMenuItem}>
                    <Text style={styles.actionMenuText}>Düzenle</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionMenuItem}
                    onPress={() => {
                      handleSendMessage(resident);
                      setShowActionMenu(null);
                    }}
                  >
                    <Text style={styles.actionMenuText}>Mesaj Gönder</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionMenuItem}
                    onPress={() => {
                      handleRemove(resident.id);
                      setShowActionMenu(null);
                    }}
                  >
                    <Text style={[styles.actionMenuText, { color: colors.error }]}>Kaldır</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredResidents.length === 0 && (
          <View style={styles.emptyState}>
            <Building2 size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>Sakin bulunamadı</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedResident} transparent animationType="slide" onRequestClose={() => setSelectedResident(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sakin Detayı</Text>
              <Pressable onPress={() => setSelectedResident(null)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {selectedResident && (
              <ScrollView style={styles.modalScroll}>
                {/* Profile */}
                <View style={styles.profileSection}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>
                      {selectedResident.fullName.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>{selectedResident.fullName}</Text>
                  <View style={styles.profileBadges}>
                    <View style={[
                      styles.badge,
                      selectedResident.residentType === 'owner' ? styles.badgePrimary : styles.badgeSecondary
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        selectedResident.residentType === 'owner' ? styles.badgeTextPrimary : styles.badgeTextSecondary
                      ]}>
                        {selectedResident.residentType === 'owner' ? 'Kat Maliki' : 'Kiracı'}
                      </Text>
                    </View>
                    {selectedResident.residentType === 'owner' && (
                      <Crown size={16} color={colors.warning} />
                    )}
                  </View>
                </View>

                {/* Contact Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>İLETİŞİM BİLGİLERİ</Text>
                  <View style={styles.infoCard}>
                    <Mail size={16} color={colors.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>E-posta</Text>
                      <Text style={styles.infoValue}>{selectedResident.email}</Text>
                    </View>
                  </View>
                  <View style={styles.infoCard}>
                    <Phone size={16} color={colors.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Telefon</Text>
                      <Text style={styles.infoValue}>{selectedResident.phone}</Text>
                    </View>
                  </View>
                </View>

                {/* Apartment Info */}
                {selectedResident.apartmentNumber && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DAİRE BİLGİLERİ</Text>
                    <View style={styles.infoCard}>
                      <Building2 size={16} color={colors.textSecondary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Blok</Text>
                        <Text style={styles.infoValue}>{selectedResident.blockName}</Text>
                      </View>
                    </View>
                    <View style={styles.infoCard}>
                      <Home size={16} color={colors.textSecondary} />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Daire No</Text>
                        <Text style={styles.infoValue}>{selectedResident.apartmentNumber}</Text>
                      </View>
                    </View>
                    {selectedResident.floor !== undefined && selectedResident.apartmentType && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoCardSmall}>
                          <Text style={styles.infoLabel}>Kat</Text>
                          <Text style={styles.infoValue}>{selectedResident.floor}</Text>
                        </View>
                        <View style={styles.infoCardSmall}>
                          <Text style={styles.infoLabel}>Tip</Text>
                          <Text style={styles.infoValue}>{selectedResident.apartmentType}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>DURUM</Text>
                  <View style={styles.infoCard}>
                    <View style={[
                      styles.statusDot,
                      selectedResident.status === 'active' ? styles.statusDotActive :
                      selectedResident.status === 'pending' ? styles.statusDotPending :
                      styles.statusDotInactive
                    ]} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoValue}>
                        {selectedResident.status === 'active' ? 'Aktif' :
                         selectedResident.status === 'pending' ? 'Onay Bekliyor' : 'Pasif'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                  <Pressable style={styles.actionButton}>
                    <Phone size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Ara</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      handleSendMessage(selectedResident);
                      setSelectedResident(null);
                    }}
                  >
                    <Mail size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Mesaj</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sakin Davet Et</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ad Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Ahmet Yılmaz"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+90 555 123 4567"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Daire No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 12"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.apartmentNumber}
                  onChangeText={(text) => setFormData({ ...formData, apartmentNumber: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Sakin Tipi</Text>
                <View style={styles.radioGroup}>
                  <Pressable
                    style={[styles.radioButton, formData.residentType === 'owner' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, residentType: 'owner' })}
                  >
                    <Text style={[styles.radioText, formData.residentType === 'owner' && styles.radioTextActive]}>
                      Kat Maliki
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.radioButton, formData.residentType === 'tenant' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, residentType: 'tenant' })}
                  >
                    <Text style={[styles.radioText, formData.residentType === 'tenant' && styles.radioTextActive]}>
                      Kiracı
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.submitButton} onPress={handleInvite}>
                <UserPlus size={16} color={colors.white} />
                <Text style={styles.submitButtonText}>Davet Gönder</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Menu */}
      <Modal visible={showFilterMenu} transparent animationType="fade" onRequestClose={() => setShowFilterMenu(false)}>
        <Pressable style={styles.filterMenuBackdrop} onPress={() => setShowFilterMenu(false)}>
          <View style={styles.filterMenuContent}>
            <Pressable
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterType('all');
                setShowFilterMenu(false);
              }}
            >
              <Text style={styles.filterMenuText}>Tümü</Text>
            </Pressable>
            <Pressable
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterType('owner');
                setShowFilterMenu(false);
              }}
            >
              <Text style={styles.filterMenuText}>Kat Malikleri</Text>
            </Pressable>
            <Pressable
              style={styles.filterMenuItem}
              onPress={() => {
                setFilterType('tenant');
                setShowFilterMenu(false);
              }}
            >
              <Text style={styles.filterMenuText}>Kiracılar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  statsContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  statLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  searchContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 40, fontSize: fontSize.inputText, color: colors.textPrimary },
  filterButton: { width: 40, height: 40, backgroundColor: colors.white, borderRadius: borderRadius.button, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  addButton: { width: 40, height: 40, backgroundColor: colors.primary, borderRadius: borderRadius.button, alignItems: 'center', justifyContent: 'center' },
  filterBadgeContainer: { marginBottom: spacing.md },
  filterBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.gray200, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, alignSelf: 'flex-start' },
  filterBadgeText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  residentsList: { gap: spacing.sm },
  residentCard: { backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  residentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary + '20' },
  avatarText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.primary },
  residentInfo: { flex: 1 },
  residentNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  residentName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgePrimary: { backgroundColor: colors.primary },
  badgeSecondary: { backgroundColor: colors.gray200 },
  badgeSuccess: { backgroundColor: colors.successLight },
  badgeText: { fontSize: 10, fontWeight: fontWeight.semibold },
  badgeTextPrimary: { color: colors.white },
  badgeTextSecondary: { color: colors.textSecondary },
  badgeTextSuccess: { color: colors.successDark },
  apartmentInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  apartmentText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  menuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  actionMenu: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionMenuItem: { paddingVertical: spacing.sm },
  actionMenuText: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: spacing.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalScroll: { padding: spacing.xl },
  profileSection: { alignItems: 'center', paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xl },
  avatarLarge: { width: 64, height: 64, borderRadius: borderRadius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary + '30', marginBottom: spacing.md },
  avatarTextLarge: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  profileName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  profileBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.5 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.gray100, borderRadius: borderRadius.card, padding: spacing.md, marginBottom: spacing.sm },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.cardSubtitle, fontWeight: fontWeight.medium, color: colors.textPrimary, marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: spacing.sm },
  infoCardSmall: { flex: 1, backgroundColor: colors.gray100, borderRadius: borderRadius.card, padding: spacing.md },
  statusDot: { width: 8, height: 8, borderRadius: borderRadius.full },
  statusDotActive: { backgroundColor: colors.success },
  statusDotPending: { backgroundColor: colors.warning },
  statusDotInactive: { backgroundColor: colors.gray400 },
  actionButtons: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  actionButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.primary },
  formGroup: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, padding: spacing.md, fontSize: fontSize.inputText, color: colors.textPrimary },
  radioGroup: { flexDirection: 'row', gap: spacing.sm },
  radioButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.button, backgroundColor: colors.gray100, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  radioButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  radioText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  radioTextActive: { color: colors.primary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button, marginTop: spacing.md },
  submitButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  filterMenuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', alignItems: 'flex-end', padding: spacing.md },
  filterMenuContent: { backgroundColor: colors.white, borderRadius: borderRadius.card, minWidth: 150, overflow: 'hidden' },
  filterMenuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterMenuText: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary },
});

export default AdminResidents;
