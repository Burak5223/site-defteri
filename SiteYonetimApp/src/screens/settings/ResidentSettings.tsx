import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import {
  Bell,
  Moon,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

const ResidentSettings = () => {
  const { t } = useI18n();
  const { colors: themeColors, isDarkMode, setDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.backgroundSecondary }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>{t('residentSettings.notificationsSection')}</Text>
        <View style={styles.section}>
          <View style={[styles.menuItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.menuLeft}>
              <Bell size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>{t('residentSettings.enableNotifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>{t('residentSettings.appearanceSection')}</Text>
        <View style={styles.section}>
          <View style={[styles.menuItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.menuLeft}>
              <Moon size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>{t('residentSettings.darkMode')}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>{t('residentSettings.securitySection')}</Text>
        <View style={styles.section}>
          <Pressable style={[styles.menuItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.menuLeft}>
              <Lock size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>{t('residentSettings.changePassword')}</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>{t('residentSettings.languageSection')}</Text>
        <View style={styles.section}>
          <Pressable style={[styles.menuItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.menuLeft}>
              <Globe size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: themeColors.textPrimary }]}>{t('residentSettings.languageSelection')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, { color: themeColors.textSecondary }]}>{t('residentSettings.turkishFlag')}</Text>
              <ChevronRight size={16} color={colors.gray400} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  section: { rowGap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 10 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 10 },
  menuLabel: { fontSize: 14, color: colors.textPrimary },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: 12, color: colors.textSecondary, marginRight: 4 },
});

export default ResidentSettings;
