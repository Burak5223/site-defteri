import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, UserPlus, Mail, User, Phone, Building2, Key, Eye, EyeOff } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { superAdminService, SiteWithStats } from '../../services/superadmin.service';

interface AddManagerModalProps {
  visible: boolean;
  siteId: string | null;
  sites: SiteWithStats[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddManagerModal: React.FC<AddManagerModalProps> = ({
  visible,
  siteId,
  sites,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    siteId: siteId || '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.email || !formData.fullName || !formData.phone || !formData.password || !formData.siteId) {
      Alert.alert(t('common.error'), 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert(t('common.error'), 'Geçerli bir email adresi girin');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert(t('common.error'), 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await superAdminService.createManager(formData);
      Alert.alert(t('common.success'), 'Yönetici başarıyla eklendi');
      setFormData({ email: '', fullName: '', phone: '', password: '', siteId: siteId || '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create manager:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Yönetici eklenemedi'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === formData.siteId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <UserPlus size={24} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Yeni Yönetici Ekle</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Site Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Site *</Text>
              <View style={styles.inputContainer}>
                <Building2 size={18} color={colors.textSecondary} />
                <Text style={styles.selectedSiteText}>
                  {selectedSite ? selectedSite.name : 'Site seçin'}
                </Text>
              </View>
              {!siteId && (
                <ScrollView horizontal style={styles.siteChips}>
                  {sites.map((site) => (
                    <Pressable
                      key={site.id}
                      style={[
                        styles.siteChip,
                        formData.siteId === site.id && styles.siteChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, siteId: site.id })}
                    >
                      <Text
                        style={[
                          styles.siteChipText,
                          formData.siteId === site.id && styles.siteChipTextActive,
                        ]}
                      >
                        {site.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ad Soyad *</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Ahmet Yılmaz"
                  placeholderTextColor={colors.gray400}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={colors.gray400}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefon *</Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="+90 555 123 4567"
                  placeholderTextColor={colors.gray400}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Şifre *</Text>
              <View style={styles.inputContainer}>
                <Key size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Yönetici şifresi"
                  placeholderTextColor={colors.gray400}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Yönetici bu email ve şifre ile sisteme giriş yapabilecektir.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <UserPlus size={18} color={colors.white} />
                  <Text style={styles.buttonPrimaryText}>Ekle</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddManagerModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    height: '95%',
    maxWidth: 500,
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
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    padding: 0,
  },
  passwordToggle: {
    padding: spacing.xs,
  },
  selectedSiteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  siteChips: {
    marginTop: spacing.sm,
  },
  siteChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  siteChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  siteChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  siteChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buttonSecondary: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
