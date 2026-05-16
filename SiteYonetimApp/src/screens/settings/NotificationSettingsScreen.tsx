import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  CreditCard,
  Package,
  Megaphone,
  Wrench,
  ChevronLeft,
  Clock,
  Check,
} from 'lucide-react-native';
import { colors, lightTheme, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';

interface PushNotificationSettings {
  enabled: boolean;
  duesReminder: boolean;
  packageAlert: boolean;
  announcementAlert: boolean;
  maintenanceAlert: boolean;
  daysBeforeDueReminder: number;
}

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { t } = useI18n();
  const [settings, setSettings] = useState<PushNotificationSettings>({
    enabled: true,
    duesReminder: true,
    packageAlert: true,
    announcementAlert: true,
    maintenanceAlert: false,
    daysBeforeDueReminder: 7,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const notificationTypes = [
    {
      key: 'duesReminder' as const,
      icon: CreditCard,
      title: t('notifications.duesReminder'),
      description: t('notifications.duesReminderDesc'),
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.1)',
    },
    {
      key: 'packageAlert' as const,
      icon: Package,
      title: t('notifications.packageAlert'),
      description: t('notifications.packageAlertDesc'),
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.12)',
    },
    {
      key: 'announcementAlert' as const,
      icon: Megaphone,
      title: t('notifications.announcementAlert'),
      description: t('notifications.announcementAlertDesc'),
      color: '#3b82f6',
      bgColor: 'rgba(59,130,246,0.12)',
    },
    {
      key: 'maintenanceAlert' as const,
      icon: Wrench,
      title: t('notifications.maintenanceAlert'),
      description: t('notifications.maintenanceAlertDesc'),
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.12)',
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Master toggle */}
        <View style={styles.card}>
          <View style={styles.masterRow}>
            <View style={styles.masterLeft}>
              <View
                style={[
                  styles.masterIconWrapper,
                  settings.enabled ? styles.masterIconOn : styles.masterIconOff,
                ]}
              >
                {settings.enabled ? (
                  <BellRing size={20} color="#0f766e" />
                ) : (
                  <Bell size={20} color="#6b7280" />
                )}
              </View>
              <View>
                <Text style={styles.masterTitle}>{t('notifications.instantNotifications')}</Text>
                <Text style={styles.masterSubtitle}>
                  {settings.enabled ? t('notifications.notificationsEnabled') : t('notifications.notificationsDisabled')}
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.switchOuter,
                settings.enabled && styles.switchOuterOn,
              ]}
              onPress={() =>
                setSettings((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }))
              }
            >
              <View
                style={[
                  styles.switchInner,
                  settings.enabled && styles.switchInnerOn,
                ]}
              />
            </Pressable>
          </View>
        </View>

        {/* Notification types */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('notifications.notificationTypes')}</Text>
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const enabled = settings.enabled && settings[type.key];
            return (
              <View
                key={type.key}
                style={[
                  styles.card,
                  !settings.enabled && { opacity: 0.5 },
                ]}
              >
                <View style={styles.typeRow}>
                  <View style={styles.typeLeft}>
                    <View
                      style={[
                        styles.typeIconWrapper,
                        { backgroundColor: type.bgColor },
                      ]}
                    >
                      <Icon size={20} color={type.color} />
                    </View>
                    <View>
                      <Text style={styles.typeTitle}>{type.title}</Text>
                      <Text style={styles.typeDesc}>{type.description}</Text>
                    </View>
                  </View>
                  <Pressable
                    disabled={!settings.enabled}
                    style={[
                      styles.switchOuterSmall,
                      enabled && styles.switchOuterSmallOn,
                    ]}
                    onPress={() =>
                      setSettings((prev) => ({
                        ...prev,
                        [type.key]: !prev[type.key],
                      }))
                    }
                  >
                    <View
                      style={[
                        styles.switchInnerSmall,
                        enabled && styles.switchInnerSmallOn,
                      ]}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Auto reminder for dues */}
        <View style={styles.card}>
          <View style={styles.autoHeader}>
            <View style={styles.autoTitleRow}>
              <Clock size={16} color="#0f766e" style={{ marginRight: 6 }} />
              <Text style={styles.autoTitle}>{t('common.auto')} {t('notifications.duesReminder')}</Text>
            </View>
            <Text style={styles.autoSubtitle}>
              {t('notifications.duesReminderDays')}
            </Text>
          </View>
          <View style={styles.autoRow}>
            <Text style={styles.autoLabel}>{t('notifications.duesReminderLabel')}</Text>
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>
                {settings.daysBeforeDueReminder} {t('notifications.daysBefore')}
              </Text>
            </View>
          </View>
          <View style={styles.sliderRow}>
            {[1, 7, 14].map((val) => (
              <Pressable
                key={val}
                style={[
                  styles.sliderDot,
                  settings.daysBeforeDueReminder === val && styles.sliderDotActive,
                ]}
                onPress={() =>
                  settings.enabled &&
                  settings.duesReminder &&
                  setSettings((prev) => ({
                    ...prev,
                    daysBeforeDueReminder: val,
                  }))
                }
              >
                <Text
                  style={[
                    styles.sliderDotText,
                    settings.daysBeforeDueReminder === val && styles.sliderDotTextActive,
                  ]}
                >
                  {val}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.sliderLabelsRow}>
            <Text style={styles.sliderLabel}>1 {t('common.day')}</Text>
            <Text style={styles.sliderLabel}>7 {t('common.days')}</Text>
            <Text style={styles.sliderLabel}>14 {t('common.days')}</Text>
          </View>
        </View>

        {/* Channels */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>{t('notifications.notificationChannels')}</Text>
          <View style={styles.channelRow}>
            <View style={styles.channelLeft}>
              <Smartphone size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.channelLabel}>{t('notifications.pushNotification')}</Text>
            </View>
            <View style={styles.channelBadge}>
              <Text style={styles.channelBadgeText}>{t('common.active')}</Text>
            </View>
          </View>
          <View style={styles.channelRow}>
            <View style={styles.channelLeft}>
              <Mail size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.channelLabel}>{t('profile.email')}</Text>
            </View>
            <View style={[styles.channelBadge, { backgroundColor: '#e5e7eb' }]}>
              <Text style={[styles.channelBadgeText, { color: '#4b5563' }]}>{t('common.comingSoon')}</Text>
            </View>
          </View>
        </View>

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, saved && styles.saveButtonSaved]}
          onPress={handleSave}
        >
          {saved ? (
            <>
              <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Kaydedildi</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default NotificationSettingsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: colors.background,
    padding: 12,
  },
  masterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  masterIconOn: {
    backgroundColor: 'rgba(15,118,110,0.1)',
  },
  masterIconOff: {
    backgroundColor: '#e5e7eb',
  },
  masterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020617',
  },
  masterSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  switchOuter: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  switchOuterOn: {
    backgroundColor: '#0f766e',
  },
  switchInner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  switchInnerOn: {
    alignSelf: 'flex-end',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  typeDesc: {
    fontSize: 11,
    color: '#6b7280',
  },
  switchOuterSmall: {
    width: 40,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  switchOuterSmallOn: {
    backgroundColor: '#0f766e',
  },
  switchInnerSmall: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  switchInnerSmallOn: {
    alignSelf: 'flex-end',
  },
  autoHeader: {
    marginBottom: 8,
  },
  autoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  autoSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  autoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  autoLabel: {
    fontSize: 12,
    color: '#111827',
  },
  autoBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e5e7eb',
  },
  autoBadgeText: {
    fontSize: 11,
    color: '#111827',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sliderDot: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    alignItems: 'center',
  },
  sliderDotActive: {
    borderColor: '#0f766e',
    backgroundColor: 'rgba(15,118,110,0.08)',
  },
  sliderDotText: {
    fontSize: 12,
    color: '#4b5563',
  },
  sliderDotTextActive: {
    color: '#0f766e',
    fontWeight: '500',
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: 13,
    color: '#111827',
  },
  channelBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0f766e',
  },
  channelBadgeText: {
    fontSize: 11,
    color: '#ffffff',
  },
  saveButton: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonSaved: {
    backgroundColor: '#16a34a',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

