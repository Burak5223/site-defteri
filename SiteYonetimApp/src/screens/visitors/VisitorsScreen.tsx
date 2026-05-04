import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Users,
  Search,
  Plus,
  Clock,
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Car,
  UserCheck,
} from 'lucide-react-native';
import { lightTheme, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { visitorService, VisitorResponse } from '../../services/visitor.service';
import { EmptyState } from '../../components/EmptyState';

interface Visitor {
  id: string;
  visitorName: string;
  hostName: string;
  visitDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  lpPlate?: string;
  notes?: string;
}

const VisitorsScreen = () => {
  const { user, hasRole } = useAuth();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    visitorName: '',
    hostName: '',
    vehiclePlate: '',
    notes: '',
  });

  // Temizlikçi rolü için erişim engelleme
  if (hasRole('CLEANING')) {
    return (
      <View style={styles.root}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Users size={48} color="#9ca3af" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            Bu ekrana erişim yetkiniz bulunmamaktadır.
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
            Ziyaretçi yönetimi sadece yönetici ve güvenlik personeli tarafından kullanılabilir.
          </Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      if (!user?.siteId) return;
      
      const data = await visitorService.getVisitors(user.siteId);
      const mapped = data.map(mapVisitorResponse);
      setVisitors(mapped);
    } catch (error) {
      console.error('Error loading visitors:', error);
      Alert.alert(t('common.error'), t('visitors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const mapVisitorResponse = (v: VisitorResponse): Visitor => {
    let status: Visitor['status'] = 'pending';
    if (v.status === 'CHECKED_IN') status = 'active';
    else if (v.status === 'CHECKED_OUT') status = 'completed';
    else if (v.status === 'CANCELLED') status = 'cancelled';
    else if (v.status === 'EXPECTED') status = 'pending';

    return {
      id: v.id,
      visitorName: v.visitorName,
      hostName: v.apartmentNumber || v.apartmentId,
      visitDate: v.actualArrival || v.expectedArrival,
      status,
      lpPlate: v.vehiclePlate,
      notes: v.notes,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisitors();
    setRefreshing(false);
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      await visitorService.checkOutVisitor(visitorId);
      Alert.alert(t('common.success'), t('visitors.checkOutSuccess'));
      await loadVisitors();
    } catch (error) {
      console.error('Error checking out visitor:', error);
      Alert.alert(t('common.error'), t('visitors.checkOutError'));
    }
  };

  const handleAddVisitor = async () => {
    if (!newVisitor.visitorName || !newVisitor.hostName) {
      Alert.alert(t('common.error'), 'Ziyaretçi Adı ve Ziyaret Edilen Kişi alanları zorunludur.');
      return;
    }
    if (!user?.siteId) return;

    setIsSubmitting(true);
    try {
      await visitorService.createVisitor(user.siteId, {
        apartmentId: '1', // Dummy ID for now, usually user selects from list
        purpose: `Ziyaret Edilen: ${newVisitor.hostName}`,
        expectedArrival: new Date().toISOString(),
        visitorName: newVisitor.visitorName,
        vehiclePlate: newVisitor.vehiclePlate,
        notes: newVisitor.notes,
      });
      Alert.alert(t('common.success'), 'Ziyaretçi başarıyla eklendi.');
      setShowAddModal(false);
      setNewVisitor({ visitorName: '', hostName: '', vehiclePlate: '', notes: '' });
      loadVisitors();
    } catch (error) {
      console.error('Error creating visitor:', error);
      Alert.alert(t('common.error'), 'Ziyaretçi eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Visitor['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(16,185,129,0.1)', color: '#059669', label: t('visitors.inside') };
      case 'completed':
        return { bg: 'rgba(107,114,128,0.1)', color: '#4b5563', label: t('visitors.checkedOut') };
      case 'pending':
        return { bg: 'rgba(245,158,11,0.1)', color: '#d97706', label: t('visitors.pending') };
      case 'cancelled':
        return { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: t('visitors.cancelled') };
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[lightTheme.colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('visitors.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {visitors.filter(v => v.status === 'active').length} {t('visitors.activeVisitors')}
            </Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setShowAddModal(true)}>
            <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryButtonText}>{t('visitors.addVisitor')}</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Search size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('visitors.searchPlaceholder')}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List */}
        {filteredVisitors.length === 0 ? (
          <EmptyState 
            icon={Users} 
            title={searchQuery ? t('common.noResults') : 'Henüz ziyaretçi bulunmuyor'} 
          />
        ) : (
          <View style={styles.list}>
            {filteredVisitors.map((visitor) => {
              const status = getStatusColor(visitor.status);
              return (
                <View key={visitor.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.visitorInfo}>
                      <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                      <View style={styles.hostRow}>
                        <Users size={12} color="#6b7280" style={{ marginRight: 4 }} />
                        <Text style={styles.hostName}>{visitor.hostName}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={14} color="#6b7280" style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>
                        {new Date(visitor.visitDate).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={14} color="#6b7280" style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>
                        {new Date(visitor.visitDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {visitor.lpPlate && (
                      <View style={styles.detailItem}>
                        <Car size={14} color="#6b7280" style={{ marginRight: 6 }} />
                        <Text style={styles.detailText}>{visitor.lpPlate}</Text>
                      </View>
                    )}
                  </View>
                  
                  {visitor.notes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesText}>{visitor.notes}</Text>
                    </View>
                  )}

                  {/* Actions for Security/Admin only */}
                  {(hasRole('SECURITY') || hasRole('ADMIN')) && visitor.status === 'active' && (
                    <View style={styles.actionRow}>
                        <Pressable 
                          style={styles.actionButton}
                          onPress={() => handleCheckOut(visitor.id)}
                        >
                            <Text style={styles.actionButtonText}>{t('visitors.checkOut')}</Text>
                        </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Visitor Modal */}
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
                    <Text style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold' }}>Ziyaretçi Ekle</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <View style={{ gap: 16 }}>
                      <View>
                        <Text style={styles.inputLabel}>Ziyaretçi Adı Soyadı *</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newVisitor.visitorName}
                          onChangeText={t => setNewVisitor({...newVisitor, visitorName: t})} 
                          placeholder="Ahmet Yılmaz"
                        />
                      </View>
                      
                      <View>
                        <Text style={styles.inputLabel}>Ziyaret Edilen Kişi (Ad/Daire) *</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newVisitor.hostName}
                          onChangeText={t => setNewVisitor({...newVisitor, hostName: t})} 
                          placeholder="Daire 12 - Mehmet Bey"
                        />
                      </View>

                      <View>
                        <Text style={styles.inputLabel}>Araç Plakası (Opsiyonel)</Text>
                        <TextInput 
                          style={styles.input} 
                          value={newVisitor.vehiclePlate}
                          onChangeText={t => setNewVisitor({...newVisitor, vehiclePlate: t})} 
                          placeholder="34 ABC 123"
                          autoCapitalize="characters"
                        />
                      </View>

                      <View>
                        <Text style={styles.inputLabel}>Notlar (Opsiyonel)</Text>
                        <TextInput 
                          style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                          value={newVisitor.notes}
                          onChangeText={t => setNewVisitor({...newVisitor, notes: t})} 
                          placeholder="Kargo teslimatı, misafir vb."
                          multiline
                        />
                      </View>

                      <Pressable 
                        style={[styles.primaryButton, { height: 52, marginTop: 16, justifyContent: 'center' }, isSubmitting && {opacity: 0.7}]} 
                        onPress={handleAddVisitor}
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

export default VisitorsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#9ca3af',
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitorInfo: {
    flex: 1,
    marginRight: 12,
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostName: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
  },
  notesContainer: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '65%',
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
});
