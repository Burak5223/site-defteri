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

const ResidentSettings = () => {
  const { t } = useI18n();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('residentSettings.notificationsSection')}</Text>
        <View style={styles.section}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Bell size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('residentSettings.enableNotifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('residentSettings.appearanceSection')}</Text>
        <View style={styles.section}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Moon size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('residentSettings.darkMode')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('residentSettings.securitySection')}</Text>
        <View style={styles.section}>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Lock size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('residentSettings.changePassword')}</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('residentSettings.languageSection')}</Text>
        <View style={styles.section}>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Globe size={18} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{t('residentSettings.languageSelection')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>{t('residentSettings.turkishFlag')}</Text>
              <ChevronRight size={16} color={colors.gray400} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  section: { rowGap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 10 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 10 },
  menuLabel: { fontSize: 14, color: colors.textPrimary },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: 12, color: colors.textSecondary, marginRight: 4 },
});

export default ResidentSettings;
