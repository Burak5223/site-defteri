import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Activity,
  FileText,
  Settings,
  Crown,
  X,
  Check,
  Edit,
  Key,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import type { Language } from '../../i18n/translations';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';
import EditProfileModal from '../../components/modals/EditProfileModal';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  siteId?: number;
  username?: string;
}

const SuperAdminProfile = () => {
  const { user, logout } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullName: user?.fullName || 'Super Admin',
    email: user?.email || 'superadmin@site.com',
    phone: user?.phone || '',
  });
  const [siteName, setSiteName] = useState('site');

  // E-posta otomatik oluşturma fonksiyonu
  const generateEmail = (fullName: string, site: string) => {
    // İsmi temizle: boşlukları kaldır, küçük harfe çevir, Türkçe karakterleri değiştir
    const cleanName = fullName
      .toLowerCase()
      .replace(/\s+/g, '') // Boşlukları kaldır
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    // Site adını temizle
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

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await apiClient.get<UserProfile>('/users/me');
      
      // Site bilgisini al
      let userSiteName = 'site';
      try {
        const siteResponse = await apiClient.get<{ name?: string }>(`/sites/${user?.siteId || profile.siteId}`);
        userSiteName = siteResponse.name || 'site';
        setSiteName(userSiteName);
      } catch (error) {
        console.log('Site bilgisi alınamadı, varsayılan kullanılıyor');
      }

      // Otomatik e-posta oluştur
      const autoEmail = generateEmail(profile.fullName || 'Super Admin', userSiteName);

      setCurrentUser({
        fullName: profile.fullName || 'Super Admin',
        email: autoEmail,
        phone: profile.phone || '',
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'tr', flag: '🇹🇷', name: t('languages.tr') },
    { code: 'en', flag: '🇬🇧', name: t('languages.en') },
    { code: 'ru', flag: '🇷🇺', name: t('languages.ru') },
    { code: 'ar', flag: '🇸🇦', name: t('languages.ar') },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageSelect = async (lang: Language) => {
    try {
      await changeLanguage(lang);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('common.error'), t('profile.logoutError'));
            }
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Profil Bilgileri',
      items: [
        {
          icon: User,
          label: 'İsim-Soyisim',
          value: currentUser.fullName,
          onPress: () => setEditProfileModalVisible(true),
          showChevron: true,
        },
        {
          icon: Mail,
          label: t('profile.email'),
          value: currentUser.email,
          onPress: () => setEditProfileModalVisible(true),
          showChevron: true,
        },
        {
          icon: Phone,
          label: t('profile.phone'),
          value: currentUser.phone || 'Belirtilmemiş',
          onPress: () => setEditProfileModalVisible(true),
          showChevron: true,
        },
        {
          icon: Shield,
          label: 'Rol',
          value: 'Super Admin',
          onPress: () => {},
          showChevron: false,
        },
      ],
    },
    {
      title: 'Güvenlik',
      items: [
        {
          icon: Key,
          label: 'Şifre Değiştir',
          value: '',
          onPress: () => setChangePasswordModalVisible(true),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Aktivite Geçmişi',
      items: [
        {
          icon: Activity,
          label: 'Aktivite Kayıtları',
          value: '',
          onPress: () => {
            Alert.alert(t('common.comingSoon'), 'Aktivite kayıtları yakında eklenecek');
          },
          showChevron: true,
        },
        {
          icon: FileText,
          label: t('superAdminScreen.reports'),
          value: '',
          onPress: () => {
            Alert.alert(t('common.comingSoon'), 'Raporlar yakında eklenecek');
          },
          showChevron: true,
        },
        {
          icon: Settings,
          label: 'Sistem Ayarları',
          value: '',
          onPress: () => {
            Alert.alert(t('common.comingSoon'), 'Sistem ayarları yakında eklenecek');
          },
          showChevron: true,
        },
      ],
    },
    {
      title: 'Tercihler',
      items: [
        {
          icon: Bell,
          label: t('profile.notifications'),
          value: '',
          isSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled,
        },
        {
          icon: Globe,
          label: t('profile.language'),
          value: `${currentLanguage?.flag} ${currentLanguage?.name}`,
          onPress: () => setLanguageModalVisible(true),
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerIcon}>
          <Crown size={20} color={colors.warning} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('superAdminScreen.title')}</Text>
          <Text style={styles.headerSubtitle}>{user?.fullName || 'Super Admin'}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Crown size={32} color={colors.white} />
            </View>
            <View style={styles.superAdminBadge}>
              <Text style={styles.superAdminBadgeText}>SUPER ADMIN</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{currentUser.fullName}</Text>
          <Text style={styles.profileEmail}>{currentUser.email}</Text>
          
          {/* Edit Profile Button */}
          <Pressable
            style={styles.editProfileButton}
            onPress={() => setEditProfileModalVisible(true)}
          >
            <Edit size={16} color={colors.primary} />
            <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
          </Pressable>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.isSwitch}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIcon}>
                      <item.icon size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.isSwitch ? (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onSwitchChange}
                        trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                        thumbColor={item.switchValue ? colors.primary : colors.white}
                      />
                    ) : (
                      <>
                        {item.value && (
                          <Text style={styles.menuItemValue}>{item.value}</Text>
                        )}
                        {item.showChevron !== false && (
                          <ChevronRight size={20} color={colors.gray400} />
                        )}
                      </>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.errorDark} />
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </Pressable>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>{t('profile.appVersion')}</Text>
          <Text style={styles.versionSubtext}>{t('superAdminScreen.superAdminPanel')}</Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              <Pressable 
                onPress={() => setLanguageModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.languageList}>
              {languages.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    language === lang.code && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={styles.languageName}>{lang.name}</Text>
                  </View>
                  {language === lang.code && (
                    <Check size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        currentUser={currentUser}
        onSuccess={loadUserProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
      />
    </View>
  );
};

export default SuperAdminProfile;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.warningLight,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAdminBadge: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -45 }],
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.white,
  },
  superAdminBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  editProfileButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  section: {
    gap: spacing.listGap,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    gap: spacing.listGap,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuItemLast: {
    // No special styling needed
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
  },
  logoutButton: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.errorLight,
    backgroundColor: colors.errorLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutButtonText: {
    fontSize: fontSize.buttonTextLg,
    fontWeight: fontWeight.semibold,
    color: colors.errorDark,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  versionSubtext: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  languageItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
});
