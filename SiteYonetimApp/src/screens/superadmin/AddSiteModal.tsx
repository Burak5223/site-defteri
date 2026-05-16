import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Building2, MapPin, Phone, Mail } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { siteService } from '../../services/site.service';

interface AddSiteModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ visible, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    phone: '',
    email: '',
    subscriptionStatus: 'aktif',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.city) {
      Alert.alert(t('common.error'), 'Lütfen zorunlu alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await siteService.createSite(formData);
      Alert.alert(t('common.success'), 'Site başarıyla eklendi');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        district: '',
        postalCode: '',
        phone: '',
        email: '',
        subscriptionStatus: 'aktif',
      });
    } catch (error: any) {
      console.error('Failed to add site:', error);
      Alert.alert(t('common.error'), error?.message || 'Site eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Yeni Site Ekle</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Site Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Site Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Güneş Sitesi"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adres *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tam adres"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* City & District */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Şehir *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="İstanbul"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>İlçe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kadıköy"
                  value={formData.district}
                  onChangeText={(text) => setFormData({ ...formData, district: text })}
                />
              </View>
            </View>

            {/* Postal Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Posta Kodu</Text>
              <TextInput
                style={styles.input}
                placeholder="34000"
                value={formData.postalCode}
                onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="+90 555 123 4567"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="site@example.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Subscription Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Abonelik Durumu</Text>
              <View style={styles.radioGroup}>
                <Pressable
                  style={[
                    styles.radioButton,
                    formData.subscriptionStatus === 'aktif' && styles.radioButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, subscriptionStatus: 'aktif' })}
                >
                  <Text
                    style={[
                      styles.radioButtonText,
                      formData.subscriptionStatus === 'aktif' && styles.radioButtonTextActive,
                    ]}
                  >
                    Aktif
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.radioButton,
                    formData.subscriptionStatus === 'pasif' && styles.radioButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, subscriptionStatus: 'pasif' })}
                >
                  <Text
                    style={[
                      styles.radioButtonText,
                      formData.subscriptionStatus === 'pasif' && styles.radioButtonTextActive,
                    ]}
                  >
                    Pasif
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Building2 size={18} color={colors.white} />
                  <Text style={styles.submitButtonText}>Site Ekle</Text>
                </>
              )}
            </Pressable>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddSiteModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md + 2,
    zIndex: 1,
  },
  inputWithPadding: {
    paddingLeft: spacing.md + 26,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radioButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  radioButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  bottomSpace: {
    height: spacing.xl,
  },
});
