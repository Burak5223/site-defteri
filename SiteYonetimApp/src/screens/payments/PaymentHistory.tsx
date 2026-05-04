import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import {
  Receipt,
  Download,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  CreditCard,
  Building2,
  Banknote,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { paymentService, Payment } from '../../services/payment.service';
import { useI18n } from '../../context/I18nContext';
import {
  formatAmount,
  formatPaymentDate,
  getPaymentMethodName,
  getPaymentStatusName,
  getPaymentStatusColor,
  getPaymentStatusIcon,
  getPaymentMethodIcon,
} from '../../utils/paymentHelpers';

const PaymentHistory = () => {
  const { t } = useI18n();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentService.getMyPayments();
      setPayments(data);
    } catch (error) {
      console.error('Load payments error:', error);
      Alert.alert('Hata', 'Ödeme geçmişi yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const showReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptModalVisible(true);
  };

  const downloadReceipt = async (payment: Payment) => {
    try {
      Alert.alert(
        'Makbuz İndir',
        'Ödeme makbuzunuzu PDF olarak indirmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'İndir',
            onPress: async () => {
              try {
                // Generate PDF HTML
                const html = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .info { margin: 10px 0; }
                        .label { font-weight: bold; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>ÖDEME MAKBUZU</h1>
                        <p>Makbuz No: ${payment.receiptNumber}</p>
                      </div>
                      <div class="info"><span class="label">Tutar:</span> ${formatAmount(payment.amount)}</div>
                      <div class="info"><span class="label">Tarih:</span> ${formatPaymentDate(payment.paymentDate)}</div>
                      <div class="info"><span class="label">Ödeme Yöntemi:</span> ${getPaymentMethodName(payment.paymentMethod)}</div>
                      <div class="info"><span class="label">Durum:</span> ${getPaymentStatusName(payment.status)}</div>
                    </body>
                  </html>
                `;
                
                const { uri } = await Print.printToFileAsync({ html });
                
                // Dosya adı oluştur
                const fileName = `Makbuz_${payment.receiptNumber}_${Date.now()}.pdf`;
                
                // Android için Downloads klasörüne kaydet
                if (Platform.OS === 'android') {
                  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  
                  if (permissions.granted) {
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                      encoding: FileSystem.EncodingType.Base64,
                    });
                    
                    await FileSystem.StorageAccessFramework.createFileAsync(
                      permissions.directoryUri,
                      fileName,
                      'application/pdf'
                    )
                      .then(async (fileUri) => {
                        await FileSystem.writeAsStringAsync(fileUri, base64, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                      });
                    
                    Alert.alert('Başarılı', `Makbuz indirildi:\n${fileName}`);
                  } else {
                    Alert.alert('Hata', 'Dosya kaydetme izni verilmedi');
                  }
                } else {
                  // iOS için Documents klasörüne kaydet
                  const documentsDir = FileSystem.documentDirectory;
                  const newUri = `${documentsDir}${fileName}`;
                  
                  await FileSystem.copyAsync({
                    from: uri,
                    to: newUri,
                  });
                  
                  Alert.alert('Başarılı', `Makbuz kaydedildi:\n${fileName}\n\nDosyalar uygulamasından erişebilirsiniz.`);
                }
              } catch (error) {
                console.error('PDF generation error:', error);
                Alert.alert('Hata', 'Makbuz oluşturulurken bir hata oluştu');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Download receipt error:', error);
      Alert.alert('Hata', 'Makbuz indirilemedi');
    }
  };

  const getFilteredPayments = () => {
    if (filterStatus === 'all') return payments;
    return payments.filter(p => p.status === filterStatus);
  };

  const filteredPayments = getFilteredPayments();

  const getPaymentMethodIconComponent = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard size={20} color={colors.primary} />;
      case 'transfer':
        return <Building2 size={20} color={colors.primary} />;
      case 'cash':
        return <Banknote size={20} color={colors.primary} />;
      default:
        return <CreditCard size={20} color={colors.primary} />;
    }
  };

  const getStatusIconComponent = (status: string) => {
    switch (status) {
      case 'tamamlandi':
        return <CheckCircle size={20} color={colors.success} />;
      case 'bekliyor':
        return <Clock size={20} color={colors.warning} />;
      case 'basarisiz':
      case 'iptal_edildi':
        return <XCircle size={20} color={colors.error} />;
      default:
        return <Clock size={20} color={colors.warning} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Receipt size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Ödeme Geçmişi</Text>
          <Text style={styles.headerSubtitle}>{payments.length} ödeme kaydı</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <Pressable
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
            Tümü
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterStatus === 'tamamlandi' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('tamamlandi')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'tamamlandi' && styles.filterButtonTextActive]}>
            Tamamlandı
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterStatus === 'bekliyor' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('bekliyor')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'bekliyor' && styles.filterButtonTextActive]}>
            Bekliyor
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterStatus === 'basarisiz' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('basarisiz')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'basarisiz' && styles.filterButtonTextActive]}>
            Başarısız
          </Text>
        </Pressable>
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>Ödeme kaydı bulunamadı</Text>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {filteredPayments.map(payment => {
              const statusColor = getPaymentStatusColor(payment.status);
              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentCardHeader}>
                    <View style={styles.paymentCardLeft}>
                      <View style={[styles.paymentIcon, { backgroundColor: colors.primaryLight }]}>
                        {getPaymentMethodIconComponent(payment.paymentMethod)}
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentMethod}>
                          {getPaymentMethodName(payment.paymentMethod)}
                        </Text>
                        <Text style={styles.paymentDate}>
                          {formatPaymentDate(payment.paymentDate || payment.createdAt)}
                        </Text>
                        {payment.receiptNumber && (
                          <Text style={styles.receiptNumber}>
                            Dekont: {payment.receiptNumber}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.paymentCardRight}>
                      <Text style={styles.paymentAmount}>
                        {formatAmount(payment.amount)}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        {getStatusIconComponent(payment.status)}
                        <Text style={styles.statusText}>
                          {getPaymentStatusName(payment.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {payment.installmentCount && payment.installmentCount > 1 && (
                    <View style={styles.installmentInfo}>
                      <Text style={styles.installmentText}>
                        {payment.installmentCount} Taksit
                      </Text>
                    </View>
                  )}

                  <View style={styles.paymentActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => showReceipt(payment)}
                    >
                      <Receipt size={16} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Dekont Görüntüle</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => downloadReceipt(payment)}
                    >
                      <Download size={16} color={colors.primary} />
                      <Text style={styles.actionButtonText}>İndir</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ödeme Dekontu</Text>
              <Pressable onPress={() => setReceiptModalVisible(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {selectedPayment && (
              <ScrollView style={styles.receiptContent}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIconContainer}>
                    <CheckCircle size={48} color={colors.success} />
                  </View>
                  <Text style={styles.receiptTitle}>ÖDEME BAŞARILI</Text>
                  <Text style={styles.receiptAmount}>
                    {formatAmount(selectedPayment.amount)}
                  </Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptDetails}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>İşlem No:</Text>
                    <Text style={styles.receiptValue}>{selectedPayment.receiptNumber}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Tarih:</Text>
                    <Text style={styles.receiptValue}>
                      {formatPaymentDate(selectedPayment.paymentDate || selectedPayment.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Ödeme Yöntemi:</Text>
                    <Text style={styles.receiptValue}>
                      {getPaymentMethodName(selectedPayment.paymentMethod)}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Durum:</Text>
                    <Text style={[styles.receiptValue, { color: getPaymentStatusColor(selectedPayment.status) }]}>
                      {getPaymentStatusName(selectedPayment.status)}
                    </Text>
                  </View>
                  {selectedPayment.installmentCount && selectedPayment.installmentCount > 1 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Taksit:</Text>
                      <Text style={styles.receiptValue}>
                        {selectedPayment.installmentCount} Taksit
                      </Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Para Birimi:</Text>
                    <Text style={styles.receiptValue}>{selectedPayment.currencyCode}</Text>
                  </View>
                </View>

                <View style={styles.receiptFooter}>
                  <Text style={styles.receiptFooterText}>
                    Bu dekont ödeme işleminizin kanıtıdır.
                  </Text>
                </View>
              </ScrollView>
            )}

            <Pressable
              style={styles.downloadButton}
              onPress={() => selectedPayment && downloadReceipt(selectedPayment)}
            >
              <Download size={20} color={colors.white} />
              <Text style={styles.downloadButtonText}>Dekont İndir</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
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
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  content: { flex: 1 },
  scrollContent: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  paymentsList: { gap: spacing.md },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentInfo: { flex: 1 },
  paymentMethod: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  receiptNumber: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
  paymentCardRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    fontSize: fontSize.cardMeta,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  installmentInfo: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  installmentText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.infoDark,
    fontWeight: fontWeight.medium,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primaryLight,
  },
  actionButtonText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  receiptModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.cardLg,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  receiptContent: {
    padding: spacing.xl,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  receiptIconContainer: {
    marginBottom: spacing.md,
  },
  receiptTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  receiptAmount: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  receiptDetails: {
    gap: spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  receiptValue: {
    fontSize: fontSize.cardSubtitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  receiptFooter: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  receiptFooterText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    margin: spacing.xl,
    borderRadius: borderRadius.button,
  },
  downloadButtonText: {
    fontSize: fontSize.buttonTextLg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default PaymentHistory;
