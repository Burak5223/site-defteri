import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import {
  Search,
  Phone,
  Mail,
  Home,
  Filter,
  UserPlus,
  Building2,
  Crown,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { spacing, fontSize, lightTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

type ResidentTypeFilter = 'all' | 'owner' | 'tenant';

const ResidentsScreen = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResidentTypeFilter>('all');
  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newResident, setNewResident] = useState({
    fullName: '',
    email: '',
    phone: '',
    residentType: 'tenant' as 'owner' | 'tenant',
    blockName: '',
    unitNumber: ''
  });

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      const data = await apiClient.get<any[]>('/users');
      setResidents(data);
    } catch (error) {
      console.error('Sakinler yükleme hatası:', error);
      Alert.alert(t('common.error'), 'Sakinler yüklenemedi. Sunucuya ulaşılamıyor.');
      setResidents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddResident = async () => {
    if (!newResident.fullName || !newResident.email) {
      Alert.alert(t('common.error'), 'Ad Soyad ve Email zorunludur.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/users', newResident);
      Alert.alert(t('common.success'), 'Sakin başarıyla eklendi.');
      setShowAddModal(false);
      setNewResident({ fullName: '', email: '', phone: '', residentType: 'tenant', blockName: '', unitNumber: '' });
      loadResidents();
    } catch (error) {
      console.error('Kişi ekleme hatası:', error);
      Alert.alert(t('common.error'), 'Kişi eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResidents();
  };

  const filteredResidents = residents.filter((resident) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (resident.fullName || '').toLowerCase().includes(q) ||
      (resident.email || '').toLowerCase().includes(q) ||
      (resident.phone || '').includes(searchQuery);

    const matchesFilter = filterType === 'all' || resident.residentType === filterType;

    return matchesSearch && matchesFilter;
  });

  const renderInitials = (fullName: string) =>
    (fullName || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Search & Filter - Fixed Top */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder={t('residents.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
         <Pressable 
            style={styles.filterButton}
            onPress={() => setFilterType(prev => prev === 'all' ? 'owner' : prev === 'owner' ? 'tenant' : 'all')}
          >
            <Filter size={20} color={filterType !== 'all' ? '#0f766e' : '#64748b'} />
            {filterType !== 'all' && (
              <View style={{position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f766e'}} />
            )}
        </Pressable>
        {user?.roles?.includes('ADMIN') && (
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <UserPlus size={20} color="#ffffff" />
            </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[lightTheme.colors.primary]} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
             <View style={styles.statChip}>
                <Text style={styles.statValue}>{residents.length}</Text>
                <Text style={styles.statLabel}>{t('residents.total')}</Text>
             </View>
             <View style={[styles.statChip, { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' }]}>
                <Text style={[styles.statValue, { color: '#0f766e' }]}>
                    {residents.filter(r => r.residentType === 'owner').length}
                </Text>
                <Text style={[styles.statLabel, { color: '#0f766e' }]}>{t('residents.owner')}</Text>
             </View>
             <View style={[styles.statChip, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                    {residents.filter(r => r.residentType === 'tenant').length}
                </Text>
                <Text style={[styles.statLabel, { color: '#3b82f6' }]}>{t('residents.tenant')}</Text>
             </View>
        </View>

        {filteredResidents.length > 0 ? (
          <View style={styles.list}>
            {filteredResidents.map((resident) => {
              const isOwner = resident.residentType === 'owner';
              
              return (
                <Pressable
                  key={resident.id}
                  style={styles.card}
                  onPress={() => setSelectedResident(resident)}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, isOwner ? styles.avatarOwner : styles.avatarTenant]}>
                        <Text style={[styles.avatarText, isOwner ? styles.textOwner : styles.textTenant]}>
                            {renderInitials(resident.fullName)}
                        </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.nameRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{resident.fullName}</Text>
                        {isOwner && <Crown size={14} color="#f59e0b" style={{ marginLeft: 4 }} />}
                    </View>
                    <Text style={styles.cardSubtext}>{resident.blockName} • Daire {resident.unitNumber}</Text>
                    
                    <View style={styles.cardFooter}>
                        <View style={[styles.badge, isOwner ? styles.badgeOwner : styles.badgeTenant]}>
                            <Text style={[styles.badgeText, isOwner ? styles.textOwner : styles.textTenant]}>
                                {isOwner ? t('residents.ownerLabel') : t('residents.tenantLabel')}
                            </Text>
                        </View>
                        <View style={styles.dot} />
                        <Text style={[
                            styles.statusText, 
                            { color: resident.status === 'active' ? '#16a34a' : '#94a3b8' }
                        ]}>
                            {resident.status === 'active' ? t('residents.active') : t('residents.inactive')}
                        </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                     <ChevronRight size={20} color="#cbd5e1" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
                <Building2 size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>{t('residents.notFound')}</Text>
            <Text style={styles.emptyDesc}>{t('residents.notFoundMessage')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Resident Detail Modal */}
      <Modal
        visible={!!selectedResident}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedResident(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedResident(null)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                    <View style={styles.dragHandle} />
                </View>

                {selectedResident && (
                <ScrollView contentContainerStyle={styles.modalBody}>
                    <View style={styles.profileSection}>
                        <View style={[
                            styles.largeAvatar, 
                            selectedResident.residentType === 'owner' ? styles.avatarOwner : styles.avatarTenant
                        ]}>
                            <Text style={[
                                styles.largeAvatarText,
                                selectedResident.residentType === 'owner' ? styles.textOwner : styles.textTenant
                            ]}>
                                {renderInitials(selectedResident.fullName)}
                            </Text>
                        </View>
                        <Text style={styles.profileName}>{selectedResident.fullName}</Text>
                        <View style={styles.profileMeta}>
                            <View style={[
                                styles.badge, 
                                { paddingHorizontal: 10, paddingVertical: 4 },
                                selectedResident.residentType === 'owner' ? styles.badgeOwner : styles.badgeTenant
                            ]}>
                                <Text style={[
                                    styles.badgeText, 
                                    { fontSize: 12 },
                                    selectedResident.residentType === 'owner' ? styles.textOwner : styles.textTenant
                                ]}>
                                    {selectedResident.residentType === 'owner' ? t('residents.ownerLabel') : t('residents.tenantLabel')}
                                </Text>
                            </View>
                             {selectedResident.residentType === 'owner' && <Crown size={18} color="#f59e0b" />}
                        </View>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.groupTitle}>{t('residents.contactInfo')}</Text>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Phone size={20} color="#64748b" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('residents.phone')}</Text>
                                <Text style={styles.infoValue}>{selectedResident.phone}</Text>
                            </View>
                            <Pressable style={styles.actionIcon}>
                                <Phone size={18} color="#0f766e" />
                            </Pressable>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Mail size={20} color="#64748b" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('residents.email')}</Text>
                                <Text style={styles.infoValue}>{selectedResident.email}</Text>
                            </View>
                        </View>
                    </View>

                     <View style={styles.infoGroup}>
                        <Text style={styles.groupTitle}>{t('residents.apartmentInfo')}</Text>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <Home size={20} color="#64748b" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('residents.location')}</Text>
                                <Text style={styles.infoValue}>{selectedResident.blockName} • No: {selectedResident.unitNumber}</Text>
                            </View>
                        </View>
                         <View style={styles.divider} />
                         <View style={styles.infoRow}>
                             <View style={styles.iconBox}>
                                {selectedResident.status === 'active' ? 
                                    <CheckCircle2 size={20} color="#16a34a" /> : 
                                    <XCircle size={20} color="#94a3b8" />
                                }
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('residents.status')}</Text>
                                <Text style={[
                                    styles.infoValue, 
                                    { color: selectedResident.status === 'active' ? '#16a34a' : '#64748b' }
                                ]}>
                                    {selectedResident.status === 'active' ? t('residents.activeStatus') : t('residents.inactiveStatus')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Pressable style={styles.closeBtn} onPress={() => setSelectedResident(null)}>
                        <Text style={styles.closeBtnText}>{t('common.close')}</Text>
                    </Pressable>
                </ScrollView>
                )}
            </Pressable>
        </Pressable>
      </Modal>

      {/* Add Resident Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                    <View style={styles.dragHandle} />
                    <Text style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold' }}>Sakin Ekle</Text>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                    <View style={{ gap: 16 }}>
                      <View>
                        <Text style={styles.infoLabel}>Ad Soyad *</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newResident.fullName}
                          onChangeText={t => setNewResident({...newResident, fullName: t})} 
                          placeholder="Ahmet Yılmaz"
                        />
                      </View>
                      
                      <View>
                        <Text style={styles.infoLabel}>Email *</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newResident.email}
                          onChangeText={t => setNewResident({...newResident, email: t})} 
                          placeholder="ahmet@example.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      <View>
                        <Text style={styles.infoLabel}>Telefon</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newResident.phone}
                          onChangeText={t => setNewResident({...newResident, phone: t})} 
                          placeholder="0555 123 4567"
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Blok</Text>
                          <TextInput 
                            style={styles.input} 
                            value={newResident.blockName}
                            onChangeText={t => setNewResident({...newResident, blockName: t})} 
                            placeholder="A Blok"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>Kapı No</Text>
                          <TextInput 
                            style={styles.input} 
                            value={newResident.unitNumber}
                            onChangeText={t => setNewResident({...newResident, unitNumber: t})} 
                            placeholder="12"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View>
                        <Text style={styles.infoLabel}>Tip</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <Pressable 
                            style={[styles.typeSelectObj, newResident.residentType === 'owner' && styles.typeSelectObjActive]}
                            onPress={() => setNewResident({...newResident, residentType: 'owner'})}
                          >
                            <Text style={[styles.typeSelectObjText, newResident.residentType === 'owner' && {color: '#0f766e'}]}>Ev Sahibi</Text>
                          </Pressable>
                          <Pressable 
                            style={[styles.typeSelectObj, newResident.residentType === 'tenant' && styles.typeSelectObjActive]}
                            onPress={() => setNewResident({...newResident, residentType: 'tenant'})}
                          >
                            <Text style={[styles.typeSelectObjText, newResident.residentType === 'tenant' && {color: '#0f766e'}]}>Kiracı</Text>
                          </Pressable>
                        </View>
                      </View>

                      <Pressable 
                        style={[styles.primaryButton, isSubmitting && {opacity: 0.7}]} 
                        onPress={handleAddResident}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>Kaydet</Text>
                        )}
                      </Pressable>
                      
                    </View>
                </ScrollView>
            </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardRight: {
    marginLeft: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOwner: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
  },
  avatarTenant: {
    backgroundColor: '#f1f5f9',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  textOwner: {
    color: '#0f766e',
  },
  textTenant: {
    color: '#64748b',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 6,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOwner: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
  },
  badgeTenant: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  modalBody: {
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeAvatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f766e',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  typeSelectObj: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  typeSelectObjActive: {
    borderColor: '#0f766e',
    backgroundColor: 'rgba(15, 118, 110, 0.05)',
  },
  typeSelectObjText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default ResidentsScreen;
