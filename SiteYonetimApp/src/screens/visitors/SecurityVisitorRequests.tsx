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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import visitorRequestService, { VisitorRequest } from '../../services/visitorRequest.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

export default function SecurityVisitorRequests() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    if (!user?.siteId) return;

    try {
      setLoading(true);
      let data: VisitorRequest[];
      
      if (filter === 'pending') {
        data = await visitorRequestService.getPendingRequests(user.siteId);
      } else {
        data = await visitorRequestService.getAllRequests(user.siteId);
        if (filter !== 'all') {
          data = data.filter(r => r.status === filter);
        }
      }
      
      setRequests(data);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.message || t('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: VisitorRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      if (reviewAction === 'approve') {
        await visitorRequestService.approveRequest(selectedRequest.id, {
          reviewNotes: reviewNotes.trim() || undefined,
        });
        Alert.alert(t('success'), 'Talep onaylandı ve ziyaretçiler sisteme eklendi');
      } else {
        await visitorRequestService.rejectRequest(selectedRequest.id, {
          reviewNotes: reviewNotes.trim() || undefined,
        });
        Alert.alert(t('success'), 'Talep reddedildi');
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      loadRequests();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
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

  const getFilterCount = (filterType: string) => {
    if (filterType === 'all') return requests.length;
    return requests.filter(r => r.status === filterType).length;
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
        <Text style={styles.headerTitle}>Ziyaretçi Talepleri</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            🟡 Bekleyen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.filterButtonText, filter === 'approved' && styles.filterButtonTextActive]}>
            ✅ Onaylanan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterButtonText, filter === 'rejected' && styles.filterButtonTextActive]}>
            ❌ Reddedilen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            📋 Tümü
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>
              {filter === 'pending' ? 'Bekleyen talep yok' : 'Talep bulunamadı'}
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                </View>
                {request.apartmentNumber && (
                  <Text style={styles.apartmentBadge}>Daire: {request.apartmentNumber}</Text>
                )}
              </View>

              <Text style={styles.residentName}>
                <Ionicons name="person-outline" size={16} />
                {' '}{request.requestedByName || 'Sakin'}
              </Text>

              <Text style={styles.requestDate}>
                <Ionicons name="calendar-outline" size={16} />
                {' '}{formatDate(request.expectedVisitDate)}
              </Text>

              <Text style={styles.visitorCount}>
                <Ionicons name="people-outline" size={16} />
                {' '}{request.visitors.length} ziyaretçi
              </Text>

              {request.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Sakin Notu:</Text>
                  <Text style={styles.notesText} numberOfLines={2}>{request.notes}</Text>
                </View>
              )}

              <View style={styles.visitorsList}>
                {request.visitors.slice(0, 3).map((visitor, index) => (
                  <Text key={visitor.id} style={styles.visitorName}>
                    • {visitor.visitorName}
                  </Text>
                ))}
                {request.visitors.length > 3 && (
                  <Text style={styles.moreVisitors}>
                    +{request.visitors.length - 3} kişi daha
                  </Text>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => setSelectedRequest(request)}
                >
                  <Text style={styles.detailButtonText}>Detay Gör</Text>
                </TouchableOpacity>

                {request.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleReview(request, 'approve')}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      <Text style={styles.approveButtonText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReview(request, 'reject')}
                    >
                      <Ionicons name="close-circle" size={20} color="#ffffff" />
                      <Text style={styles.rejectButtonText}>Reddet</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Request Detail Modal */}
      {selectedRequest && !showReviewModal && (
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
                <Text style={styles.detailLabel}>Daire</Text>
                <Text style={styles.detailValue}>{selectedRequest.apartmentNumber || '-'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Sakin</Text>
                <Text style={styles.detailValue}>{selectedRequest.requestedByName || '-'}</Text>
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
                  <Text style={styles.detailLabel}>Sakin Notu</Text>
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
                    {visitor.stayStartDate && (
                      <Text style={styles.visitorDetailInfo}>📅 Kalış: {new Date(visitor.stayStartDate).toLocaleDateString('tr-TR')} ({visitor.stayDurationDays || 1} gün)</Text>
                    )}
                    {visitor.vehiclePlate && (
                      <Text style={styles.visitorDetailInfo}>🚗 {visitor.vehiclePlate}</Text>
                    )}
                    {visitor.itemNotes && (
                      <Text style={styles.visitorDetailNotes}>{visitor.itemNotes}</Text>
                    )}
                  </View>
                ))}
              </View>

              {selectedRequest.reviewedByName && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>
                      {selectedRequest.status === 'approved' ? 'Onaylayan' : 'Reddeden'}
                    </Text>
                    <Text style={styles.detailValue}>{selectedRequest.reviewedByName}</Text>
                    {selectedRequest.reviewedAt && (
                      <Text style={styles.detailSubValue}>{formatDate(selectedRequest.reviewedAt)}</Text>
                    )}
                  </View>

                  {selectedRequest.reviewNotes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>İnceleme Notu</Text>
                      <Text style={styles.detailValue}>{selectedRequest.reviewNotes}</Text>
                    </View>
                  )}
                </>
              )}

              {selectedRequest.status === 'pending' && (
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={styles.modalApproveButton}
                    onPress={() => {
                      setShowReviewModal(true);
                      setReviewAction('approve');
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                    <Text style={styles.modalApproveButtonText}>Onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalRejectButton}
                    onPress={() => {
                      setShowReviewModal(true);
                      setReviewAction('reject');
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ffffff" />
                    <Text style={styles.modalRejectButtonText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.reviewModal}>
            <Text style={styles.modalTitle}>
              {reviewAction === 'approve' ? 'Talebi Onayla' : 'Talebi Reddet'}
            </Text>

            <Text style={styles.reviewModalText}>
              {reviewAction === 'approve'
                ? 'Bu talebi onaylamak istediğinizden emin misiniz? Tüm ziyaretçiler sisteme eklenecektir.'
                : 'Bu talebi reddetmek istediğinizden emin misiniz?'}
            </Text>

            <Text style={styles.label}>Not (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reviewNotes}
              onChangeText={setReviewNotes}
              placeholder="İnceleme notunuz..."
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  reviewAction === 'approve' ? styles.modalButtonApprove : styles.modalButtonReject
                ]}
                onPress={handleSubmitReview}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {reviewAction === 'approve' ? 'Onayla' : 'Reddet'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
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
  apartmentBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  requestDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  visitorCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notesContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  visitorsList: {
    marginBottom: 12,
  },
  visitorName: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  moreVisitors: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  detailButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  modalApproveButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalApproveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalRejectButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalRejectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  reviewModal: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
  },
  reviewModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
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
  modalButtonApprove: {
    backgroundColor: '#4CAF50',
  },
  modalButtonReject: {
    backgroundColor: colors.error,
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
});




