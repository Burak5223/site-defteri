import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert
} from 'react-native';
import {
  Mail,
  Phone,
  Building2,
  Home,
  LogOut,
  ChevronRight,

  Shield,
  HelpCircle,
  Globe,
  Check,
  User,
  Settings,
  ChevronDown,
  Edit,
  Key,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n, Language } from '../../context/I18nContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';
import EditProfileModal from '../../components/modals/EditProfileModal';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';

const ProfileScreen = () => {
  const { user, signOut, hasRole } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [siteName, setSiteName] = useState('site');

  // E-posta otomatik oluşturma fonksiyonu
  const generateEmail = (username: string, site: string) => {
    // Kullanıcı adını temizle
    const cleanUsername = username
      .toLowerCase()
      .replace(/\s+/g, '')
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
    
    return `${cleanUsername}@${cleanSite}.com`;
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await apiClient.get<{ siteId?: string; username?: string; fullName?: string; phone?: string }>('/users/me');
      
      // Site bilgisini al
      let userSiteName = 'site';
      try {
        const siteResponse = await apiClient.get<{ name?: string }>(`/sites/${user?.siteId || profile.siteId}`);
        userSiteName = siteResponse.name || 'site';
        setSiteName(userSiteName);
      } catch (error) {
        console.log('Site bilgisi alınamadı, varsayılan kullanılıyor');
      }

      // Admin için kullanıcı adı veya isim kullan
      const username = profile.username || profile.fullName || 'admin';
      const autoEmail = generateEmail(username, userSiteName);

      setCurrentUser({
        fullName: profile.fullName || '',
        email: autoEmail,
        phone: profile.phone || '',
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const handleLanguageChange = async (newLanguage: Language) => {
    console.log('AdminProfile - Changing language to:', newLanguage);
    await changeLanguage(newLanguage);
    setShowLanguageDialog(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('nav.logout'),
      'Uygulamadan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('nav.logout'), 
          style: 'destructive',
          onPress: async () => {
             await signOut();
          }
        }
      ]
    );
  };

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes('ADMIN')) return t('dashboard.admin');
    if (roles.includes('STAFF')) return 'Personel';
    return t('dashboard.resident');
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Profile header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{currentUser.fullName || user?.fullName || 'Ahmet Yılmaz'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {getRoleLabel(user?.roles || [])}
            </Text>
          </View>
          
          {/* Edit Profile Button */}
          <Pressable
            style={styles.editProfileButton}
            onPress={() => setEditProfileModalVisible(true)}
          >
            <Edit size={16} color={colors.primary} />
            <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
          </Pressable>
        </View>

        {/* Contact info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Mail size={18} color="#6b7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.email')}</Text>
              <Text style={styles.infoValue}>{currentUser.email || user?.email || 'ahmet@example.com'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Phone size={18} color="#6b7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
              <Text style={styles.infoValue}>{currentUser.phone || user?.phone || '+905551234567'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Building2 size={18} color="#6b7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.site')}</Text>
              <Text style={styles.infoValue}>Yeşil Vadi Sitesi</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Home size={18} color="#6b7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.apartment')}</Text>
              <Text style={styles.infoValue}>A Blok - A-12</Text>
            </View>
          </View>
        </View>

        {/* Settings menu */}
        <View style={styles.section}>
          <Pressable 
            style={styles.menuItem}
            onPress={() => setChangePasswordModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <Key size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Şifre Değiştir</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </Pressable>


          <Pressable
            style={styles.menuItem}
            onPress={() => setShowLanguageDialog(true)}
          >
            <View style={styles.menuLeft}>
              <Globe size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>
                {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
              </Text>
              <ChevronRight size={16} color="#9ca3af" />
            </View>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Gizlilik', 'Gizlilik ayarları yakında eklenecek')}>
            <View style={styles.menuLeft}>
              <Shield size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.privacy')}</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Yardım', 'Yardım sayfası yakında eklenecek')}>
            <View style={styles.menuLeft}>
              <HelpCircle size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.help')}</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color="#b91c1c" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('nav.logout')}</Text>
        </Pressable>
      </ScrollView>

      {/* Language modal */}
      <Modal
        visible={showLanguageDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageDialog(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              {languages.map((l) => (
                <Pressable
                  key={l.code}
                  style={[
                    styles.langRow,
                    language === l.code && styles.langRowActive,
                  ]}
                  onPress={() => handleLanguageChange(l.code)}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.langFlag}>{l.flag}</Text>
                    <Text style={styles.langName}>{l.name}</Text>
                  </View>
                  {language === l.code && (
                    <Check size={18} color="#0f766e" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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

export default ProfileScreen;

const createStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.screenPaddingVertical,
    paddingBottom: spacing.screenPaddingBottom,
    rowGap: spacing.screenPaddingHorizontal,
  },
  header: {
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.avatar,
    borderWidth: 4,
    borderColor: 'rgba(15,118,110,0.25)',
    backgroundColor: 'rgba(15,118,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  nameText: {
    marginTop: 10,
    fontSize: fontSize.headerTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.badge,
    backgroundColor: colors.gray200,
  },
  roleBadgeText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.gray900,
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
  superNote: {
    marginTop: 4,
    fontSize: fontSize.hintText,
    color: colors.textSecondary,
  },
  section: {
    rowGap: spacing.listGap,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: fontSize.hintText,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.medium,
    color: colors.gray900,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 6,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuLabel: {
    fontSize: fontSize.labelText,
    color: colors.gray900,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginRight: 4,
  },
  logoutButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    backgroundColor: 'rgba(254,242,242,1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: fontSize.labelText,
    fontWeight: fontWeight.semibold,
    color: '#b91c1c',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 18,
    maxHeight: '70%',
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    marginBottom: 8,
  },
  modalScroll: {
    maxHeight: 260,
  },
  modalScrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: 10,
    rowGap: 6,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: borderRadius.icon,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15,118,110,0.06)',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  langName: {
    fontSize: fontSize.labelText,
    color: colors.gray900,
  },
});



