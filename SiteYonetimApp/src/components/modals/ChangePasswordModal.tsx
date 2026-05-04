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
import { X, Lock, Eye, EyeOff, Save } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { apiClient } from '../../api/apiClient';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert(t('common.error'), 'Mevcut şifre gereklidir');
      return;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert(t('common.error'), 'Yeni şifre gereklidir');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert(t('common.error'), 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert(t('common.error'), 'Yeni şifre ve şifre tekrarı eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/users/me/password', formData);
      Alert.alert(t('common.success'), 'Şifre başarıyla değiştirildi');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to change password:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Şifre değiştirilemedi'
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
            <Text style={styles.title}>Şifre Değiştir</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {/* Current Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Mevcut Şifre</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.currentPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, currentPassword: text })
                  }
                  placeholder="Mevcut şifrenizi girin"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={colors.gray400} />
                  ) : (
                    <Eye size={20} color={colors.gray400} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.newPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, newPassword: text })
                  }
                  placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={colors.gray400} />
                  ) : (
                    <Eye size={20} color={colors.gray400} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  placeholder="Yeni şifrenizi tekrar girin"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.gray400} />
                  ) : (
                    <Eye size={20} color={colors.gray400} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                • Şifreniz en az 6 karakter olmalıdır{'\n'}
                • Güvenli bir şifre için harf, rakam ve özel karakter kullanın
              </Text>
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
                  <Text style={styles.saveButtonText}>Değiştir</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChangePasswordModal;

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
  eyeButton: {
    padding: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
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
