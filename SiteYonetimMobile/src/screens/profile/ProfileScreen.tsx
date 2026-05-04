import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Mail, Phone, Bell, Shield, HelpCircle, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Kullanıcı';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{fullName}</Text>
          {user?.email && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Mail size={18} color="#6b7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>
                {user?.email ?? 'Tanımlı değil'}
              </Text>
            </View>
          </View>
          {user?.phoneNumber && (
            <View style={styles.infoRow}>
              <Phone size={18} color="#6b7280" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Bell size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Bildirim Ayarları</Text>
            </View>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Shield size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Gizlilik ve Güvenlik</Text>
            </View>
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <HelpCircle size={18} color="#6b7280" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Yardım</Text>
            </View>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <LogOut
            size={18}
            color="#b91c1c"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    rowGap: 16,
  },
  header: {
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(15,118,110,0.25)',
    backgroundColor: 'rgba(15,118,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f766e',
  },
  nameText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#111827',
  },
  section: {
    rowGap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
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
    fontSize: 14,
    color: '#111827',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
  },
});

export default ProfileScreen;
