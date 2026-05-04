import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Home, 
  Megaphone, 
  CreditCard, 
  Package, 
  MessageSquare, 
  Wallet, 
  Wrench, 
  ClipboardList, 
  Ticket, 
  Vote, 
  User, 
  Settings,
  LogOut,
  X,
  UserCircle,
  ChevronRight,
  Users,
  Building2,
  ShieldCheck
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { lightTheme } from '../theme';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const menuItems = [
    { screen: 'Dashboard', label: 'Ana Sayfa', icon: Home },
    { screen: 'Announcements', label: 'Duyurular', icon: Megaphone },
    { screen: 'Dues', label: 'Aidatlar', icon: CreditCard },
    { screen: 'Packages', label: 'Paketler', icon: Package },
    { screen: 'Messages', label: 'Mesajlar', icon: MessageSquare },
    { screen: 'Finance', label: 'Finans', icon: Wallet },
    { screen: 'Maintenance', label: 'Bakım Talepleri', icon: Wrench },
    { screen: 'Tasks', label: 'Görevler', icon: ClipboardList },
    { screen: 'Tickets', label: 'Destek', icon: Ticket },
    { screen: 'Voting', label: 'Oylamalar', icon: Vote },
    { screen: 'Residents', label: 'Sakinler', icon: Users },
    { screen: 'Sites', label: 'Siteler', icon: Building2 },
    { screen: 'Profile', label: 'Profil', icon: User },
    { screen: 'Settings', label: 'Ayarlar', icon: Settings },
  ];

  const handleNavigate = (screenName: string) => {
    onClose();
    try {
      navigation.navigate(screenName);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
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
            <View style={styles.userInfo}>
              <UserCircle size={40} color={lightTheme.colors.primary} />
              <View style={styles.userDetails}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.firstName || user?.email || 'Kullanıcı'}
                </Text>
                <View style={styles.roleBadge}>
                  <ShieldCheck size={10} color={lightTheme.colors.primary} />
                  <Text style={styles.userRole}>
                    {user?.roles?.[0] || 'Sakin'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => {
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.screen)}
                >
                  <View style={styles.iconContainer}>
                    <IconComp size={18} color={lightTheme.colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <ChevronRight size={14} color="#cbd5e1" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
  },
  drawer: {
    width: 280,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#020617',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    color: lightTheme.colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
