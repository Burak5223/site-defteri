import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, User, Mail, Phone, Save } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { apiClient } from '../../api/apiClient';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    fullName: string;
    email: string;
    phone: string;
  };
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('site');
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
  });

  // E-posta otomatik oluşturma fonksiyonu
  const generateEmail = (fullName: string, site: string) => {
    const cleanName = fullName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    const cleanSite = site
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    return `${cleanName}@${cleanSite}.com`;
  };

  // Site bilgisini al
  React.useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const userResponse = await apiClient.get<{ siteId?: number; name?: string }>('/users/me');
        if (userResponse.siteId) {
          const siteResponse = await apiClient.get<{ name?: string }>(`/sites/${userResponse.siteId}`);
          setSiteName(siteResponse.name || 'site');
        }
      } catch (error) {
        console.log('Site bilgisi alınamadı');
      }
    };
    
    if (visible) {
      fetchSiteInfo();
    }
  }, [visible]);

  // Update form data when modal opens or currentUser changes
  React.useEffect(() => {
    if (visible) {
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
    }
  }, [visible, currentUser]);

  // İsim değiştiğinde e-postayı otomatik güncelle
  const handleNameChange = (newName: string) => {
    setFormData(prev => ({
      ...prev,
      fullName: newName,
      email: generateEmail(newName, siteName),
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert(t('common.error'), 'İsim-Soyisim gereklidir');
      return;
    }

    // E-postayı tekrar oluştur (güncel site adı ile)
    const updatedEmail = generateEmail(formData.fullName, siteName);

    setLoading(true);
    try {
      await apiClient.put('/users/me', {
        ...formData,
        email: updatedEmail,
      });
      Alert.alert(t('common.success'), 'Profil başarıyla güncellendi');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Profil güncellenemedi'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profili Düzenle</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>İsim-Soyisim</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={handleNameChange}
                  placeholder="İsim-Soyisim"
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>

            {/* Email - Otomatik oluşturuluyor */}
            <View style={styles.field}>
              <Text style={styles.label}>E-posta (Otomatik)</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Mail size={20} color={colors.gray400} />
                <TextInput
                  style={[styles.input, styles.disabledText]}
                  value={formData.email}
                  editable={false}
                  placeholder="E-posta otomatik oluşturulacak"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              <Text style={styles.helpText}>
                E-posta isminize göre otomatik oluşturulur
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Telefon"
                  placeholderTextColor={colors.gray400}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Save size={20} color={colors.white} />
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  disabledInput: {
    backgroundColor: colors.gray100,
  },
  disabledText: {
    color: colors.gray500,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.gray100,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
