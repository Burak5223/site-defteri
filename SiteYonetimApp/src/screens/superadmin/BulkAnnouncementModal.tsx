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
import { X, Megaphone, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { superAdminService } from '../../services/superadmin.service';

interface BulkAnnouncementModalProps {
  visible: boolean;
  totalSites: number;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkAnnouncementModal: React.FC<BulkAnnouncementModalProps> = ({
  visible,
  totalSites,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.content) {
      Alert.alert(t('common.error'), 'Lütfen başlık ve içerik girin');
      return;
    }

    Alert.alert(
      'Toplu Duyuru',
      `Bu duyuru ${totalSites} siteye gönderilecek. Onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await superAdminService.sendBulkAnnouncement(formData);
              Alert.alert(
                t('common.success'),
                `Duyuru ${result.successCount}/${result.totalSites} siteye başarıyla gönderildi`
              );
              setFormData({ title: '', content: '', priority: 'normal' });
              onSuccess();
              onClose();
            } catch (error: any) {
              console.error('Failed to send bulk announcement:', error);
              Alert.alert(
                t('common.error'),
                error?.message || 'Duyuru gönderilemedi'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const priorities = [
    { value: 'normal', label: 'Normal', icon: Info, color: colors.primary },
    { value: 'high', label: 'Önemli', icon: AlertCircle, color: colors.warning },
    { value: 'urgent', label: 'Acil', icon: AlertTriangle, color: colors.error },
  ];

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
                <Megaphone size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Toplu Duyuru</Text>
                <Text style={styles.modalSubtitle}>{totalSites} siteye gönderilecek</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Priority Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Öncelik *</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => {
                  const Icon = priority.icon;
                  const isSelected = formData.priority === priority.value;
                  return (
                    <Pressable
                      key={priority.value}
                      style={[
                        styles.priorityChip,
                        isSelected && {
                          backgroundColor: `${priority.color}20`,
                          borderColor: priority.color,
                        },
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          priority: priority.value as any,
                        })
                      }
                    >
                      <Icon
                        size={16}
                        color={isSelected ? priority.color : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.priorityText,
                          isSelected && { color: priority.color, fontWeight: '600' },
                        ]}
                      >
                        {priority.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="Duyuru başlığı"
                placeholderTextColor={colors.gray400}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                maxLength={100}
              />
              <Text style={styles.charCount}>{formData.title.length}/100</Text>
            </View>

            {/* Content */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>İçerik *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Duyuru içeriği..."
                placeholderTextColor={colors.gray400}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{formData.content.length}/500</Text>
            </View>

            {/* Warning Box */}
            <View style={styles.warningBox}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Bu duyuru tüm sitelere gönderilecektir. Lütfen içeriği kontrol edin.
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
                  <Megaphone size={18} color={colors.white} />
                  <Text style={styles.buttonPrimaryText}>Gönder</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BulkAnnouncementModal;

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
  modalSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
  priorityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  priorityText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.sm,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.warningDark,
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
