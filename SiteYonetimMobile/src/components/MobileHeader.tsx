import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar } from 'react-native-paper';
import { ChevronLeft, ChevronDown, Menu, Shield, Home as HomeIcon, Sparkles } from 'lucide-react-native';
import type { UserRole, Site } from '../types';
import type { Language } from '../config/i18n';
import { getTranslation } from '../config/i18n';

interface MobileHeaderProps {
  role: UserRole;
  currentSite: Site;
  sites: Site[];
  onSitePress?: () => void;
  onMenuPress: () => void;
  onBackPress?: () => void;
  lang?: Language;
  currentAdminName?: string;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'super_admin':
    case 'security':
      return Shield;
    case 'admin':
    case 'resident':
      return HomeIcon;
    case 'cleaner':
      return Sparkles;
    default:
      return HomeIcon;
  }
};

const getRoleLabel = (role: UserRole, lang: Language = 'tr'): string => {
  const t = (key: any) => getTranslation(lang, key);
  
  switch (role) {
    case 'super_admin':
      return 'Genel Yönetici';
    case 'admin':
      return t('role_admin');
    case 'resident':
      return t('role_resident');
    case 'cleaner':
      return t('role_cleaner');
    case 'security':
      return t('role_security');
    default:
      return role;
  }
};

export function MobileHeader({
  role,
  currentSite,
  sites,
  onSitePress,
  onMenuPress,
  onBackPress,
  lang = 'tr',
  currentAdminName,
}: MobileHeaderProps) {
  const RoleIcon = getRoleIcon(role);
  const showSiteSelector = role === 'admin' && sites.length > 1 && onSitePress;

  return (
    <Appbar.Header style={styles.header}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          )}
          
          <View style={styles.iconContainer}>
            <RoleIcon size={20} color="#6366f1" />
          </View>

          <View style={styles.titleContainer}>
            {showSiteSelector ? (
              <TouchableOpacity onPress={onSitePress}>
                <View style={styles.siteSelectorButton}>
                  <Text style={styles.siteName} numberOfLines={1}>
                    {currentSite.name}
                  </Text>
                  <ChevronDown size={16} color="#666" />
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={styles.siteName} numberOfLines={1}>
                {currentSite.name}
              </Text>
            )}
            <Text style={styles.roleText} numberOfLines={1}>
              {currentAdminName ? `${currentAdminName} - ${getRoleLabel(role, lang)}` : getRoleLabel(role, lang)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
          <Menu size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  siteSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  roleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
