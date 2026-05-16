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
import { useTheme } from '../../context/ThemeContext';
import { residentService, Resident, InviteResidentRequest } from '../../services/resident.service';
import { siteService, Block, CreateBlockRequest, CreateApartmentRequest } from '../../services/site.service';
import { useAuth } from '../../context/AuthContext';

type ViewMode = 'blocks' | 'apartments' | 'residents';

const AdminResidents = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);
  const [apartments, setApartments] = useState<any[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showDeleteBlockModal, setShowDeleteBlockModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);
  const [showAddApartmentModal, setShowAddApartmentModal] = useState(false);
  const [showDeleteApartmentModal, setShowDeleteApartmentModal] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<any | null>(null);
  const [showAssignApartmentModal, setShowAssignApartmentModal] = useState(false);
  const [selectedResidentForAssignment, setSelectedResidentForAssignment] = useState<any | null>(null);
  const [assignmentApartmentId, setAssignmentApartmentId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'owner' | 'tenant'>('owner');
  const [allApartments, setAllApartments] = useState<any[]>([]);
  const [blockFormData, setBlockFormData] = useState({
    name: '',
    totalFloors: '',
  });
  const [apartmentFormData, setApartmentFormData] = useState({
    unitNumber: '',
    floor: '',
  });

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
  }, [user?.siteId]);

  useEffect(() => {
    if (blocks.length > 0) {
      loadAllApartments();
    }
  }, [blocks]);

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

  const handleBlockPress = async (block: Block) => {
    setSelectedBlock(block);
    setLoading(true);
    try {
      const apartmentsData = await residentService.getApartmentsByBlock(block.id);
      setApartments(apartmentsData);
      setViewMode('apartments');
    } catch (error) {
      console.error('Load apartments error:', error);
      Alert.alert('Hata', 'Daireler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBlocks = () => {
    setSelectedBlock(null);
    setSelectedApartment(null);
    setApartments([]);
    setViewMode('blocks');
    setSearchQuery('');
  };

  const handleApartmentPress = (apartment: any) => {
    setSelectedApartment(apartment);
    setViewMode('residents');
  };

  const handleBackToApartments = () => {
    setSelectedApartment(null);
    setViewMode('apartments');
    setSearchQuery('');
  };

  const getBlockResidents = () => {
    if (!selectedBlock) return [];
    return residents.filter(r => r.blockName === selectedBlock.name);
  };

  const handleInvite = async () => {
    if (!formData.fullName || !formData.email || !formData.apartmentNumber) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    try {
      await residentService.inviteResident(formData, user.siteId);
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
      await residentService.updateResident(selectedResident.id, formData);
      Alert.alert('Başarılı', 'Sakin güncellendi');
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

  const openEditModal = (resident: Resident) => {
    setSelectedResident(resident);
    setFormData({
      fullName: resident.fullName,
      email: resident.email,
      phone: resident.phone,
      apartmentNumber: resident.apartmentNumber || '',
      residentType: resident.residentType,
    });
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
      await siteService.createBlock(user.siteId, { 
        name: blockFormData.name.trim(),
        totalFloors: parseInt(blockFormData.totalFloors),
      });
      Alert.alert('Başarılı', 'Blok eklendi');
      setShowAddBlockModal(false);
      setBlockFormData({ name: '', totalFloors: '' });
      loadData();
    } catch (error) {
      console.error('Add block error:', error);
      Alert.alert('Hata', 'Blok eklenemedi');
    }
  };

  const handleDeleteBlock = async () => {
    if (!blockToDelete) return;

    try {
      await siteService.deleteBlock(blockToDelete.id);
      Alert.alert('Başarılı', 'Blok kaldırıldı');
      setShowDeleteBlockModal(false);
      setBlockToDelete(null);
      loadData();
    } catch (error) {
      console.error('Delete block error:', error);
      Alert.alert('Hata', 'Blok kaldırılamadı');
    }
  };

  const handleAddApartment = async () => {
    if (!apartmentFormData.unitNumber.trim()) {
      Alert.alert('Hata', 'Lütfen daire numarası girin');
      return;
    }

    if (!apartmentFormData.floor || parseInt(apartmentFormData.floor) < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir kat numarası girin');
      return;
    }

    if (!selectedBlock) {
      Alert.alert('Hata', 'Blok bilgisi bulunamadı');
      return;
    }

    try {
      await siteService.createApartment(selectedBlock.id, {
        unitNumber: apartmentFormData.unitNumber.trim(),
        floor: parseInt(apartmentFormData.floor),
      });
      Alert.alert('Başarılı', 'Daire eklendi');
      setShowAddApartmentModal(false);
      setApartmentFormData({ unitNumber: '', floor: '' });
      // Refresh apartments
      const apartmentsData = await residentService.getApartmentsByBlock(selectedBlock.id);
      setApartments(apartmentsData);
    } catch (error) {
      console.error('Add apartment error:', error);
      Alert.alert('Hata', 'Daire eklenemedi');
    }
  };

  const handleDeleteApartment = async () => {
    if (!apartmentToDelete) return;

    try {
      await siteService.deleteApartment(apartmentToDelete.id);
      Alert.alert('Başarılı', 'Daire kaldırıldı');
      setShowDeleteApartmentModal(false);
      setApartmentToDelete(null);
      // Refresh apartments
      if (selectedBlock) {
        const apartmentsData = await residentService.getApartmentsByBlock(selectedBlock.id);
        setApartments(apartmentsData);
      }
    } catch (error) {
      console.error('Delete apartment error:', error);
      Alert.alert('Hata', 'Daire kaldırılamadı');
    }
  };

  const handleAssignApartment = async () => {
    if (!assignmentApartmentId) {
      Alert.alert('Hata', 'Lütfen bir daire seçin');
      return;
    }

    if (!selectedResidentForAssignment) {
      Alert.alert('Hata', 'Sakin bilgisi bulunamadı');
      return;
    }

    try {
      await residentService.assignApartment(
        selectedResidentForAssignment.id,
        assignmentApartmentId,
        assignmentType
      );
      Alert.alert('Başarılı', 'Sakin daireye atandı');
      setShowAssignApartmentModal(false);
      setSelectedResidentForAssignment(null);
      setAssignmentApartmentId('');
      setAssignmentType('owner');
      loadData();
      // Refresh apartments list
      if (selectedBlock) {
        const apartmentsData = await residentService.getApartmentsByBlock(selectedBlock.id);
        setApartments(apartmentsData);
      }
    } catch (error) {
      console.error('Assign apartment error:', error);
      Alert.alert('Hata', 'Daire ataması yapılamadı');
    }
  };

  const loadAllApartments = async () => {
    if (!user?.siteId || blocks.length === 0) return;
    
    try {
      // Tüm blokların dairelerini yükle
      const allApartmentsPromises = blocks.map(block => 
        residentService.getApartmentsByBlock(block.id)
      );
      const apartmentsArrays = await Promise.all(allApartmentsPromises);
      const flattenedApartments = apartmentsArrays.flat();
      setAllApartments(flattenedApartments);
    } catch (error) {
      console.error('Load all apartments error:', error);
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
                    <Text style={styles.blockName}>{block.name}</Text>
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

        {/* Add/Delete Block Buttons */}
        <View style={styles.floatingButtonContainer}>
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.floatingButton, styles.floatingButtonPrimary]} 
              onPress={() => setShowAddBlockModal(true)}
            >
              <Building2 size={20} color={colors.white} />
              <Text style={styles.floatingButtonText}>Yeni Blok Ekle</Text>
            </Pressable>
            <Pressable 
              style={[styles.floatingButton, styles.floatingButtonDanger]} 
              onPress={() => {
                if (blocks.length === 0) {
                  Alert.alert('Uyarı', 'Kaldırılacak blok bulunamadı');
                  return;
                }
                setBlockToDelete(blocks[0]);
                setShowDeleteBlockModal(true);
              }}
            >
              <Trash2 size={20} color={colors.white} />
              <Text style={styles.floatingButtonText}>Blok Kaldır</Text>
            </Pressable>
          </View>
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
                  <Text style={styles.label}>Toplam Kat Sayısı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={blockFormData.totalFloors}
                    onChangeText={(text) => setBlockFormData({ ...blockFormData, totalFloors: text })}
                  />
                  <Text style={styles.helperText}>
                    Bloktaki toplam kat sayısını girin
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

        {/* Delete Block Modal */}
        <Modal 
          visible={showDeleteBlockModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => {
            setShowDeleteBlockModal(false);
            setBlockToDelete(null);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Blok Kaldır</Text>
                <Pressable onPress={() => {
                  setShowDeleteBlockModal(false);
                  setBlockToDelete(null);
                }}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.modalScroll}>
                <Text style={styles.label}>Kaldırılacak Bloğu Seçin</Text>
                <ScrollView style={styles.blockPicker} nestedScrollEnabled>
                  {blocks.map(block => (
                    <Pressable
                      key={block.id}
                      style={[
                        styles.blockPickerItem,
                        blockToDelete?.id === block.id && styles.blockPickerItemSelected
                      ]}
                      onPress={() => setBlockToDelete(block)}
                    >
                      <Building2 size={16} color={blockToDelete?.id === block.id ? colors.white : colors.primary} />
                      <Text style={[
                        styles.blockPickerText,
                        blockToDelete?.id === block.id && styles.blockPickerTextSelected
                      ]}>
                        {block.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable 
                  style={[styles.submitButton, styles.submitButtonDanger]} 
                  onPress={handleDeleteBlock}
                >
                  <Trash2 size={16} color={colors.white} />
                  <Text style={styles.submitButtonText}>Bloğu Kaldır</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Apartments View (Daire Listesi)
  if (viewMode === 'apartments') {
    const filteredApartments = apartments.filter(apartment =>
      apartment.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <Text style={styles.headerTitle}>{selectedBlock?.name.replace(/ Blok$/i, '')} Daireleri</Text>
            <Text style={styles.headerSubtitle}>{apartments.length} daire</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Daire ara..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Apartments Grid */}
          <View style={styles.apartmentsGrid}>
            {filteredApartments.map(apartment => {
              const apartmentResidents = apartment.residents || [];

              return (
                <Pressable
                  key={apartment.id}
                  style={styles.apartmentGridCard}
                  onPress={() => handleApartmentPress(apartment)}
                >
                  <View style={styles.apartmentIcon}>
                    <Home size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.apartmentGridNumber}>{apartment.unitNumber}</Text>
                  <Text style={styles.apartmentGridResidents}>
                    {apartmentResidents.length} sakin
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filteredApartments.length === 0 && (
            <View style={styles.emptyState}>
              <Home size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Arama kriterine uygun daire bulunamadı' : 'Daire bulunamadı'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Delete Apartment Buttons */}
        <View style={styles.floatingButtonContainer}>
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.floatingButton, styles.floatingButtonPrimary]} 
              onPress={() => setShowAddApartmentModal(true)}
            >
              <Home size={20} color={colors.white} />
              <Text style={styles.floatingButtonText}>Yeni Daire Ekle</Text>
            </Pressable>
            <Pressable 
              style={[styles.floatingButton, styles.floatingButtonDanger]} 
              onPress={() => {
                if (apartments.length === 0) {
                  Alert.alert('Uyarı', 'Kaldırılacak daire bulunamadı');
                  return;
                }
                setApartmentToDelete(apartments[0]);
                setShowDeleteApartmentModal(true);
              }}
            >
              <Trash2 size={20} color={colors.white} />
              <Text style={styles.floatingButtonText}>Daire Kaldır</Text>
            </Pressable>
          </View>
        </View>

        {/* Add Apartment Modal */}
        <Modal 
          visible={showAddApartmentModal} 
          transparent 
          animationType="slide" 
          onRequestClose={() => {
            setShowAddApartmentModal(false);
            setApartmentFormData({ unitNumber: '', floor: '' });
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Daire Ekle</Text>
                <Pressable onPress={() => {
                  setShowAddApartmentModal(false);
                  setApartmentFormData({ unitNumber: '', floor: '' });
                }}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.modalScroll}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Daire Numarası</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 12"
                    placeholderTextColor={colors.textSecondary}
                    value={apartmentFormData.unitNumber}
                    onChangeText={(text) => setApartmentFormData({ ...apartmentFormData, unitNumber: text })}
                    autoFocus
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Kat Numarası</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 3"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={apartmentFormData.floor}
                    onChangeText={(text) => setApartmentFormData({ ...apartmentFormData, floor: text })}
                  />
                </View>

                <Pressable style={styles.submitButton} onPress={handleAddApartment}>
                  <Home size={16} color={colors.white} />
                  <Text style={styles.submitButtonText}>Daire Ekle</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Apartment Modal */}
        <Modal 
          visible={showDeleteApartmentModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => {
            setShowDeleteApartmentModal(false);
            setApartmentToDelete(null);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Daire Kaldır</Text>
                <Pressable onPress={() => {
                  setShowDeleteApartmentModal(false);
                  setApartmentToDelete(null);
                }}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.modalScroll}>
                <Text style={styles.label}>Kaldırılacak Daireyi Seçin</Text>
                <ScrollView style={styles.apartmentPicker} nestedScrollEnabled>
                  {apartments.map(apartment => (
                    <Pressable
                      key={apartment.id}
                      style={[
                        styles.apartmentPickerItem,
                        apartmentToDelete?.id === apartment.id && styles.apartmentPickerItemSelected
                      ]}
                      onPress={() => setApartmentToDelete(apartment)}
                    >
                      <Home size={16} color={apartmentToDelete?.id === apartment.id ? colors.white : colors.primary} />
                      <Text style={[
                        styles.apartmentPickerText,
                        apartmentToDelete?.id === apartment.id && styles.apartmentPickerTextSelected
                      ]}>
                        Daire {apartment.unitNumber}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable 
                  style={[styles.submitButton, styles.submitButtonDanger]} 
                  onPress={handleDeleteApartment}
                >
                  <Trash2 size={16} color={colors.white} />
                  <Text style={styles.submitButtonText}>Daireyi Kaldır</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Residents View (Seçili Dairenin Sakinleri)
  if (viewMode === 'residents' && selectedApartment) {
    const apartmentResidents = selectedApartment.residents || [];
    const filteredResidents = apartmentResidents.filter((resident: any) =>
      resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.includes(searchQuery)
    );
    const ownerCount = apartmentResidents.filter((r: any) => r.residentType === 'owner').length;
    const tenantCount = apartmentResidents.filter((r: any) => r.residentType === 'tenant').length;

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
        <Pressable style={styles.backButton} onPress={handleBackToApartments}>
          <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.backButtonText}>Daireler</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daire {selectedApartment.unitNumber} Sakinleri</Text>
          <Text style={styles.headerSubtitle}>{selectedBlock?.name.replace(/ Blok$/i, '')} • {apartmentResidents.length} sakin</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{apartmentResidents.length}</Text>
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

        {/* Search and Add */}
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
          <Pressable 
            style={styles.addButton} 
            onPress={() => setShowAddModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <UserPlus size={16} color={colors.white} />
          </Pressable>
        </View>

        {/* Residents List */}
        <View style={styles.residentsList}>
          {filteredResidents.map(resident => (
            <View key={resident.id} style={styles.residentCard}>
              <View style={styles.residentHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {resident.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.residentInfo}>
                  <Text style={styles.residentName}>{resident.fullName}</Text>
                  <View style={styles.contactInfo}>
                    <Home size={14} color={colors.textSecondary} />
                    <Text style={styles.contactText}>Daire {selectedApartment.unitNumber}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text style={styles.contactText}>{resident.phone}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={styles.contactText}>{resident.email}</Text>
                  </View>
                </View>
                <View style={[
                  styles.roleBadge,
                  resident.residentType === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeTenant
                ]}>
                  <Text style={styles.roleBadgeText}>
                    {resident.residentType === 'owner' ? 'Malik' : 'Kiracı'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton, 
                    styles.actionButtonEdit,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => openEditModal(resident)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Edit size={14} color={colors.white} />
                  <Text style={styles.actionButtonText}>Düzenle</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton, 
                    styles.actionButtonAdd,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => {
                    console.log('Daire Ekle button pressed for resident:', resident.fullName);
                    setSelectedResidentForAssignment(resident);
                    setShowAssignApartmentModal(true);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Home size={14} color={colors.white} />
                  <Text style={styles.actionButtonText}>Daire Ekle</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton, 
                    styles.actionButtonRemove,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleRemove(resident.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Trash2 size={14} color={colors.white} />
                  <Text style={styles.actionButtonText}>Çıkar</Text>
                </Pressable>
              </View>
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

      {/* Add Resident Button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable 
          style={[styles.floatingButton, styles.floatingButtonPrimary]} 
          onPress={() => {
            // Pre-fill apartment number with current apartment
            setFormData({
              ...formData,
              apartmentNumber: selectedApartment.unitNumber,
            });
            setShowAddModal(true);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <UserPlus size={20} color={colors.white} />
          <Text style={styles.floatingButtonText}>Yeni Sakin Ekle</Text>
        </Pressable>
      </View>

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

      {/* Assign Apartment Modal */}
      <Modal 
        visible={showAssignApartmentModal} 
        transparent 
        animationType="slide" 
        onRequestClose={() => {
          setShowAssignApartmentModal(false);
          setSelectedResidentForAssignment(null);
          setAssignmentApartmentId('');
          setAssignmentType('owner');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daire Ata</Text>
              <Pressable onPress={() => {
                setShowAssignApartmentModal(false);
                setSelectedResidentForAssignment(null);
                setAssignmentApartmentId('');
                setAssignmentType('owner');
              }}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedResidentForAssignment && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Sakin</Text>
                  <Text style={styles.selectedResidentText}>{selectedResidentForAssignment.fullName}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Daire Seç (Tüm Bloklar)</Text>
                <Text style={styles.helperText}>
                  Sitedeki tüm daireler listeleniyor. İstediğiniz daireyi seçin.
                </Text>
                <ScrollView style={styles.apartmentPicker} nestedScrollEnabled>
                  {allApartments.length === 0 ? (
                    <Text style={styles.emptyPickerText}>Daire bulunamadı</Text>
                  ) : (
                    allApartments.map(apartment => (
                      <Pressable
                        key={apartment.id}
                        style={[
                          styles.apartmentPickerItem,
                          assignmentApartmentId === apartment.id && styles.apartmentPickerItemSelected
                        ]}
                        onPress={() => setAssignmentApartmentId(apartment.id)}
                      >
                        <Home size={16} color={assignmentApartmentId === apartment.id ? colors.white : colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.apartmentPickerText,
                            assignmentApartmentId === apartment.id && styles.apartmentPickerTextSelected
                          ]}>
                            {apartment.blockName} - Daire {apartment.unitNumber}
                          </Text>
                          {apartment.residents && apartment.residents.length > 0 && (
                            <Text style={[
                              styles.apartmentPickerSubtext,
                              assignmentApartmentId === apartment.id && styles.apartmentPickerTextSelected
                            ]}>
                              {apartment.residents.length} sakin
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Atama Tipi</Text>
                <View style={styles.radioGroup}>
                  <Pressable
                    style={[styles.radioButton, assignmentType === 'owner' && styles.radioButtonActive]}
                    onPress={() => setAssignmentType('owner')}
                  >
                    <Text style={[styles.radioText, assignmentType === 'owner' && styles.radioTextActive]}>
                      Kat Maliki
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.radioButton, assignmentType === 'tenant' && styles.radioButtonActive]}
                    onPress={() => setAssignmentType('tenant')}
                  >
                    <Text style={[styles.radioText, assignmentType === 'tenant' && styles.radioTextActive]}>
                      Kiracı
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable 
                style={styles.submitButton} 
                onPress={handleAssignApartment}
              >
                <Home size={16} color={colors.white} />
                <Text style={styles.submitButtonText}>Daireye Ata</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
  }

  // Default return - should not reach here
  return (
    <View style={styles.container}>
      <Text>Bilinmeyen görünüm modu</Text>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.background, 
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
    backgroundColor: colors.background, 
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
    backgroundColor: colors.background, 
    borderRadius: borderRadius.input, 
    borderWidth: 1, 
    borderColor: colors.border, 
    paddingHorizontal: spacing.md 
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 40, fontSize: fontSize.inputText, color: colors.textPrimary },
  addButton: { 
    width: 40, 
    height: 40, 
    backgroundColor: colors.primary, 
    borderRadius: borderRadius.button, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  residentsList: { gap: spacing.md },
  residentCard: { 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.card, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  residentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: colors.primary + '20' 
  },
  avatarText: { fontSize: 20, fontWeight: fontWeight.bold, color: colors.primary },
  residentInfo: { flex: 1, gap: 6 },
  residentName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  roleBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  roleBadgeOwner: {
    backgroundColor: colors.primary,
  },
  roleBadgeTenant: {
    backgroundColor: colors.info,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.button,
    minHeight: 44, // Minimum touch target size
  },
  actionButtonEdit: {
    backgroundColor: colors.primary,
  },
  actionButtonAdd: {
    backgroundColor: colors.success,
  },
  actionButtonRemove: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: spacing.md },
  
  floatingButtonContainer: { 
    position: 'absolute', 
    bottom: spacing.xl, 
    left: spacing.screenPaddingHorizontal, 
    right: spacing.screenPaddingHorizontal 
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  floatingButton: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg, 
    borderRadius: borderRadius.button,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonPrimary: {
    backgroundColor: colors.primary,
  },
  floatingButtonDanger: {
    backgroundColor: colors.error,
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
    backgroundColor: colors.background, 
    borderTopLeftRadius: borderRadius.cardLg, 
    borderTopRightRadius: borderRadius.cardLg, 
    maxHeight: '90%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.xl, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalScroll: { padding: spacing.xl },
  
  formGroup: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.cardSubtitle, fontWeight: fontWeight.medium, color: colors.textPrimary, marginBottom: spacing.sm },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: borderRadius.input, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.md, 
    fontSize: fontSize.inputText, 
    color: colors.textPrimary 
  },
  radioGroup: { flexDirection: 'row', gap: spacing.sm },
  radioButton: { 
    flex: 1, 
    paddingVertical: spacing.md, 
    borderRadius: borderRadius.button, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    backgroundColor: colors.background 
  },
  radioButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.textPrimary },
  radioTextActive: { color: colors.white },
  submitButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary, 
    padding: spacing.lg, 
    borderRadius: borderRadius.button, 
    marginTop: spacing.md 
  },
  submitButtonDanger: {
    backgroundColor: colors.error,
  },
  submitButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  
  selectedResidentText: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.input,
  },
  apartmentPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.sm,
  },
  apartmentPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  apartmentPickerItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  apartmentPickerText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  apartmentPickerTextSelected: {
    color: colors.white,
  },
  apartmentPickerSubtext: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyPickerText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  blockPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  blockPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockPickerItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  blockPickerText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  blockPickerTextSelected: {
    color: colors.white,
  },
  
  // Apartments Grid Styles
  apartmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  apartmentGridCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  apartmentIcon: {
    marginBottom: spacing.sm,
  },
  apartmentGridNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  apartmentGridResidents: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
});

export default AdminResidents;

