import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  Users,
  ChevronDown,
  CreditCard,
  Wallet,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { dueService, Due } from '../../services/due.service';
import { useAuth } from '../../context/AuthContext';

const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const periods = [
  { label: '1 Ay', value: 1 },
  { label: '3 Ay', value: 3 },
  { label: '6 Ay', value: 6 },
  { label: '1 Yıl', value: 12 },
];

const blocks = ['A Blok', 'B Blok', 'C Blok'];

function DuesScreen() {
  const { hasRole, user } = useAuth();
  
  // Rol kontrolü
  const isAdmin = hasRole('ADMIN') || hasRole('SUPER_ADMIN');
  const isResident = hasRole('RESIDENT');
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dues, setDues] = useState<Due[]>([]);
  
  // Admin: Aidat Atama Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('1500');
  const [currency] = useState('TRY');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedMonth] = useState(2);
  const [selectedYear] = useState(2026);
  const [paymentDay] = useState(15);
  const [excludedBlocks, setExcludedBlocks] = useState<string[]>([]);
  const [totalApartments] = useState(6);
  const [bankName, setBankName] = useState('Ziraat Bankası');
  const [iban, setIban] = useState('TR33 0001 0000 0000 0000 0000 01');
  const [accountHolder, setAccountHolder] = useState('Yeşil Vadi Sitesi');
  
  // Sakin: Ödeme Modal
  const [selectedDue, setSelectedDue] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    loadDues();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadDues = async () => {
    if (!user?.siteId) {
      setLoading(false);
      return;
    }

    try {
      // Admin tüm aidatları, Sakin sadece kendininkini görür
      const data = isAdmin 
        ? await dueService.getAllDues(user.siteId)
        : await dueService.getMyDues();
      setDues(data);
    } catch (error) {
      console.error('Load dues error:', error);
      Alert.alert('Hata', 'Aidatlar yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDues();
  };

  const toggleBlock = (block: string) => {
    setExcludedBlocks(prev =>
      prev.includes(block) ? prev.filter(b => b !== block) : [...prev, block]
    );
  };

  const handleAssign = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir tutar girin');
      return;
    }

    if (!user?.siteId) {
      Alert.alert('Hata', 'Site bilgisi bulunamadı');
      return;
    }

    setIsLoading(true);
    try {
      const apartmentIds = ['apt1', 'apt2', 'apt3', 'apt4', 'apt5', 'apt6'];
      const dueDate = new Date(selectedYear, selectedMonth, paymentDay).toISOString().split('T')[0];
      
      await dueService.createBulkDues({
        apartmentIds,
        amount: parseFloat(amount),
        dueDate,
        description: `${months[selectedMonth]} ${selectedYear} Aidatı`,
      }, user?.siteId || '1');
      
      Alert.alert(
        'Başarılı',
        `${totalApartments} daireye ${months[selectedMonth]} ${selectedYear} aidatı atandı`,
        [{ text: 'Tamam', onPress: () => { setShowAssignModal(false); loadDues(); } }]
      );
    } catch (error) {
      console.error('Assign dues error:', error);
      Alert.alert('Hata', 'Aidat ataması yapılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayDue = (due: any) => {
    setSelectedDue(due);
    setPaymentModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: colors.successLight, text: colors.successDark, label: 'Ödendi' };
      case 'pending': return { bg: colors.warningLight, text: colors.warningDark, label: 'Bekliyor' };
      case 'overdue': return { bg: colors.errorLight, text: colors.errorDark, label: 'Gecikmiş' };
      default: return { bg: colors.gray200, text: colors.textSecondary, label: status };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Sakin için özet hesaplamaları
  const totalDebt = isResident ? dues.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.amount, 0) : 0;
  const totalPaid = isResident ? dues.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0) : 0;

  return (
    <View style={styles.container}>
      {/* Header - Rol bazlı */}
      {isResident && (
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Wallet size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Aidatlarım</Text>
            <Text style={styles.headerSubtitle}>Aidat takip ve ödeme</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Sakin: Özet Kartlar */}
        {isResident && (
          <>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.white }]}>
                  <CreditCard size={20} color={colors.error} />
                </View>
                <Text style={styles.summaryLabel}>TOPLAM BORÇ</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>₺{totalDebt.toLocaleString('tr-TR')},00</Text>
                <Text style={styles.summarySubtitle}>{dues.filter(d => d.status !== 'paid').length} aidat</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.white }]}>
                  <CheckCircle size={20} color={colors.success} />
                </View>
                <Text style={styles.summaryLabel}>ÖDENEN</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>₺{totalPaid.toLocaleString('tr-TR')},00</Text>
                <Text style={styles.summarySubtitle}>Bu yıl</Text>
              </View>
            </View>

            <Pressable style={styles.financeInfoCard}>
              <View style={[styles.financeInfoIcon, { backgroundColor: colors.primaryLight }]}>
                <Wallet size={20} color={colors.primary} />
              </View>
              <View style={styles.financeInfoContent}>
                <Text style={styles.financeInfoTitle}>Site Finansal Durumu</Text>
                <Text style={styles.financeInfoSubtitle}>Gelir, gider ve bütçe şeffaflığı</Text>
              </View>
            </Pressable>

            <Pressable style={styles.payAllButton}>
              <CreditCard size={20} color={colors.white} />
              <Text style={styles.payAllButtonText}>Tüm Borçları Öde</Text>
            </Pressable>

            <Text style={styles.payAllHint}>Birden fazla ay seçmek için aidatlara tıklayın</Text>

            <View style={styles.filterRow}>
              <Pressable style={[styles.filterButton, styles.filterButtonActive]}>
                <Text style={[styles.filterButtonText, styles.filterButtonTextActive]}>Tümü</Text>
              </Pressable>
              <Pressable style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Bekleyen</Text>
              </Pressable>
              <Pressable style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Gecikmiş</Text>
              </Pressable>
              <Pressable style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Ödenen</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Aidat Listesi - Her iki rol için */}
        <View style={styles.listSpace}>
          {dues.map(due => {
            const statusInfo = getStatusColor(due.status);
            
            return (
              <View key={due.id} style={isResident ? styles.dueCardResident : styles.dueCard}>
                <View style={isResident ? styles.dueCardHeader : styles.dueCardHeaderAdmin}>
                  <View style={styles.dueCardLeft}>
                    {isResident && (
                      due.status === 'paid' ? (
                        <View style={[styles.dueCardIcon, { backgroundColor: colors.successLight }]}>
                          <CheckCircle size={20} color={colors.success} />
                        </View>
                      ) : (
                        <View style={[styles.dueCardIcon, { backgroundColor: statusInfo.bg }]}>
                          <CreditCard size={20} color={statusInfo.text} />
                        </View>
                      )
                    )}
                    {isAdmin && (
                      <View style={styles.dueIcon}>
                        <CreditCard size={24} color={colors.gray500} />
                      </View>
                    )}
                    <View style={styles.dueInfo}>
                      <Text style={styles.dueMonth}>{due.month} {due.year}</Text>
                      <Text style={styles.dueDate}>Son ödeme: {formatDate(due.dueDate)}</Text>
                    </View>
                  </View>
                  <View style={styles.dueRight}>
                    <Text style={styles.dueAmount}>₺{due.amount.toLocaleString('tr-TR')},00</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Sakin: Ödeme Butonları */}
                {isResident && (
                  <>
                    {due.status !== 'paid' && (
                      <Pressable style={styles.payButton} onPress={() => handlePayDue(due)}>
                        <Text style={styles.payButtonText}>Öde</Text>
                      </Pressable>
                    )}
                    {due.status === 'paid' && (
                      <Pressable style={styles.downloadButton}>
                        <Text style={styles.downloadButtonText}>Makbuz İndir</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Admin: Toplu Aidat Ata Butonu */}
      {isAdmin && (
        <View style={styles.footer}>
          <Pressable style={styles.assignButton} onPress={() => setShowAssignModal(true)}>
            <Users size={20} color={colors.white} />
            <Text style={styles.assignButtonText}>Toplu Aidat Ata</Text>
          </Pressable>
        </View>
      )}

      {/* Admin: Aidat Atama Modal */}
      {isAdmin && (
        <Modal visible={showAssignModal} transparent animationType="slide" onRequestClose={() => setShowAssignModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Toplu Aidat Ata</Text>
                  <Text style={styles.modalHeaderSubtitle}>Tüm dairelere tek seferde aidat atayın</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Aidat Tutarı</Text>
                  <View style={styles.amountRow}>
                    <View style={styles.amountInputWrapper}>
                      <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="1500"
                      />
                    </View>
                    <Pressable style={styles.currencyDropdown}>
                      <Text style={styles.currencyText}>{currency}</Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Aidat Dönemi</Text>
                  <View style={styles.periodButtons}>
                    {periods.map(period => (
                      <Pressable
                        key={period.value}
                        style={[styles.periodButton, selectedPeriod === period.value && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod(period.value)}
                      >
                        <Text style={[styles.periodButtonText, selectedPeriod === period.value && styles.periodButtonTextActive]}>
                          {period.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Başlangıç Dönemi</Text>
                  <View style={styles.dateRow}>
                    <Pressable style={styles.dateDropdown}>
                      <Text style={styles.dateText}>{months[selectedMonth]}</Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable style={styles.dateDropdown}>
                      <Text style={styles.dateText}>{selectedYear}</Text>
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Son Ödeme Günü</Text>
                  <Pressable style={styles.paymentDayDropdown}>
                    <Text style={styles.paymentDayText}>Her ayın {paymentDay}. günü</Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
                  <View style={styles.paymentInfoCard}>
                    <View style={styles.paymentInfoInputGroup}>
                      <Text style={styles.paymentInfoInputLabel}>Banka Adı</Text>
                      <TextInput
                        style={styles.paymentInfoInput}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="Banka adı girin"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.paymentInfoInputGroup}>
                      <Text style={styles.paymentInfoInputLabel}>IBAN</Text>
                      <TextInput
                        style={styles.paymentInfoInput}
                        value={iban}
                        onChangeText={setIban}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.paymentInfoInputGroup}>
                      <Text style={styles.paymentInfoInputLabel}>Hesap Sahibi</Text>
                      <TextInput
                        style={styles.paymentInfoInput}
                        value={accountHolder}
                        onChangeText={setAccountHolder}
                        placeholder="Hesap sahibi adı girin"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hariç Tutulacak Bloklar</Text>
                  <View style={styles.blockButtons}>
                    {blocks.map(block => {
                      const isExcluded = excludedBlocks.includes(block);
                      return (
                        <Pressable
                          key={block}
                          style={[styles.blockButton, isExcluded && styles.blockButtonExcluded]}
                          onPress={() => toggleBlock(block)}
                        >
                          <Text style={[styles.blockButtonText, isExcluded && styles.blockButtonTextExcluded]}>
                            {block}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Atanacak Daire Sayısı</Text>
                    <Text style={styles.summaryRowValue}>{totalApartments}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Dönem</Text>
                    <Text style={styles.summaryRowValue}>
                      {periods.find(p => p.value === selectedPeriod)?.label}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable style={styles.secondaryButton} onPress={() => setShowAssignModal(false)}>
                  <Text style={styles.secondaryButtonText}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[styles.assignButton, isLoading && styles.assignButtonDisabled]}
                  onPress={handleAssign}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Users size={20} color={colors.white} />
                      <Text style={styles.assignButtonText}>{totalApartments} Daireye Aidat Ata</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Sakin: Ödeme Modal */}
      {isResident && (
        <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentPayment}>
              <View style={styles.modalHeaderPayment}>
                <Text style={styles.modalTitle}>Aidat Ödemesi</Text>
                <Pressable onPress={() => setPaymentModalVisible(false)}>
                  <X size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Ödeme detayları</Text>

              {selectedDue && (
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Seçili Aidatlar</Text>
                    <View style={styles.modalTabs}>
                      <Pressable style={[styles.modalTab, styles.modalTabActive]}>
                        <Text style={[styles.modalTabText, styles.modalTabTextActive]}>Şubat</Text>
                      </Pressable>
                      <Pressable style={styles.modalTab}>
                        <Text style={styles.modalTabText}>Aralık</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.modalSectionTitle}>Ödeme Yöntemi Seçin</Text>

                  <Pressable style={styles.paymentMethod}>
                    <View style={[styles.paymentMethodIcon, { backgroundColor: colors.primaryLight }]}>
                      <CreditCard size={20} color={colors.primary} />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodTitle}>Kredi/Banka Kartı</Text>
                      <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, Troy</Text>
                    </View>
                    <View style={styles.paymentMethodRadio} />
                  </Pressable>

                  <View style={styles.modalFooterPayment}>
                    <Pressable style={styles.modalCancelButton} onPress={() => setPaymentModalVisible(false)}>
                      <Text style={styles.modalCancelButtonText}>Geri</Text>
                    </Pressable>
                    <Pressable style={styles.modalPayButton}>
                      <Text style={styles.modalPayButtonText}>Devam Et</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default DuesScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundSecondary },
  
  // Sakin Header
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  
  // Sakin: Özet Kartlar
  summaryGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  summaryCard: { flex: 1, borderRadius: borderRadius.card, padding: spacing.lg },
  summaryIcon: { width: 36, height: 36, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  summaryLabel: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: fontWeight.bold, marginBottom: 2 },
  summarySubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  
  financeInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  financeInfoIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  financeInfoContent: { flex: 1 },
  financeInfoTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  financeInfoSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  
  payAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button, marginBottom: spacing.sm },
  payAllButtonText: { fontSize: fontSize.buttonTextLg, fontWeight: fontWeight.semibold, color: colors.white },
  payAllHint: { fontSize: fontSize.cardMeta, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterButtonText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  filterButtonTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  
  // Liste
  listSpace: { gap: spacing.md },
  
  // Admin: Aidat Kartı
  dueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  dueIcon: { width: 48, height: 48, borderRadius: borderRadius.xl, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  
  // Sakin: Aidat Kartı
  dueCardResident: { backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  dueCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  dueCardHeaderAdmin: { flexDirection: 'row', alignItems: 'center' },
  dueCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dueCardIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  dueInfo: { flex: 1 },
  dueMonth: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  dueDate: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  dueRight: { alignItems: 'flex-end' },
  dueAmount: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: borderRadius.pill },
  statusText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold },
  
  // Sakin: Ödeme Butonları
  payButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.button, alignItems: 'center' },
  payButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  downloadButton: { backgroundColor: colors.gray100, paddingVertical: spacing.md, borderRadius: borderRadius.button, alignItems: 'center' },
  downloadButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  
  // Admin: Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.screenPaddingHorizontal, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  assignButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button },
  assignButtonDisabled: { opacity: 0.5 },
  assignButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  
  // Admin: Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius['3xl'], borderTopRightRadius: borderRadius['3xl'], maxHeight: '90%' },
  modalScroll: { maxHeight: 500 },
  modalScrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 20 },
  modalHeader: { marginBottom: spacing.xl },
  modalHeaderTitle: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  modalHeaderSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.sectionTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  
  amountRow: { flexDirection: 'row', gap: spacing.md },
  amountInputWrapper: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  amountInput: { fontSize: fontSize.inputText, color: colors.textPrimary, padding: 0 },
  currencyDropdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  currencyText: { fontSize: fontSize.inputText, fontWeight: fontWeight.medium, color: colors.textPrimary },
  
  periodButtons: { flexDirection: 'row', gap: spacing.md },
  periodButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  periodButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodButtonText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.textPrimary },
  periodButtonTextActive: { color: colors.white },
  
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateDropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  dateText: { fontSize: fontSize.inputText, color: colors.textPrimary },
  
  paymentDayDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  paymentDayText: { fontSize: fontSize.inputText, color: colors.textPrimary },
  
  paymentInfoCard: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary },
  paymentInfoInputGroup: { marginBottom: spacing.md },
  paymentInfoInputLabel: { fontSize: fontSize.cardSubtitle, fontWeight: fontWeight.medium, color: colors.primary, marginBottom: spacing.sm },
  paymentInfoInput: { backgroundColor: colors.white, borderRadius: borderRadius.input, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.inputText, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  
  blockButtons: { flexDirection: 'row', gap: spacing.md },
  blockButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  blockButtonExcluded: { backgroundColor: colors.gray100, borderColor: colors.gray300 },
  blockButtonText: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.textPrimary },
  blockButtonTextExcluded: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  
  summarySection: { backgroundColor: colors.gray50, borderRadius: borderRadius.card, padding: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  summaryRowLabel: { fontSize: fontSize.cardTitle, color: colors.textSecondary },
  summaryRowValue: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.screenPaddingHorizontal, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  secondaryButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  
  // Sakin: Ödeme Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentPayment: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, padding: spacing.xl, maxHeight: '80%' },
  modalHeaderPayment: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginBottom: spacing.lg },
  modalBody: {},
  modalRow: { marginBottom: spacing.lg },
  modalLabel: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginBottom: spacing.sm },
  modalTabs: { flexDirection: 'row', gap: spacing.sm },
  modalTab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: colors.gray100 },
  modalTabActive: { backgroundColor: colors.primary },
  modalTabText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  modalTabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  modalSectionTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 2, borderColor: colors.primary },
  paymentMethodIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  paymentMethodInfo: { flex: 1 },
  paymentMethodTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  paymentMethodSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  paymentMethodRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary },
  modalFooterPayment: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalCancelButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.gray100, alignItems: 'center' },
  modalCancelButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  modalPayButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.primary, alignItems: 'center' },
  modalPayButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
});
