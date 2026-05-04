import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import {
  Package as PackageIcon,
  Search,
  CheckCircle2,
  Truck,
  QrCode,
  X,
  Bell,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { packageService, Package } from '../../services/package.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import ResidentNotificationModal from '../../components/modals/ResidentNotificationModal';

type TabKey = 'all' | 'waiting' | 'delivered';

const ResidentPackages = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPackageQRModal, setShowPackageQRModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [userQRToken, setUserQRToken] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [pendingPackages, setPendingPackages] = useState<Package[]>([]);

  useEffect(() => {
    loadPackages();
    loadPendingConfirmation();
  }, []);

  const loadPackages = async () => {
    if (!user?.apartmentId) {
      Alert.alert(
        'Kullanıcı Bilgileri Eksik',
        'Daire bilginiz eksik. Lütfen profil ayarlarınızdan daire bilginizi güncelleyin.',
        [
          { text: 'Tamam' }
        ]
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await packageService.getPackagesByApartment(user.apartmentId);
      setPackages(data);
    } catch (error) {
      console.error('Load packages error:', error);
      Alert.alert(t('common.error'), t('packages.noPackages'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPendingConfirmation = async () => {
    try {
      const data = await packageService.getPendingConfirmation();
      setPendingPackages(data);
      console.log('Pending confirmation packages:', data.length);
    } catch (error) {
      console.error('Load pending confirmation error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadPackages(), loadPendingConfirmation()]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleConfirmReceipt = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  const confirmReceipt = async () => {
    if (!selectedPackage) return;

    try {
      await packageService.confirmReceipt(selectedPackage.id);
      Alert.alert('Başarılı', 'Paket teslim alındı olarak işaretlendi');
      setShowConfirmModal(false);
      setSelectedPackage(null);
      await Promise.all([loadPackages(), loadPendingConfirmation()]);
    } catch (error: any) {
      console.error('Confirm receipt error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Paket onaylanamadı');
    }
  };

  const confirmAllReceipts = async () => {
    if (pendingPackages.length === 0) return;

    try {
      const packageIds = pendingPackages.map(pkg => pkg.id);
      await packageService.bulkConfirmReceipt(packageIds);
      
      Alert.alert(
        'Başarılı', 
        `${pendingPackages.length} paket teslim alındı olarak işaretlendi`,
        [
          {
            text: 'Tamam',
            onPress: async () => {
              await Promise.all([loadPackages(), loadPendingConfirmation()]);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Bulk confirm error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Paketler onaylanamadı');
    }
  };

  const handleShowMyQR = async () => {
    setLoadingQR(true);
    try {
      const token = await packageService.getMyQRToken();
      setUserQRToken(token);
      setShowQRModal(true);
    } catch (error) {
      console.error('Get QR token error:', error);
      Alert.alert('Hata', 'QR kod alınamadı');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleShowPackageQR = (pkg: Package) => {
    if (!pkg.qrToken) {
      Alert.alert('Hata', 'Bu paket için QR kod bulunamadı');
      return;
    }
    setSelectedPackage(pkg);
    setShowPackageQRModal(true);
  };

  const handleNotificationSuccess = () => {
    // Refresh packages after notification created
    loadPackages();
  };

  const filteredPackages = packages
    .filter(p => {
      if (activeTab === 'all') return true;
      if (activeTab === 'waiting') {
        return p.status === 'waiting' || 
               p.status === 'beklemede' || 
               p.status === 'teslim_bekliyor' || 
               p.status === 'waiting_confirmation';
      }
      if (activeTab === 'delivered') {
        return p.status === 'delivered' || p.status === 'teslim_edildi';
      }
      return p.status === activeTab;
    })
    .filter(p => {
      const trackingNum = p.trackingNumber || p.trackingMasked || '';
      return trackingNum.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const waitingCount = packages.filter(p => 
    p.status === 'waiting' || 
    p.status === 'beklemede' || 
    p.status === 'teslim_bekliyor' || 
    p.status === 'waiting_confirmation'
  ).length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR');
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
          <PackageIcon size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('packages.myPackages')}</Text>
          <Text style={styles.headerSubtitle}>{waitingCount} {t('packages.waitingPackages')}</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            style={styles.notificationButton}
            onPress={() => setShowNotificationModal(true)}
          >
            <Bell size={20} color={colors.success} />
          </Pressable>
          <Pressable
            style={styles.qrButton}
            onPress={handleShowMyQR}
            disabled={loadingQR}
          >
            {loadingQR ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <QrCode size={24} color={colors.primary} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >

        {/* Pending Confirmation Section */}
        {pendingPackages.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.pendingSectionHeader}>
              <Text style={styles.pendingSectionTitle}>⏳ Onay Bekleyen Paketler</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingPackages.length}</Text>
              </View>
            </View>
            <Text style={styles.pendingSectionSubtitle}>
              Güvenlik bu paketleri size teslim etti. Lütfen onaylayın.
            </Text>
            
            {pendingPackages.map(pkg => (
              <View key={pkg.id} style={styles.pendingCard}>
                <View style={styles.pendingCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.pendingCardTitle}>{pkg.courierName || pkg.courierCompany}</Text>
                      {pkg.aiExtracted && (
                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>🤖 AI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pendingCardTracking}>{pkg.trackingMasked || pkg.trackingNumber}</Text>
                  </View>
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => handleConfirmReceipt(pkg)}
                  >
                    <CheckCircle2 size={20} color={colors.white} />
                    <Text style={styles.confirmButtonText}>Teslim Aldım</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            
            {/* Bulk Confirm Button */}
            {pendingPackages.length > 1 && (
              <Pressable
                style={styles.bulkConfirmButton}
                onPress={confirmAllReceipts}
              >
                <CheckCircle2 size={20} color={colors.white} />
                <Text style={styles.bulkConfirmButtonText}>
                  Tümünü Onayla ({pendingPackages.length})
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.searchWrapper}>
          <Search size={16} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            placeholder={t('packages.trackingSearch')}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tabsWrapper}>
          {(['all', 'waiting', 'delivered'] as TabKey[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? t('common.all') : tab === 'waiting' ? t('packages.waiting') : t('packages.delivered')}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredPackages.length === 0 ? (
          <View style={styles.emptyState}>
            <PackageIcon size={48} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>{t('packages.noPackages')}</Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {filteredPackages.map(pkg => {
              const isWaiting = pkg.status === 'waiting' || 
                               pkg.status === 'beklemede' || 
                               pkg.status === 'teslim_bekliyor' || 
                               pkg.status === 'waiting_confirmation';
              return (
                <View key={pkg.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={[styles.statusIconWrapper, isWaiting ? styles.statusIconWarning : styles.statusIconSuccess]}>
                      {isWaiting ? (
                        <Truck size={20} color="#d97706" />
                      ) : (
                        <CheckCircle2 size={20} color="#16a34a" />
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleWrap}>
                          <Text style={styles.cardTitle}>{pkg.courierName || pkg.courierCompany}</Text>
                          <Text style={styles.cardTracking} numberOfLines={1}>
                            {pkg.trackingMasked || pkg.trackingNumber}
                          </Text>
                          {pkg.aiExtracted && (
                            <View style={styles.aiBadge}>
                              <Text style={styles.aiBadgeText}>🤖 AI ile kaydedildi</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {isWaiting && pkg.qrToken && (
                            <Pressable
                              style={styles.packageQRButton}
                              onPress={() => handleShowPackageQR(pkg)}
                            >
                              <QrCode size={16} color={colors.primary} />
                            </Pressable>
                          )}
                          <View style={[styles.badge, isWaiting ? styles.badgeSecondary : styles.badgePrimary]}>
                            <Text style={[styles.badgeText, !isWaiting && styles.badgeTextOnPrimary]}>
                              {isWaiting ? t('packages.waiting') : t('packages.delivered')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.cardFooterRow}>
                        <Text style={styles.cardMetaText}>
                          {t('packages.received')}: {formatDate(pkg.recordedAt || pkg.receivedDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* User QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Benim QR Kodum</Text>
              <Pressable onPress={() => setShowQRModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              {userQRToken && (
                <QRCode
                  value={userQRToken}
                  size={200}
                  backgroundColor="white"
                />
              )}
            </View>
            <Text style={styles.qrInstruction}>
              Güvenlik görevlisine bu QR kodu gösterin
            </Text>
            <Text style={styles.qrSubInstruction}>
              Güvenlik paketlerinizi listeleyip size teslim edecektir
            </Text>
          </View>
        </View>
      </Modal>

      {/* Package QR Code Modal */}
      <Modal
        visible={showPackageQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPackageQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paket QR Kodu</Text>
              <Pressable onPress={() => setShowPackageQRModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              {selectedPackage?.qrToken && (
                <QRCode
                  value={selectedPackage.qrToken}
                  size={200}
                  backgroundColor="white"
                />
              )}
            </View>
            <View style={styles.packageQRInfo}>
              <Text style={styles.packageQRLabel}>Kargo:</Text>
              <Text style={styles.packageQRValue}>{selectedPackage?.courierName || selectedPackage?.courierCompany}</Text>
            </View>
            <View style={styles.packageQRInfo}>
              <Text style={styles.packageQRLabel}>Takip No:</Text>
              <Text style={styles.packageQRValue}>{selectedPackage?.trackingMasked || selectedPackage?.trackingNumber}</Text>
            </View>
            <Text style={styles.qrInstruction}>
              Teslim alırken güvenlik görevlisine bu QR kodu okutun
            </Text>
            <Text style={styles.qrSubInstruction}>
              QR kod okutulduğunda paket teslim edilmiş olarak işaretlenecektir
            </Text>
          </View>
        </View>
      </Modal>

      {/* Confirm Receipt Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paket Teslim Onayı</Text>
              <Pressable onPress={() => setShowConfirmModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <Text style={styles.confirmModalText}>
              Bu paketi teslim aldığınızı onaylıyor musunuz?
            </Text>
            {selectedPackage && (
              <View style={styles.confirmPackageInfo}>
                <View style={styles.packageQRInfo}>
                  <Text style={styles.packageQRLabel}>Kargo:</Text>
                  <Text style={styles.packageQRValue}>{selectedPackage.courierName || selectedPackage.courierCompany}</Text>
                </View>
                <View style={styles.packageQRInfo}>
                  <Text style={styles.packageQRLabel}>Takip No:</Text>
                  <Text style={styles.packageQRValue}>{selectedPackage.trackingMasked || selectedPackage.trackingNumber}</Text>
                </View>
              </View>
            )}
            <View style={styles.confirmModalActions}>
              <Pressable
                style={styles.confirmModalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmModalCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={styles.confirmModalConfirmButton}
                onPress={confirmReceipt}
              >
                <CheckCircle2 size={20} color={colors.white} />
                <Text style={styles.confirmModalConfirmText}>Teslim Aldım</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resident Notification Modal */}
      <ResidentNotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={handleNotificationSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.screenPaddingHorizontal, paddingVertical: spacing.lg, paddingBottom: 100, rowGap: spacing.sectionGap },
  searchWrapper: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 10, top: '50%', marginTop: -8 },
  searchInput: { borderRadius: 999, borderWidth: 0, backgroundColor: '#f3f4f6', paddingLeft: 32, paddingRight: 12, paddingVertical: 8, fontSize: 14, color: colors.textPrimary },
  tabsWrapper: { flexDirection: 'row', borderRadius: 999, backgroundColor: '#f3f4f6', padding: 3 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 999 },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 12, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 8, fontSize: 13, color: colors.textSecondary },
  listSpace: { rowGap: 10 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statusIconWrapper: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statusIconWarning: { backgroundColor: 'rgba(245,158,11,0.12)' },
  statusIconSuccess: { backgroundColor: 'rgba(22,163,74,0.12)' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', columnGap: 8 },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  cardTracking: { marginTop: 2, fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeSecondary: { backgroundColor: '#e5e7eb' },
  badgePrimary: { backgroundColor: colors.primary },
  badgeText: { fontSize: 10, color: colors.textPrimary },
  badgeTextOnPrimary: { color: colors.white },
  cardFooterRow: { marginTop: 8 },
  cardMetaText: { fontSize: 11, color: colors.textSecondary },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrInstruction: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  qrSubInstruction: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  packageQRButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageQRInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  packageQRLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  packageQRValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  pendingSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  pendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pendingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  pendingSectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  pendingCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingCardTracking: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  confirmModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  confirmPackageInfo: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  confirmModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmModalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  confirmModalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  bulkConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  bulkConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  aiBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ResidentPackages;
