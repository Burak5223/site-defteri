import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  UserPlus,
  FileText,
  Megaphone,
  X,
  Download,
  Send,
} from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useI18n } from '../../context/I18nContext';

interface SuperAdminQuickActionsProps {
  navigation: any;
}

const SuperAdminQuickActions: React.FC<SuperAdminQuickActionsProps> = ({ navigation }) => {
  const { t } = useI18n();
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Manager Form
  const [managerForm, setManagerForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    siteId: '',
  });

  // Report Form
  const [reportForm, setReportForm] = useState({
    reportType: 'financial',
    reportName: '',
    siteId: '',
    startDate: '',
    endDate: '',
    fileFormat: 'pdf',
  });

  // Announcement Form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetType: 'all_sites',
    targetSiteIds: [],
  });

  const quickActions = [
    {
      id: 'add-manager',
      title: 'Yönetici Ekle',
      subtitle: 'Siteye yeni yönetici atayın',
      icon: UserPlus,
      color: colors.primary,
      onPress: () => setShowManagerModal(true),
    },
    {
      id: 'generate-report',
      title: 'Rapor Oluştur',
      subtitle: 'Finansal ve operasyonel raporlar',
      icon: FileText,
      color: colors.info,
      onPress: () => setShowReportModal(true),
    },
    {
      id: 'bulk-announcement',
      title: 'Toplu Duyuru',
      subtitle: 'Tüm sitelere duyuru gönderin',
      icon: Megaphone,
      color: colors.warning,
      onPress: () => setShowAnnouncementModal(true),
    },
  ];

  const handleAddManager = async () => {
    if (!managerForm.email || !managerForm.password || !managerForm.fullName || !managerForm.siteId) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/super-admin/managers', managerForm);
      Alert.alert('Başarılı', 'Yönetici başarıyla eklendi');
      setShowManagerModal(false);
      setManagerForm({ email: '', password: '', fullName: '', phone: '', siteId: '' });
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Yönetici eklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportForm.reportName || !reportForm.startDate || !reportForm.endDate) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/super-admin/reports', reportForm);
      Alert.alert('Başarılı', 'Rapor oluşturma işlemi başlatıldı');
      setShowReportModal(false);
      setReportForm({
        reportType: 'financial',
        reportName: '',
        siteId: '',
        startDate: '',
        endDate: '',
        fileFormat: 'pdf',
      });
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Rapor oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik girin');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/super-admin/bulk-announcements', announcementForm);
      Alert.alert('Başarılı', 'Duyuru tüm sitelere gönderildi');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'normal',
        targetType: 'all_sites',
        targetSiteIds: [],
      });
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Duyuru gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hızlı İşlemler</Text>
          <Text style={styles.headerSubtitle}>Sık kullanılan yönetim işlemleri</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Manager Modal */}
      <Modal visible={showManagerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yönetici Ekle</Text>
              <Pressable onPress={() => setShowManagerModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                value={managerForm.email}
                onChangeText={(text) => setManagerForm({ ...managerForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={managerForm.password}
                onChangeText={(text) => setManagerForm({ ...managerForm, password: text })}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                value={managerForm.fullName}
                onChangeText={(text) => setManagerForm({ ...managerForm, fullName: text })}
              />

              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                placeholder="+90 555 123 4567"
                value={managerForm.phone}
                onChangeText={(text) => setManagerForm({ ...managerForm, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Site ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Site ID"
                value={managerForm.siteId}
                onChangeText={(text) => setManagerForm({ ...managerForm, siteId: text })}
              />

              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleAddManager}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <UserPlus size={18} color={colors.white} />
                    <Text style={styles.submitButtonText}>Yönetici Ekle</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rapor Oluştur</Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Rapor Tipi</Text>
              <View style={styles.radioGroup}>
                {['financial', 'operational', 'performance'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.radioButton,
                      reportForm.reportType === type && styles.radioButtonActive,
                    ]}
                    onPress={() => setReportForm({ ...reportForm, reportType: type })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        reportForm.reportType === type && styles.radioButtonTextActive,
                      ]}
                    >
                      {type === 'financial' ? 'Finansal' : type === 'operational' ? 'Operasyonel' : 'Performans'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Rapor Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Ocak 2026 Finansal Rapor"
                value={reportForm.reportName}
                onChangeText={(text) => setReportForm({ ...reportForm, reportName: text })}
              />

              <Text style={styles.inputLabel}>Başlangıç Tarihi</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={reportForm.startDate}
                onChangeText={(text) => setReportForm({ ...reportForm, startDate: text })}
              />

              <Text style={styles.inputLabel}>Bitiş Tarihi</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={reportForm.endDate}
                onChangeText={(text) => setReportForm({ ...reportForm, endDate: text })}
              />

              <Text style={styles.inputLabel}>Format</Text>
              <View style={styles.radioGroup}>
                {['pdf', 'excel'].map((format) => (
                  <Pressable
                    key={format}
                    style={[
                      styles.radioButton,
                      reportForm.fileFormat === format && styles.radioButtonActive,
                    ]}
                    onPress={() => setReportForm({ ...reportForm, fileFormat: format })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        reportForm.fileFormat === format && styles.radioButtonTextActive,
                      ]}
                    >
                      {format.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Download size={18} color={colors.white} />
                    <Text style={styles.submitButtonText}>Rapor Oluştur</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Announcement Modal */}
      <Modal visible={showAnnouncementModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toplu Duyuru</Text>
              <Pressable onPress={() => setShowAnnouncementModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Başlık</Text>
              <TextInput
                style={styles.input}
                placeholder="Duyuru başlığı"
                value={announcementForm.title}
                onChangeText={(text) => setAnnouncementForm({ ...announcementForm, title: text })}
              />

              <Text style={styles.inputLabel}>İçerik</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Duyuru içeriği"
                value={announcementForm.content}
                onChangeText={(text) => setAnnouncementForm({ ...announcementForm, content: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Öncelik</Text>
              <View style={styles.radioGroup}>
                {['urgent', 'important', 'normal', 'info'].map((priority) => (
                  <Pressable
                    key={priority}
                    style={[
                      styles.radioButton,
                      announcementForm.priority === priority && styles.radioButtonActive,
                    ]}
                    onPress={() => setAnnouncementForm({ ...announcementForm, priority })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        announcementForm.priority === priority && styles.radioButtonTextActive,
                      ]}
                    >
                      {priority === 'urgent' ? 'Acil' : priority === 'important' ? 'Önemli' : priority === 'normal' ? 'Normal' : 'Bilgi'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSendAnnouncement}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Send size={18} color={colors.white} />
                    <Text style={styles.submitButtonText}>Duyuru Gönder</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SuperAdminQuickActions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
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
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  radioButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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
  },
  radioButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
