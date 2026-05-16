import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import visitorRequestService, { VisitorItem, VisitorRequest } from '../../services/visitorRequest.service';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

export default function ResidentVisitorRequests() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);

  // Form state
  const [expectedDate, setExpectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);

  // New visitor form
  const [newVisitor, setNewVisitor] = useState<VisitorItem>({
    visitorName: '',
    visitorPhone: '',
    vehiclePlate: '',
    stayStartDate: new Date().toISOString(),
    stayDurationDays: 1,
    itemNotes: '',
  });

  useEffect(() => {
    console.log('ResidentVisitorRequests mounted');
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      console.log('🔄 Loading visitor requests...');
      console.log('📍 Step 1: Setting loading to true');
      setLoading(true);
      
      console.log('📍 Step 2: Calling visitorRequestService.getMyRequests()');
      const data = await visitorRequestService.getMyRequests();
      
      console.log('📍 Step 3: Response received');
      console.log('📊 Response type:', typeof data);
      console.log('📊 Response is array:', Array.isArray(data));
      console.log('📊 Response value:', JSON.stringify(data).substring(0, 200));
      
      if (!data) {
        console.error('❌ Data is null or undefined!');
        throw new Error('API yanıtı boş');
      }
      
      if (!Array.isArray(data)) {
        console.error('❌ Data is not an array!');
        console.error('Data:', data);
        throw new Error('API yanıtı array değil');
      }
      
      console.log('✅ Visitor requests loaded:', data.length, 'items');
      setRequests(data);
    } catch (error: any) {
      console.error('❌ Error loading requests:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error toString:', error?.toString());
      
      let errorMessage = 'Veriler yüklenirken hata oluştu';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Ağ bağlantısı hatası. Backend çalışıyor mu kontrol edin.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Bu işlem için yetkiniz yok.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Final error message:', errorMessage);
      Alert.alert('Hata', errorMessage);
    } finally {
      console.log('📍 Step 4: Setting loading to false');
      setLoading(false);
    }
  };

  const handleAddVisitor = () => {
    if (!newVisitor.visitorName.trim()) {
      Alert.alert(t('error'), 'Lütfen ziyaretçi adı soyadı girin');
      return;
    }

    setVisitors([...visitors, { ...newVisitor }]);
    setNewVisitor({
      visitorName: '',
      visitorPhone: '',
      vehiclePlate: '',
      stayStartDate: new Date().toISOString(),
      stayDurationDays: 1,
      itemNotes: '',
    });
    setShowAddVisitorModal(false);
  };

  const handleRemoveVisitor = (index: number) => {
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const handleCreateRequest = async () => {
    if (visitors.length === 0) {
      Alert.alert('Hata', 'En az bir ziyaretçi eklemelisiniz');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        expectedVisitDate: expectedDate.toISOString(),
        notes: notes.trim() || undefined,
        visitors: visitors.map(v => ({
          visitorName: v.visitorName.trim(),
          visitorPhone: v.visitorPhone?.trim() || undefined,
          vehiclePlate: v.vehiclePlate?.trim() || undefined,
          stayStartDate: v.stayStartDate,
          stayDurationDays: v.stayDurationDays || 1,
          itemNotes: v.itemNotes?.trim() || undefined,
        })),
      };

      console.log('Creating visitor request:', requestData);
      
      await visitorRequestService.createRequest(requestData);

      Alert.alert('Başarılı', 'Ziyaretçi talebi oluşturuldu');
      setShowCreateModal(false);
      resetForm();
      loadRequests();
    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Talep oluşturulamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    Alert.alert(
      'Talebi İptal Et',
      'Bu talebi iptal etmek istediğinizden emin misiniz?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await visitorRequestService.cancelRequest(id);
              Alert.alert(t('success'), 'Talep iptal edildi');
              loadRequests();
            } catch (error: any) {
              Alert.alert(t('error'), error.response?.data?.message || 'Talep iptal edilemedi');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setExpectedDate(new Date());
    setNotes('');
    setVisitors([]);
    setNewVisitor({
      visitorName: '',
      visitorPhone: '',
      vehiclePlate: '',
      stayStartDate: new Date().toISOString(),
      stayDurationDays: 1,
      itemNotes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      case 'cancelled': return colors.textTertiary;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ziyaretçi Taleplerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>Henüz talep oluşturmadınız</Text>
            <Text style={styles.emptySubtext}>
              Ziyaretçi talebi oluşturmak için + butonuna tıklayın
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => setSelectedRequest(request)}
            >
              <View style={styles.requestHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                </View>
                {request.status === 'pending' && (
                  <TouchableOpacity
                    onPress={() => handleCancelRequest(request.id)}
                    style={styles.cancelButton}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.requestDate}>
                <Ionicons name="calendar-outline" size={16} />
                {' '}{formatDate(request.expectedVisitDate)}
              </Text>

              <Text style={styles.visitorCount}>
                <Ionicons name="people-outline" size={16} />
                {' '}{request.visitors.length} ziyaretçi
              </Text>

              {request.notes && (
                <Text style={styles.requestNotes} numberOfLines={2}>
                  {request.notes}
                </Text>
              )}

              {request.reviewNotes && (
                <View style={styles.reviewNotesContainer}>
                  <Text style={styles.reviewNotesLabel}>Güvenlik Notu:</Text>
                  <Text style={styles.reviewNotes}>{request.reviewNotes}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Request Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Ziyaretçi Talebi</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Ziyaret Tarihi *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {formatDate(expectedDate.toISOString())}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expectedDate}
                mode="datetime"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setExpectedDate(date);
                }}
              />
            )}

            <Text style={styles.label}>Ziyaretçiler *</Text>
            {visitors.map((visitor, index) => (
              <View key={index} style={styles.visitorItem}>
                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                  {visitor.visitorPhone && (
                    <Text style={styles.visitorDetail}>📞 {visitor.visitorPhone}</Text>
                  )}
                  {visitor.vehiclePlate && (
                    <Text style={styles.visitorDetail}>🚗 {visitor.vehiclePlate}</Text>
                  )}
                  <Text style={styles.visitorDetail}>
                    📅 {new Date(visitor.stayStartDate).toLocaleDateString('tr-TR')} 
                    {' '}({visitor.stayDurationDays || 1} gün)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveVisitor(index)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addVisitorButton}
              onPress={() => setShowAddVisitorModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.addVisitorButtonText}>Ziyaretçi Ekle</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Notlar (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ziyaret hakkında notlar..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, visitors.length === 0 && styles.submitButtonDisabled]}
              onPress={handleCreateRequest}
              disabled={visitors.length === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Talebi Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Visitor Modal */}
      <Modal
        visible={showAddVisitorModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddVisitorModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlayContainer}
        >
          <TouchableOpacity 
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={() => setShowAddVisitorModal(false)}
          />
          <View style={styles.addVisitorModal}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Ziyaretçi Ekle</Text>

            <Text style={styles.label}>Ad Soyad *</Text>
            <TextInput
              style={styles.input}
              value={newVisitor.visitorName}
              onChangeText={(text) => setNewVisitor({ ...newVisitor, visitorName: text })}
              placeholder="Örn: Ahmet Yılmaz"
            />

            <Text style={styles.label}>Telefon (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              value={newVisitor.visitorPhone}
              onChangeText={(text) => setNewVisitor({ ...newVisitor, visitorPhone: text })}
              placeholder="+90 555 123 45 67 (opsiyonel)"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Kalış Başlangıç Tarihi *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                // Tarih seçici göster
                const currentDate = newVisitor.stayStartDate ? new Date(newVisitor.stayStartDate) : new Date();
                setNewVisitor({ ...newVisitor, stayStartDate: currentDate.toISOString() });
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {new Date(newVisitor.stayStartDate).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Kaç Gün Kalacak? *</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setNewVisitor({ 
                  ...newVisitor, 
                  stayDurationDays: Math.max(1, (newVisitor.stayDurationDays || 1) - 1) 
                })}
              >
                <Ionicons name="remove-circle-outline" size={32} color={colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.durationDisplay}>
                <Text style={styles.durationNumber}>{newVisitor.stayDurationDays || 1}</Text>
                <Text style={styles.durationLabel}>gün</Text>
              </View>
              
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setNewVisitor({ 
                  ...newVisitor, 
                  stayDurationDays: Math.min(365, (newVisitor.stayDurationDays || 1) + 1) 
                })}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Araç Plakası (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              value={newVisitor.vehiclePlate}
              onChangeText={(text) => setNewVisitor({ ...newVisitor, vehiclePlate: text.toUpperCase() })}
              placeholder="Örn: 34ABC123 (opsiyonel)"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Not (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newVisitor.itemNotes}
              onChangeText={(text) => setNewVisitor({ ...newVisitor, itemNotes: text })}
              placeholder="Bu ziyaretçi hakkında notlar (opsiyonel)..."
              multiline
              numberOfLines={3}
            />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowAddVisitorModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={handleAddVisitor}
                >
                  <Text style={styles.modalButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <Modal
          visible={!!selectedRequest}
          animationType="slide"
          onRequestClose={() => setSelectedRequest(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Talep Detayı</Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) }]}>
                <Text style={styles.statusText}>{getStatusText(selectedRequest.status)}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Ziyaret Tarihi</Text>
                <Text style={styles.detailValue}>{formatDate(selectedRequest.expectedVisitDate)}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Talep Tarihi</Text>
                <Text style={styles.detailValue}>{formatDate(selectedRequest.requestDate)}</Text>
              </View>

              {selectedRequest.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notlarınız</Text>
                  <Text style={styles.detailValue}>{selectedRequest.notes}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Ziyaretçiler ({selectedRequest.visitors.length})</Text>
                {selectedRequest.visitors.map((visitor, index) => (
                  <View key={visitor.id} style={styles.visitorDetailCard}>
                    <Text style={styles.visitorDetailName}>
                      {index + 1}. {visitor.visitorName}
                    </Text>
                    {visitor.visitorPhone && (
                      <Text style={styles.visitorDetailInfo}>📞 {visitor.visitorPhone}</Text>
                    )}
                    {visitor.vehiclePlate && (
                      <Text style={styles.visitorDetailInfo}>🚗 {visitor.vehiclePlate}</Text>
                    )}
                    {visitor.stayStartDate && (
                      <Text style={styles.visitorDetailInfo}>
                        📅 Kalış: {new Date(visitor.stayStartDate).toLocaleDateString('tr-TR')}
                        {' '}({visitor.stayDurationDays || 1} gün)
                      </Text>
                    )}
                    {visitor.itemNotes && (
                      <Text style={styles.visitorDetailNotes}>{visitor.itemNotes}</Text>
                    )}
                  </View>
                ))}
              </View>

              {selectedRequest.reviewedByName && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>
                    {selectedRequest.status === 'approved' ? 'Onaylayan' : 'Reddeden'}
                  </Text>
                  <Text style={styles.detailValue}>{selectedRequest.reviewedByName}</Text>
                  {selectedRequest.reviewedAt && (
                    <Text style={styles.detailSubValue}>{formatDate(selectedRequest.reviewedAt)}</Text>
                  )}
                </View>
              )}

              {selectedRequest.reviewNotes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Güvenlik Notu</Text>
                  <Text style={styles.detailValue}>{selectedRequest.reviewNotes}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 4,
  },
  requestDate: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  visitorCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  requestNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  reviewNotesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  reviewNotesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reviewNotes: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  visitorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  visitorDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addVisitorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addVisitorButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addVisitorModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonCancel: {
    backgroundColor: colors.backgroundSecondary,
  },
  modalButtonSubmit: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextCancel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  detailSubValue: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  visitorDetailCard: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  visitorDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  visitorDetailInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  visitorDetailNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginVertical: 8,
  },
  durationButton: {
    padding: 8,
  },
  durationDisplay: {
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 80,
  },
  durationNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  durationLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
});




