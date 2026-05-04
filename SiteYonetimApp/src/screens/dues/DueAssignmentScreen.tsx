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
  FlatList,
} from 'react-native';
import {
  Users,
  ChevronDown,
  Calendar,
  X,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { dueService } from '../../services/due.service';

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

// Generate years (current year - 1 to current year + 5)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

// Generate payment days (1-31)
const paymentDays = Array.from({ length: 31 }, (_, i) => i + 1);

const DueAssignmentScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [amount, setAmount] = useState('1500');
  const [currency, setCurrency] = useState('TRY');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(2); // Mart (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [paymentDay, setPaymentDay] = useState(15);
  const [excludedBlocks, setExcludedBlocks] = useState<string[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  
  // Modal states
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPaymentDayModal, setShowPaymentDayModal] = useState(false);
  
  // Ödeme Bilgileri
  const [bankName, setBankName] = useState('Ziraat Bankası');
  const [iban, setIban] = useState('TR33 0001 0000 0000 0000 0000 01');
  const [accountHolder, setAccountHolder] = useState(user?.siteName || 'Site Yönetimi');

  useEffect(() => {
    loadApartments();
  }, [user?.siteId]);

  const loadApartments = async () => {
    if (!user?.siteId) return;

    try {
      setLoadingApartments(true);
      const apartmentData = await dueService.getApartments(user.siteId);
      setApartments(apartmentData);
      
      // Blokları çıkar
      const uniqueBlocks = [...new Set(apartmentData.map(apt => apt.blockName || 'A Blok'))];
      setBlocks(uniqueBlocks);
      
      console.log('Apartments loaded:', apartmentData.length);
      console.log('Blocks found:', uniqueBlocks);
    } catch (error) {
      console.error('Load apartments error:', error);
      Alert.alert('Hata', 'Apartmanlar yüklenemedi');
    } finally {
      setLoadingApartments(false);
    }
  };

  const getFilteredApartments = () => {
    return apartments.filter(apt => {
      const blockName = apt.blockName || 'A Blok';
      return !excludedBlocks.includes(blockName);
    });
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

    const filteredApartments = getFilteredApartments();
    if (filteredApartments.length === 0) {
      Alert.alert('Uyarı', 'Aidat atanacak daire bulunamadı');
      return;
    }

    setIsLoading(true);
    try {
      // Aidat tarihini hesapla
      const dueDate = new Date(selectedYear, selectedMonth, paymentDay);
      
      // Toplu aidat ataması
      const apartmentIds = filteredApartments.map(apt => apt.id);
      const description = `${months[selectedMonth]} ${selectedYear} Aidatı`;
      
      await dueService.createBulkDues({
        apartmentIds,
        amount: parseFloat(amount),
        dueDate: dueDate.toISOString().split('T')[0],
        description
      }, user?.siteId || '1');
      
      Alert.alert(
        'Başarılı',
        `${filteredApartments.length} daireye ${months[selectedMonth]} ${selectedYear} aidatı atandı`,
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Assign dues error:', error);
      Alert.alert('Hata', error?.message || 'Aidat ataması yapılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingApartments) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Apartmanlar yükleniyor...</Text>
      </View>
    );
  }

  const totalApartments = getFilteredApartments().length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Toplu Aidat Ata</Text>
          <Text style={styles.headerSubtitle}>
            {user?.siteName || 'Site'} - {apartments.length} daire
          </Text>
        </View>

        {/* Aidat Tutarı */}
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
            <View style={styles.currencyDropdown}>
              <Text style={styles.currencyText}>{currency}</Text>
            </View>
          </View>
        </View>

        {/* Aidat Dönemi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aidat Dönemi</Text>
          <View style={styles.periodButtons}>
            {periods.map(period => (
              <Pressable
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Başlangıç Dönemi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Başlangıç Dönemi</Text>
          <View style={styles.dateRow}>
            <Pressable 
              style={styles.dateDropdown}
              onPress={() => setShowMonthModal(true)}
            >
              <Text style={styles.dateText}>{months[selectedMonth]}</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.dateDropdown}
              onPress={() => setShowYearModal(true)}
            >
              <Text style={styles.dateText}>{selectedYear}</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Son Ödeme Günü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Ödeme Günü</Text>
          <Pressable 
            style={styles.paymentDayDropdown}
            onPress={() => setShowPaymentDayModal(true)}
          >
            <Text style={styles.paymentDayText}>{paymentDay}. günü</Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Ödeme Bilgileri */}
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

        {/* Hariç Tutulacak Bloklar */}
        {blocks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hariç Tutulacak Bloklar</Text>
            <View style={styles.blockButtons}>
              {blocks.map(block => {
                const isExcluded = excludedBlocks.includes(block);
                return (
                  <Pressable
                    key={block}
                    style={[
                      styles.blockButton,
                      isExcluded && styles.blockButtonExcluded,
                    ]}
                    onPress={() => toggleBlock(block)}
                  >
                    <Text
                      style={[
                        styles.blockButtonText,
                        isExcluded && styles.blockButtonTextExcluded,
                      ]}
                    >
                      {block}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Özet */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Atanacak Daire Sayısı</Text>
            <Text style={styles.summaryValue}>{totalApartments}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dönem</Text>
            <Text style={styles.summaryValue}>
              {periods.find(p => p.value === selectedPeriod)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam Tutar</Text>
            <Text style={styles.summaryValue}>
              ₺{(totalApartments * parseFloat(amount || '0')).toLocaleString('tr-TR')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Atama Butonu */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.assignButton, (isLoading || totalApartments === 0) && styles.assignButtonDisabled]}
          onPress={handleAssign}
          disabled={isLoading || totalApartments === 0}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Users size={20} color={colors.white} />
              <Text style={styles.assignButtonText}>
                {totalApartments} Daireye Aidat Ata
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Month Selection Modal */}
      <Modal
        visible={showMonthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ay Seçin</Text>
              <Pressable onPress={() => setShowMonthModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={months}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedMonth === index && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(index);
                    setShowMonthModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedMonth === index && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Year Selection Modal */}
      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yıl Seçin</Text>
              <Pressable onPress={() => setShowYearModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedYear === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedYear(item);
                    setShowYearModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedYear === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Day Selection Modal */}
      <Modal
        visible={showPaymentDayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ödeme Günü Seçin</Text>
              <Pressable onPress={() => setShowPaymentDayModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={paymentDays}
              keyExtractor={(item) => item.toString()}
              numColumns={7}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.dayItem,
                    paymentDay === item && styles.dayItemSelected,
                  ]}
                  onPress={() => {
                    setPaymentDay(item);
                    setShowPaymentDayModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dayItemText,
                      paymentDay === item && styles.dayItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPaddingHorizontal,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  amountInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  amountInput: {
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
    padding: 0,
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencyText: {
    fontSize: fontSize.inputText,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateText: {
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  paymentDayDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  paymentDayText: {
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  paymentInfoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  paymentInfoInputGroup: {
    marginBottom: spacing.md,
  },
  paymentInfoInputLabel: {
    fontSize: fontSize.cardSubtitle,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  paymentInfoInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  blockButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  blockButtonExcluded: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
  },
  blockButtonText: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  blockButtonTextExcluded: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  summarySection: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.screenPaddingHorizontal,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.button,
  },
  assignButtonDisabled: {
    opacity: 0.5,
  },
  assignButtonText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalItem: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalItemText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  dayItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayItemText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
  },
  dayItemTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});

export default DueAssignmentScreen;