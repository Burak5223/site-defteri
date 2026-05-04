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
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Phone, 
  Mail, 
  Home, 
  Crown, 
  X, 
  Building2,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { residentService, Resident, InviteResidentRequest } from '../../services/resident.service';
import { siteService, Block, CreateBlockRequest } from '../../services/site.service';
import { dueService } from '../../services/due.service';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

type ViewMode = 'blocks' | 'residents';

const AdminResidents = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    name: '',
    totalFloors: '',
  });

  // Form state
  const [formData, setFormData] = useState<InviteResidentRequest>({
    fullName: '',
    email: '',
    phone: '',
    apartmentNumber: '',
    residentType: 'owner',
  });
  const [userRole, setUserRole] = useState<'resident' | 'cleaning' | 'security'>('resident');
  const [siteName, setSiteName] = useState('site');

  useEffect(() => {
    loadData();
    loadSiteName();
  }, [user?.siteId]);

  const loadSiteName = async () => {
    if (!user?.siteId) return;
    try {
      const site = await siteService.getSiteById(user.siteId);
      setSiteName(site.name || 'site');
    } catch (error) {
      console.log('Site adı alınamadı');
    }
  };

  // E-posta otomatik oluşturma
  const generateEmail = (fullName: string, site: string) => {
    const cleanName = fullName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    const cleanSite = site
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    return `${cleanName}@${cleanSite}.com`;
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      fullName: name,
      email: generateEmail(name, siteName),
    });
  };

  const loadData = async () => {
    if (!user?.siteId) {
      console.log('No siteId found in user:', user);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log('Loading data for siteId:', user.siteId);

    try {
      const [residentsData, blocksData] = await Promise.all([
        residentService.getResidents(),
        siteService.getSiteBlocks(user.siteId),
      ]);
      console.log('Blocks loaded:', blocksData);
      setResidents(residentsData);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert(t('common.error'), t('common.loading') + ' ' + t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBlockPress = (block: Block) => {
    setSelectedBlock(block);
    setViewMode('residents');
  };

  const handleBackToBlocks = () => {
    setSelectedBlock(null);
    setViewMode('blocks');
    setSearchQuery('');
  };

  const getBlockResidents = () => {
    if (!selectedBlock) return [];
    return residents.filter(r => r.blockName === selectedBlock.name);
  };

  const filteredResidents = getBlockResidents().filter(resident =>
    resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.phone.includes(searchQuery)
  );

  const handleInvite = async () => {
    // Validasyon
    if (!formData.fullName || !formData.email) {
      Alert.alert('Hata', 'Lütfen isim ve e-posta alanlarını doldurun');
      return;
    }

    // Sakin için daire no zorunlu
    if (userRole === 'resident' && !formData.apartmentNumber) {
      Alert.alert('Hata', 'Lütfen daire numarasını girin');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    try {
      // Rol bazlı veri hazırlama
      const inviteData: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      if (userRole === 'resident') {
        inviteData.apartmentNumber = formData.apartmentNumber;
        inviteData.residentType = formData.residentType;
      } else {
        // Temizlikçi veya Güvenlik için rol bilgisi ekle
        inviteData.role = userRole === 'cleaning' ? 'CLEANING' : 'SECURITY';
      }

      await residentService.inviteResident(inviteData, user.siteId);
      Alert.alert('Başarılı', 'Davet gönderildi');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert('Hata', 'Davet gönderilemedi');
    }
  };

  const handleEdit = async () => {
    if (!selectedResident || !formData.fullName || !formData.email) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      // Update basic user info
      await residentService.updateResident(selectedResident.id, formData);
      
      // Check if apartment changed
      const selectedApartment = apartments.find(apt => apt.apartmentNumber === formData.apartmentNumber);
      if (selectedApartment && selectedApartment.id !== selectedResident.apartmentId) {
        // Apartment changed - call changeApartment endpoint
        await residentService.changeApartment(
          selectedResident.id,
          selectedApartment.id,
          formData.residentType || 'owner'
        );
        Alert.alert(t('common.success'), 'Kullanıcı bilgileri ve daire güncellendi');
      } else {
        Alert.alert(t('common.success'), t('residents.updateSuccess'));
      }
      
      setShowEditModal(false);
      setSelectedResident(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Hata', 'Güncelleme başarısız');
    }
  };

  const handleRemove = async (id: string) => {
    Alert.alert(
      t('residents.removeResident'),
      t('residents.removeConfirm'),
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await residentService.removeResident(id);
              Alert.alert(t('common.success'), t('residents.removeSuccess'));
              loadData();
            } catch (error) {
              Alert.alert(t('common.error'), t('residents.removeError'));
            }
          },
        },
      ]
    );
  };

  const handleRemoveFromApartment = async (resident: Resident) => {
    if (!resident.apartmentId) {
      Alert.alert('Hata', 'Bu kullanıcının daire bilgisi bulunamadı');
      return;
    }

    Alert.alert(
      'Daireden Çıkar',
      `${resident.fullName} isimli kullanıcıyı ${resident.apartmentNumber} numaralı daireden çıkarmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await residentService.removeResidentFromApartment(resident.id, resident.apartmentId!);
              Alert.alert('Başarılı', 'Kullanıcı daireden çıkarıldı');
              loadData();
            } catch (error) {
              console.error('Remove from apartment error:', error);
              Alert.alert('Hata', 'Kullanıcı daireden çıkarılamadı');
            }
          },
        },
      ]
    );
  };

  const openEditModal = async (resident: Resident) => {
    setSelectedResident(resident);
    setFormData({
      fullName: resident.fullName,
      email: resident.email,
      phone: resident.phone,
      apartmentNumber: resident.apartmentNumber || '',
      residentType: resident.residentType,
    });
    
    // Load apartments for dropdown
    if (user?.siteId) {
      try {
        const apartmentsData = await dueService.getApartments(user.siteId);
        setApartments(apartmentsData);
      } catch (error) {
        console.error('Failed to load apartments:', error);
      }
    }
    
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      apartmentNumber: '',
      residentType: 'owner',
    });
    setUserRole('resident');
  };

  const handleAddBlock = async () => {
    if (!blockFormData.name.trim()) {
      Alert.alert('Hata', 'Lütfen blok adı girin');
      return;
    }

    if (!blockFormData.totalFloors || parseInt(blockFormData.totalFloors) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir kat sayısı girin');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    try {
      setLoading(true);
      await siteService.createBlock(user.siteId, { 
        name: blockFormData.name.trim(),
        totalFloors: parseInt(blockFormData.totalFloors),
      });
      
      // Verileri yeniden yükle
      await loadData();
      
      // Modal'ı kapat ve formu temizle
      setShowAddBlockModal(false);
      setBlockFormData({ name: '', totalFloors: '' });
      
      Alert.alert('Başarılı', 'Blok eklendi');
    } catch (error) {
      console.error('Add block error:', error);
      Alert.alert('Hata', 'Blok eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Blocks View
  if (viewMode === 'blocks') {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bloklar</Text>
            <Text style={styles.headerSubtitle}>{blocks.length} blok</Text>
          </View>

          <View style={styles.blocksList}>
            {blocks.map(block => {
              const blockResidents = residents.filter(r => r.blockName === block.name);
              const ownerCount = blockResidents.filter(r => r.residentType === 'owner').length;
              const tenantCount = blockResidents.filter(r => r.residentType === 'tenant').length;

              return (
                <Pressable
                  key={block.id}
                  style={styles.blockCard}
                  onPress={() => handleBlockPress(block)}
                >
                  <View style={styles.blockIcon}>
                    <Building2 size={24} color={colors.primary} />
                  </View>
                  <View style={styles.blockInfo}>
                    <Text style={styles.blockName}>{block.name} Blok</Text>
                    <Text style={styles.blockStats}>
                      {blockResidents.length} sakin • {ownerCount} malik • {tenantCount} kiracı
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>

          {blocks.length === 0 && (
            <View style={styles.emptyState}>
              <Building2 size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyText}>Blok bulunamadı</Text>
            </View>
          )}
        </ScrollView>

        {/* Add Block Button */}
        <View style={styles.floatingButtonContainer}>
          <Pressable style={styles.floatingButton} onPress={() => setShowAddBlockModal(true)}>
            <Building2 size={20} color={colors.white} />
            <Text style={styles.floatingButtonText}>Yeni Blok Ekle</Text>
          </Pressable>
        </View>

        {/* Add Block Modal */}
        <Modal 
          visible={showAddBlockModal} 
          transparent 
          animationType="slide" 
          onRequestClose={() => {
            setShowAddBlockModal(false);
            setBlockFormData({ name: '', totalFloors: '' });
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Blok Ekle</Text>
                <Pressable onPress={() => {
                  setShowAddBlockModal(false);
                  setBlockFormData({ name: '', totalFloors: '' });
                }}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Blok Adı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: A, B, C veya 1, 2, 3"
                    placeholderTextColor={colors.textSecondary}
                    value={blockFormData.name}
                    onChangeText={(text) => setBlockFormData({ ...blockFormData, name: text })}
                    autoFocus
                  />
                  <Text style={styles.helperText}>
                    Blok adı genellikle tek harf veya rakam olur (A, B, C veya 1, 2, 3)
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Toplam Daire Sayısı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={blockFormData.totalFloors}
                    onChangeText={(text) => setBlockFormData({ ...blockFormData, totalFloors: text })}
                  />
                  <Text style={styles.helperText}>
                    Bloktaki toplam daire sayısını girin
                  </Text>
                </View>

                <Pressable style={styles.submitButton} onPress={handleAddBlock}>
                  <Building2 size={16} color={colors.white} />
                  <Text style={styles.submitButtonText}>Blok Ekle</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Residents View
  const blockResidents = getBlockResidents();
  const ownerCount = blockResidents.filter(r => r.residentType === 'owner').length;
  const tenantCount = blockResidents.filter(r => r.residentType === 'tenant').length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header with Back Button */}
        <Pressable style={styles.backButton} onPress={handleBackToBlocks}>
          <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.backButtonText}>Bloklar</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{selectedBlock?.name} Blok Sakinleri</Text>
          <Text style={styles.headerSubtitle}>{blockResidents.length} sakin</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{blockResidents.length}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{ownerCount}</Text>
            <Text style={styles.statLabel}>Malik</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.info }]}>{tenantCount}</Text>
            <Text style={styles.statLabel}>Kiracı</Text>
          </View>
        </View>

        {/* Search and Actions */}
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
          <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <UserPlus size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Ekle</Text>
          </Pressable>
        </View>

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
                  </View>
                  {resident.apartmentNumber && (
                    <View style={styles.apartmentInfo}>
                      <Home size={12} color={colors.textSecondary} />
                      <Text style={styles.apartmentText}>Daire {resident.apartmentNumber}</Text>
                    </View>
                  )}
                  <View style={styles.contactInfo}>
                    <Phone size={12} color={colors.textSecondary} />
                    <Text style={styles.contactText}>{resident.phone}</Text>
                  </View>
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
                    onPress={() => openEditModal(resident)}
                  >
                    <Edit size={14} color={colors.textPrimary} />
                    <Text style={styles.actionMenuText}>Düzenle</Text>
                  </Pressable>
                  {resident.apartmentId && (
                    <Pressable
                      style={styles.actionMenuItem}
                      onPress={() => {
                        handleRemoveFromApartment(resident);
                        setShowActionMenu(null);
                      }}
                    >
                      <Home size={14} color={colors.warning} />
                      <Text style={[styles.actionMenuText, { color: colors.warning }]}>Daireden Çıkar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionMenuItem}
                    onPress={() => {
                      handleRemove(resident.id);
                      setShowActionMenu(null);
                    }}
                  >
                    <Trash2 size={14} color={colors.error} />
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

      {/* Add/Edit Modal */}
      <Modal 
        visible={showAddModal || showEditModal} 
        transparent 
        animationType="slide" 
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showEditModal ? 'Sakin Düzenle' : 'Sakin Davet Et'}
              </Text>
              <Pressable onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {/* Rol Seçimi */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kullanıcı Rolü</Text>
                <View style={styles.roleGroup}>
                  <Pressable
                    style={[styles.roleButton, userRole === 'resident' && styles.roleButtonActive]}
                    onPress={() => setUserRole('resident')}
                  >
                    <Text style={[styles.roleText, userRole === 'resident' && styles.roleTextActive]}>
                      Sakin
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleButton, userRole === 'cleaning' && styles.roleButtonActive]}
                    onPress={() => setUserRole('cleaning')}
                  >
                    <Text style={[styles.roleText, userRole === 'cleaning' && styles.roleTextActive]}>
                      Temizlikçi
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleButton, userRole === 'security' && styles.roleButtonActive]}
                    onPress={() => setUserRole('security')}
                  >
                    <Text style={[styles.roleText, userRole === 'security' && styles.roleTextActive]}>
                      Güvenlik
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ad Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Ahmet Yılmaz"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.fullName}
                  onChangeText={handleNameChange}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>E-posta (Otomatik)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="E-posta otomatik oluşturulacak"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.email}
                  editable={false}
                />
                <Text style={styles.helperText}>
                  E-posta isminize göre otomatik oluşturulur
                </Text>
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

              {/* Sadece Sakin için Daire No ve Tip */}
              {userRole === 'resident' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Daire No</Text>
                    {showEditModal && apartments.length > 0 ? (
                      <View>
                        <Text style={styles.helperText}>Mevcut: {selectedResident?.apartmentNumber || 'Yok'}</Text>
                        <ScrollView style={styles.apartmentList} nestedScrollEnabled>
                          {apartments.map((apt) => (
                            <Pressable
                              key={apt.id}
                              style={[
                                styles.apartmentItem,
                                formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemSelected
                              ]}
                              onPress={() => setFormData({ ...formData, apartmentNumber: apt.apartmentNumber })}
                            >
                              <Text style={[
                                styles.apartmentItemText,
                                formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemTextSelected
                              ]}>
                                Daire {apt.apartmentNumber} - {apt.status === 'bos' ? 'Boş' : 'Dolu'}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    ) : (
                      <TextInput
                        style={styles.input}
                        placeholder="Örn: 12"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={formData.apartmentNumber}
                        onChangeText={(text) => setFormData({ ...formData, apartmentNumber: text })}
                      />
                    )}
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
                </>
              )}

              <Pressable 
                style={styles.submitButton} 
                onPress={showEditModal ? handleEdit : handleInvite}
              >
                {showEditModal ? <Edit size={16} color={colors.white} /> : <UserPlus size={16} color={colors.white} />}
                <Text style={styles.submitButtonText}>
                  {showEditModal ? 'Güncelle' : 'Davet Gönder'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  
  header: { marginBottom: spacing.lg },
  headerTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 4 },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backButtonText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.primary, marginLeft: 4 },
  
  blocksList: { gap: spacing.md },
  blockCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.card, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  blockIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: borderRadius.icon, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  blockInfo: { flex: 1 },
  blockName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  blockStats: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { 
    flex: 1, 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.card, 
    padding: spacing.md, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  statLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  searchInputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.input, 
    borderWidth: 1, 
    borderColor: colors.border, 
    paddingHorizontal: spacing.md 
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 40, fontSize: fontSize.inputText, color: colors.textPrimary },
  addButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 40, 
    backgroundColor: colors.primary, 
    borderRadius: borderRadius.button, 
    justifyContent: 'center' 
  },
  actionButtonText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  
  residentsList: { gap: spacing.sm },
  residentCard: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.card, 
    padding: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  residentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: borderRadius.full, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: colors.primary + '20' 
  },
  avatarText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.primary },
  residentInfo: { flex: 1 },
  residentNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  residentName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgePrimary: { backgroundColor: colors.primary },
  badgeSecondary: { backgroundColor: colors.gray200 },
  badgeText: { fontSize: 10, fontWeight: fontWeight.semibold },
  badgeTextPrimary: { color: colors.white },
  badgeTextSecondary: { color: colors.textSecondary },
  apartmentInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  apartmentText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  contactText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  menuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  
  actionMenu: { 
    marginTop: spacing.md, 
    paddingTop: spacing.md, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  actionMenuItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm 
  },
  actionMenuText: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary },
  
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: spacing.md },
  
  floatingButtonContainer: { 
    position: 'absolute', 
    bottom: spacing.xl, 
    left: spacing.screenPaddingHorizontal, 
    right: spacing.screenPaddingHorizontal 
  },
  floatingButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary, 
    padding: spacing.lg, 
    borderRadius: borderRadius.button,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: { 
    fontSize: fontSize.buttonText, 
    fontWeight: fontWeight.semibold, 
    color: colors.white 
  },
  
  helperText: { 
    fontSize: fontSize.cardMeta, 
    color: colors.textSecondary, 
    marginTop: spacing.sm,
    fontStyle: 'italic' 
  },
  
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: colors.white, 
    borderTopLeftRadius: borderRadius.cardLg, 
    borderTopRightRadius: borderRadius.cardLg, 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalScroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  
  formGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.cardSubtitle, fontWeight: fontWeight.medium, color: colors.textPrimary, marginBottom: spacing.xs },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: borderRadius.input, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.sm, 
    fontSize: fontSize.inputText, 
    color: colors.textPrimary 
  },
  roleGroup: { flexDirection: 'row', gap: spacing.xs },
  roleButton: { 
    flex: 1, 
    paddingVertical: spacing.sm, 
    borderRadius: borderRadius.button, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    backgroundColor: colors.white 
  },
  roleButtonActive: { backgroundColor: colors.success, borderColor: colors.success },
  roleText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  roleTextActive: { color: colors.white },
  radioGroup: { flexDirection: 'row', gap: spacing.xs },
  radioButton: { 
    flex: 1, 
    paddingVertical: spacing.sm, 
    borderRadius: borderRadius.button, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    backgroundColor: colors.white 
  },
  radioButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  radioTextActive: { color: colors.white },
  disabledInput: {
    backgroundColor: colors.gray100,
    color: colors.gray500,
  },
  apartmentList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    marginTop: spacing.xs,
  },
  apartmentItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  apartmentItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  apartmentItemText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textPrimary,
  },
  apartmentItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  submitButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary, 
    padding: spacing.md, 
    borderRadius: borderRadius.button, 
    marginTop: spacing.lg,
    marginBottom: spacing.md
  },
  submitButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
});

export default AdminResidents;
