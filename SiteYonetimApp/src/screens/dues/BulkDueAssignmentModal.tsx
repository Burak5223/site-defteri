import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { X, Users, ChevronDown } from 'lucide-react-native';
import { colors } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkDueAssignmentModal = ({ visible, onClose, onSuccess }: Props) => {
  const [amount, setAmount] = useState('0');
  const [apartmentCount] = useState(6);
  const [periodType, setPeriodType] = useState('1 Ay');

  const periods = ['1 Ay', '3 Ay', '6 Ay', '1 Yıl'];

  const handleAssign = () => {
    // Blok kontrolü kaldırıldı - Tüm siteye aidat atanabilir
    Alert.alert(
      'Başarılı',
      `${apartmentCount} daireye aidat atandı`,
      [{ text: 'Tamam', onPress: onSuccess }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Toplu Aidat Ata</Text>
              <Text style={styles.modalSubtitle}>Tüm dairelere tek seferde aidat atayın</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Aidat Tutarı */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Aidat Tutarı</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Pressable style={styles.currencyButton}>
                  <Text style={styles.currencyText}>₺ TRY</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </Pressable>
              </View>
            </View>

            {/* Aidat Dönemi */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Aidat Dönemi</Text>
              <View style={styles.periodButtons}>
                {periods.map((p) => (
                  <Pressable
                    key={p}
                    style={[
                      styles.periodButton,
                      periodType === p && styles.periodButtonActive
                    ]}
                    onPress={() => setPeriodType(p)}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      periodType === p && styles.periodButtonTextActive
                    ]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.periodHint}>Her ay için aynı aidat oluşturulacak</Text>
            </View>

            {/* Başlangıç Dönemi */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Başlangıç Dönemi</Text>
              <View style={styles.dateRow}>
                <Pressable style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Mart</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </Pressable>
                <Pressable style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>2026</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </Pressable>
              </View>
            </View>

            {/* Son Ödeme Günü */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Son Ödeme Günü</Text>
              <Pressable style={styles.dueDayButton}>
                <Text style={styles.dueDayText}>Her ayın 15. günü</Text>
                <ChevronDown size={16} color="#6b7280" />
              </Pressable>
            </View>

            {/* Ödeme Bilgileri */}
            <View style={styles.paymentInfo}>
              <View style={styles.paymentInfoHeader}>
                <Text style={styles.paymentInfoTitle}>💳 Ödeme Bilgileri</Text>
              </View>
              <View style={styles.paymentInfoContent}>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Banka Adı</Text>
                  <TextInput
                    style={styles.paymentInfoInput}
                    placeholder="Ziraat Bankası"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>IBAN</Text>
                  <TextInput
                    style={styles.paymentInfoInput}
                    placeholder="TR12 3456 7890 1234 5678 9012 34"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Hesap Sahibi</Text>
                  <TextInput
                    style={styles.paymentInfoInput}
                    placeholder="Örn: Yeşil Vadi Sitesi Yönetimi"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    💡 Bu bilgiler sakinlerin ödeme ekranında görüntülenecektir
                  </Text>
                </View>
              </View>
            </View>

            {/* Özet */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Atanacak Daire Sayısı</Text>
                <Text style={styles.summaryValue}>{apartmentCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dönem</Text>
                <Text style={styles.summaryValue}>1 Aylık</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.modalFooter}>
            <Pressable style={styles.assignButton} onPress={handleAssign}>
              <Users size={20} color="#ffffff" />
              <Text style={styles.assignButtonText}>6 Daireye Aidat Ata</Text>
            </Pressable>
          </View>
        </View>
    </Modal>
  );
};

export default BulkDueAssignmentModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  periodButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  periodHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  dueDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  dueDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  paymentInfo: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1f4e8',
    backgroundColor: '#f0fdf9',
    overflow: 'hidden',
  },
  paymentInfoHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d1f4e8',
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentInfoContent: {
    padding: 16,
  },
  paymentInfoRow: {
    marginBottom: 16,
  },
  paymentInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  paymentInfoInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1f4e8',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  warningBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
  },
  blockButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  blockButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  blockButtonSelected: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  blockButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  blockButtonTextSelected: {
    color: '#1f2937',
  },
  summary: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
