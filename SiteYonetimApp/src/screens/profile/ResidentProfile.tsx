import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
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
  X,
  Check,
  Edit,
  Key,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import type { Language } from '../../i18n/translations';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';
import EditProfileModal from '../../components/modals/EditProfileModal';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';


const ResidentProfile = () => {
  const { user, signOut, switchApartment: switchApartmentContext } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [apartmentSwitchModalVisible, setApartmentSwitchModalVisible] = useState(false);
  const [userApartments, setUserApartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState({
    fullName: user?.fullName || 'Ahmet Yılmaz',
    email: user?.email || 'ahmet.yilmaz@example.com',
    phone: user?.phone || '+90 555 123 4567',
    apartmentId: user?.apartmentId,
    blockName: user?.blockName,
    unitNumber: user?.unitNumber,
  });

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadUserApartments();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await apiClient.get<{
        fullName?: string;
        email?: string;
        phone?: string;
        apartmentId?: string;
        blockName?: string;
        unitNumber?: string;
      }>('/users/me');
      setCurrentUser({
        fullName: profile.fullName || 'Ahmet Yılmaz',
        email: profile.email || 'ahmet.yilmaz@example.com',
        phone: profile.phone || '+90 555 123 4567',
        apartmentId: profile.apartmentId || user?.apartmentId,
        blockName: profile.blockName || user?.blockName,
        unitNumber: profile.unitNumber || user?.unitNumber,
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadUserApartments = async () => {
    try {
      const apartments = await apiClient.get<any[]>('/users/me/apartments');
      setUserApartments(apartments || []);
    } catch (error) {
      console.error('Failed to load user apartments:', error);
      setUserApartments([]);
    }
  };

  const handleSwitchApartment = async (apartment: any) => {
    try {
      await apiClient.post('/users/me/switch-apartment', { apartmentId: apartment.id });
      
      // Update AuthContext with new apartment info
      await switchApartmentContext(apartment.id, apartment.blockName, apartment.unitNumber);
      
      Alert.alert('Başarılı', `${apartment.blockName} - ${apartment.unitNumber} dairesine geçiş yapıldı`);
      setApartmentSwitchModalVisible(false);
      
      // Reload user data
      loadUserProfile();
      loadUserApartments();
    } catch (error) {
      console.error('Failed to switch apartment:', error);
      Alert.alert('Hata', 'Daire değiştirilemedi');
    }
  };
  
  const initials = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase();

  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'tr', flag: '🇹🇷', name: t('languages.tr') },
    { code: 'en', flag: '🇬🇧', name: t('languages.en') },
    { code: 'ru', flag: '🇷🇺', name: t('languages.ru') },
    { code: 'ar', flag: '🇸🇦', name: t('languages.ar') },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const getApartmentLabel = () => {
    const blockName = currentUser.blockName || user?.blockName;
    const unitNumber = currentUser.unitNumber || user?.unitNumber;
    if (blockName && unitNumber) {
      return `${blockName} - ${unitNumber}`;
    }

    const apartmentId = currentUser.apartmentId || user?.apartmentId;
    const selectedApartment = userApartments.find((apartment) => apartment.id === apartmentId) || userApartments[0];
    if (selectedApartment?.blockName && selectedApartment?.unitNumber) {
      return `${selectedApartment.blockName} - ${selectedApartment.unitNumber}`;
    }

    return 'Daire bilgisi yok';
  };

  const handleLanguageSelect = async (lang: Language) => {
    console.log('🎯 [ResidentProfile] Language button clicked:', lang);
    console.log('🎯 [ResidentProfile] Current language before change:', language);
    
    try {
      await changeLanguage(lang);
      console.log('✅ [ResidentProfile] changeLanguage completed');
      console.log('✅ [ResidentProfile] Closing modal...');
      setLanguageModalVisible(false);
      console.log('✅ [ResidentProfile] Modal closed');
    } catch (error) {
      console.error('❌ [ResidentProfile] Error changing language:', error);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <Text style={styles.headerSubtitle}>{currentUser.fullName}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{currentUser.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{t('profile.title')}</Text>
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

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Mail size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.email')}</Text>
              <Text style={styles.infoValue}>{currentUser.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Phone size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
              <Text style={styles.infoValue}>{currentUser.phone}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Building2 size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.site')}</Text>
              <Text style={styles.infoValue}>{user?.siteName || 'Yeşilvadi Sitesi'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Home size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t('profile.apartment')}</Text>
              <Text style={styles.infoValue}>{getApartmentLabel()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable 
            style={styles.menuItem}
            onPress={() => setChangePasswordModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <Key size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Şifre Değiştir</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>

          {/* Dairelerim - Show only if user has multiple apartments */}
          {userApartments.length > 1 && (
            <Pressable 
              style={styles.menuItem}
              onPress={() => setApartmentSwitchModalVisible(true)}
            >
              <View style={styles.menuLeft}>
                <Home size={18} color={colors.textSecondary} style={styles.menuIcon} />
                <Text style={styles.menuLabel}>Dairelerim</Text>
              </View>
              <View style={styles.menuRight}>
                <View style={styles.apartmentBadge}>
                  <Text style={styles.apartmentBadgeText}>{userApartments.length}</Text>
                </View>
                <ChevronRight size={16} color={colors.gray400} />
              </View>
            </Pressable>
          )}

          <Pressable 
            style={styles.menuItem}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <Globe size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>
                {currentLanguage?.flag} {currentLanguage?.name}
              </Text>
              <ChevronRight size={16} color={colors.gray400} />
            </View>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Gizlilik', 'Gizlilik ayarları yakında eklenecek')}>
            <View style={styles.menuLeft}>
              <Shield size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.privacy')}</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Yardım', 'Yardım sayfası yakında eklenecek')}>
            <View style={styles.menuLeft}>
              <HelpCircle size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('profile.help')}</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={() => {
          Alert.alert(
            'Çıkış Yap',
            'Uygulamadan çıkış yapmak istediğinize emin misiniz?',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() }
            ]
          );
        }}>
          <LogOut size={18} color="#b91c1c" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </Pressable>
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

      {/* Apartment Switch Modal */}
      <Modal
        visible={apartmentSwitchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApartmentSwitchModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setApartmentSwitchModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dairelerim</Text>
              <Pressable 
                onPress={() => setApartmentSwitchModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.apartmentList}>
              {userApartments.map((apartment) => {
                const isCurrentApartment = apartment.id === user?.apartmentId;
                return (
                  <Pressable
                    key={apartment.id}
                    style={[
                      styles.apartmentItem,
                      isCurrentApartment && styles.apartmentItemActive,
                    ]}
                    onPress={() => !isCurrentApartment && handleSwitchApartment(apartment)}
                    disabled={isCurrentApartment}
                  >
                    <View style={styles.apartmentLeft}>
                      <Home size={20} color={isCurrentApartment ? colors.primary : colors.textSecondary} />
                      <View style={styles.apartmentInfo}>
                        <Text style={[
                          styles.apartmentName,
                          isCurrentApartment && styles.apartmentNameActive
                        ]}>
                          {apartment.blockName} - {apartment.unitNumber}
                        </Text>
                        <Text style={styles.apartmentRole}>
                          {apartment.assignmentType === 'OWNER' ? 'Malik' : 'Kiracı'}
                        </Text>
                      </View>
                    </View>
                    {isCurrentApartment && (
                      <View style={styles.currentBadge}>
                        <Check size={16} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundSecondary },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  headerIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: borderRadius.icon, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  headerIconText: { fontSize: 16, fontWeight: fontWeight.bold, color: colors.primary },
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.screenPaddingHorizontal, paddingVertical: spacing.lg, paddingBottom: 100, rowGap: spacing.lg },
  profileSection: { alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.card, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: borderRadius.full, borderWidth: 3, borderColor: colors.primaryLight, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize['5xl'], fontWeight: fontWeight.bold, color: colors.primary },
  nameText: { marginTop: spacing.md, fontSize: fontSize['2xl'], fontWeight: fontWeight.semibold, color: colors.textPrimary },
  roleBadge: { marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.pill, backgroundColor: colors.gray200 },
  roleBadgeText: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary, fontWeight: fontWeight.medium },
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
  section: { gap: spacing.listGap },
  infoRow: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, padding: spacing.lg },
  infoIcon: { marginRight: spacing.md },
  infoLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.medium, color: colors.textPrimary, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: spacing.md },
  menuLabel: { fontSize: fontSize.cardTitle, color: colors.textPrimary, fontWeight: fontWeight.medium },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuValue: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  logoutButton: { marginTop: spacing.md, height: 48, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.errorLight, backgroundColor: colors.errorLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  logoutText: { fontSize: fontSize.buttonTextLg, fontWeight: fontWeight.semibold, color: colors.errorDark },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
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
    fontWeight: '600',
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
    backgroundColor: colors.background,
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
    fontWeight: '500',
    color: colors.textPrimary,
  },
  
  // Apartment badge
  apartmentBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentBadgeText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  
  // Apartment list
  apartmentList: {
    gap: 8,
  },
  apartmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  apartmentItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  apartmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  apartmentNameActive: {
    color: colors.primary,
  },
  apartmentRole: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ResidentProfile;



