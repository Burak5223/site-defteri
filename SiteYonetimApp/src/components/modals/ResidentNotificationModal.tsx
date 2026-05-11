import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Package as PackageIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { packageService, ResidentNotificationRequest } from '../../services/package.service';
import { useAuth } from '../../context/AuthContext';

interface ResidentNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ResidentNotificationModal: React.FC<ResidentNotificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [cargoCompany, setCargoCompany] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill fullName and apartmentNumber from user profile
  useEffect(() => {
    if (visible && user) {
      // Use fullName from user profile
      setFullName(user.fullName || '');
      
      // Format apartment number as "Block UnitNumber" (e.g., "A Blok 12")
      const apartment = user.blockName && user.unitNumber 
        ? `${user.blockName} ${user.unitNumber}`
        : '';
      setApartmentNumber(apartment);
    }
  }, [visible, user]);

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('⚠️ Eksik Bilgi', 'Ad Soyad alanı zorunludur', [{ text: 'Tamam' }]);
      return;
    }

    if (!user?.userId || !user?.siteId || !user?.apartmentId) {
      Alert.alert(
        '⚠️ Kullanıcı Bilgileri Eksik', 
        'Lütfen çıkış yapıp tekrar giriş yapın. Kullanıcı bilgileriniz güncellenecektir.',
        [
          { text: 'Tamam' }
        ]
      );
      return;
    }

    setLoading(true);

    try {
      const request: ResidentNotificationRequest = {
        residentId: user.userId,
        siteId: user.siteId,
        apartmentId: user.apartmentId,
        fullName: fullName.trim(),
        cargoCompany: cargoCompany.trim() || undefined,
        expectedDate: expectedDate.trim() || undefined,
      };

      const response = await packageService.createResidentNotification(request);

      if (response.success) {
        Alert.alert(
          '✅ Başarılı',
          'Kargo bildirimi oluşturuldu. Kargonuz geldiğinde size bildirim gönderilecektir.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      } else {
        const errorMsg = response.errorMessage || 'Bildirim oluşturulamadı, lütfen tekrar deneyin';
        Alert.alert('❌ Bildirim Hatası', errorMsg, [{ text: 'Tamam' }]);
      }
    } catch (error: any) {
      console.error('Create notification error:', error);
      
      // Detailed error messages
      let errorMessage = 'Bildirim oluşturulamadı, lütfen tekrar deneyin';
      
      if (error.message?.includes('Network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Bağlantı hatası, lütfen internet bağlantınızı kontrol edin';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı, lütfen tekrar deneyin';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('❌ Bağlantı Hatası', errorMessage, [{ text: 'Tamam' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFullName('');
    setApartmentNumber('');
    setCargoCompany('');
    setExpectedDate('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerIcon}>
              <PackageIcon size={20} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Kargom Var</Text>
            <Pressable onPress={handleClose} disabled={loading}>
              <X size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Kargonuz geldiğinde size bildirim göndermemiz için bilgilerinizi girin.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                Ad Soyad <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            {/* Apartment Number */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                Daire Numarası <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={apartmentNumber}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.hint}>
                Daire numaranız otomatik olarak doldurulmuştur
              </Text>
            </View>

            {/* Cargo Company */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Kargo Şirketi (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                value={cargoCompany}
                onChangeText={setCargoCompany}
                placeholder="Örn: Yurtiçi Kargo, Aras Kargo"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            {/* Expected Date */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Beklenen Tarih (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                value={expectedDate}
                onChangeText={setExpectedDate}
                placeholder="GG/AA/YYYY"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
              <Text style={styles.hint}>
                Kargonuzun ne zaman geleceğini biliyorsanız girebilirsiniz
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Gönder</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ResidentNotificationModal;
