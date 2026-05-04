import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import type { UserRole } from '../types';
import type { Language } from '../config/i18n';
import { getTranslation } from '../config/i18n';
import { getNavItems, type NavItem } from '../config/navigation';

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  messageCount?: number;
  lang?: Language;
}

export function MobileDrawer({
  visible,
  onClose,
  role,
  activeTab,
  onTabChange,
  messageCount = 0,
  lang = 'tr',
}: MobileDrawerProps) {
  const t = (key: any) => getTranslation(lang, key);
  const navItems = getNavItems(role);

  const handleItemPress = (itemId: string) => {
    onTabChange(itemId);
    onClose();
  };

  const getMenuTitle = () => {
    switch (lang) {
      case 'en': return 'Menu';
      case 'ru': return 'Меню';
      case 'ar': return 'القائمة';
      default: return 'Menü';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getMenuTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.content}>
            {navItems.map((item: NavItem) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'messages' && messageCount > 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item.id)}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                >
                  <Icon 
                    size={20} 
                    color={isActive ? '#fff' : '#000'} 
                  />
                  <Text 
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                    ]}
                  >
                    {t(item.labelKey)}
                  </Text>
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{messageCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: 280,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#6366f1',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  menuItemTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
