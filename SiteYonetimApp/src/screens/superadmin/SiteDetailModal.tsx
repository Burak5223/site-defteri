import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Building2,
  Users,
  Home,
  MapPin,
  CheckCircle,
  XCircle,
  UserPlus,
  Eye,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { superAdminService, SiteWithStats, Manager } from '../../services/superadmin.service';

interface SiteDetailModalProps {
  visible: boolean;
  site: SiteWithStats | null;
  onClose: () => void;
  onAddManager: (siteId: string) => void;
  onEditSite?: (site: SiteWithStats) => void;
}

const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  visible,
  site,
  onClose,
  onAddManager,
  onEditSite,
}) => {
  const { t } = useI18n();
  const navigation = useNavigation<any>();
  const { login, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);

  useEffect(() => {
    if (visible && site) {
      loadSiteManagers();
    }
  }, [visible, site]);

  const loadSiteManagers = async () => {
    if (!site) return;
    
    setLoading(true);
    try {
      const managersData = await superAdminService.getAllManagers(site.id);
      setManagers(managersData);
    } catch (error: any) {
      console.error('Failed to load managers:', error);
      Alert.alert(t('common.error'), 'Yöneticiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!site) return;

    Alert.alert(
      'Admin Olarak Görüntüle',
      `${site.name} sitesinin admin paneline geçmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam Et',
          onPress: async () => {
            setImpersonating(true);
            try {
              // Save original user data BEFORE impersonation
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const originalUserData = await AsyncStorage.getItem('user');
              const originalToken = await AsyncStorage.getItem('accessToken');
              
              if (originalUserData && originalToken) {
                await AsyncStorage.setItem('originalUser', originalUserData);
                await AsyncStorage.setItem('originalToken', originalToken);
                console.log('✅ Original user data saved');
              }
              
              const response = await superAdminService.impersonateSiteAdmin(site.id);
              
              // Store the impersonation data
              await AsyncStorage.setItem('accessToken', response.accessToken);
              await AsyncStorage.setItem('user', JSON.stringify(response.user));
              await AsyncStorage.setItem('isImpersonating', 'true');
              await AsyncStorage.setItem('originalRole', 'ROLE_SUPER_ADMIN');
              
              // Update auth context with new user data
              const newUserData = {
                ...response.user,
                roles: response.roles,
                userId: response.userId,
                siteId: response.siteId,
              };
              
              // Refresh the auth context to trigger navigation change
              await refreshUser();
              
              onClose();
              
              // Show success message
              setTimeout(() => {
                Alert.alert(
                  'Başarılı',
                  `${site.name} sitesinin admin paneline geçiş yaptınız. Çıkış yaparak Super Admin paneline dönebilirsiniz.`
                );
              }, 500);
              
            } catch (error: any) {
              console.error('Failed to impersonate:', error);
              Alert.alert(
                t('common.error'),
                error?.message || 'Admin olarak görüntüleme başarısız'
              );
            } finally {
              setImpersonating(false);
            }
          },
        },
      ]
    );
  };

  if (!site) return null;

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
                <Building2 size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{site.name}</Text>
                <Text style={styles.modalSubtitle}>{site.city}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status Badge */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  site.subscriptionStatus === 'aktif'
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                {site.subscriptionStatus === 'aktif' ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <XCircle size={16} color={colors.error} />
                )}
                <Text
                  style={[
                    styles.statusText,
                    site.subscriptionStatus === 'aktif'
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {site.subscriptionStatus === 'aktif' ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>

            {/* Impersonate Button */}
            <View style={styles.impersonateContainer}>
              <Pressable
                style={styles.impersonateButton}
                onPress={handleImpersonate}
                disabled={impersonating}
              >
                {impersonating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Eye size={18} color={colors.white} />
                    <Text style={styles.impersonateButtonText}>
                      Admin Olarak Görüntüle
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={styles.impersonateHint}>
                Bu siteyi admin hesabıyla görüntüleyin
              </Text>
            </View>

            {/* Site Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Site Bilgileri</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={colors.textSecondary} />
                  <Text style={styles.infoLabel}>Adres</Text>
                </View>
                <Text style={styles.infoValue}>{site.address || 'Belirtilmemiş'}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Home size={20} color={colors.primary} />
                  <Text style={styles.statValue}>{site.totalApartments}</Text>
                  <Text style={styles.statLabel}>Daire</Text>
                </View>
                <View style={styles.statCard}>
                  <Users size={20} color={colors.success} />
                  <Text style={styles.statValue}>{site.totalResidents}</Text>
                  <Text style={styles.statLabel}>Sakin</Text>
                </View>
              </View>
            </View>

            {/* Managers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Yöneticiler</Text>
                <View style={styles.sectionActions}>
                  {onEditSite && (
                    <Pressable
                      style={styles.editButton}
                      onPress={() => onEditSite(site)}
                    >
                      <Eye size={16} color={colors.primary} />
                      <Text style={styles.editButtonText}>Düzenle</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.addButton}
                    onPress={() => onAddManager(site.id)}
                  >
                    <UserPlus size={18} color={colors.white} />
                    <Text style={styles.addButtonText}>Ekle</Text>
                  </Pressable>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : managers.length > 0 ? (
                managers.map((manager) => (
                  <View key={manager.userId} style={styles.managerCard}>
                    <View style={styles.managerIcon}>
                      <Users size={18} color={colors.primary} />
                    </View>
                    <View style={styles.managerInfo}>
                      <Text style={styles.managerName}>{manager.fullName}</Text>
                      <Text style={styles.managerEmail}>{manager.email}</Text>
                      <Text style={styles.managerPhone}>{manager.phone}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Users size={32} color={colors.gray300} />
                  <Text style={styles.emptyText}>Henüz yönetici eklenmemiş</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SiteDetailModal;

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  statusContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  statusActive: {
    backgroundColor: colors.successLight,
  },
  statusInactive: {
    backgroundColor: colors.errorLight,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statusTextActive: {
    color: colors.successDark,
  },
  statusTextInactive: {
    color: colors.errorDark,
  },
  impersonateContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  impersonateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    minWidth: 200,
  },
  impersonateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  impersonateHint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginLeft: 26,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  managerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  managerEmail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  managerPhone: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
