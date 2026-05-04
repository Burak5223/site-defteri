import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Search, MessageCircle, Building2 } from 'lucide-react-native';
import { colors } from '../../theme';
import { superAdminService, Manager } from '../../services/superadmin.service';

const SuperAdminMessages = ({ navigation }: any) => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading managers...');
      const managersData = await superAdminService.getAllManagers();
      console.log('Managers loaded:', managersData.length);
      setManagers(managersData);
    } catch (error) {
      console.error('Error loading managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredManagers = () => {
    if (!searchQuery.trim()) {
      return managers.sort((a, b) => {
        const nameA = a.fullName || '';
        const nameB = b.fullName || '';
        return nameA.localeCompare(nameB, 'tr-TR');
      });
    }

    const query = searchQuery.toLowerCase();
    return managers
      .filter(manager => {
        const fullName = (manager.fullName || '').toLowerCase();
        const email = (manager.email || '').toLowerCase();
        const siteName = (manager.siteName || '').toLowerCase();
        return fullName.includes(query) || email.includes(query) || siteName.includes(query);
      })
      .sort((a, b) => {
        const nameA = a.fullName || '';
        const nameB = b.fullName || '';
        return nameA.localeCompare(nameB, 'tr-TR');
      });
  };

  const handleManagerPress = (manager: Manager) => {
    console.log('Manager pressed:', manager);
    navigation.navigate('SuperAdminChat', {
      managerId: manager.userId,
      managerName: manager.fullName,
      managerEmail: manager.email,
      siteName: manager.siteName
    });
  };

  const renderManagerCard = (manager: Manager) => {
    const initials = (manager.fullName || 'U')
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const hasUnread = (manager.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        key={manager.userId}
        style={styles.managerCard}
        onPress={() => handleManagerPress(manager)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {hasUnread && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.managerInfo}>
          <View style={styles.managerHeader}>
            <Text style={styles.managerName}>{manager.fullName}</Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{manager.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.managerEmail}>{manager.email}</Text>
          <View style={styles.siteTag}>
            <Building2 size={12} color={colors.primary} />
            <Text style={styles.siteTagText}>{manager.siteName}</Text>
          </View>
        </View>

        <MessageCircle size={20} color={colors.gray400} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yukleniyor...</Text>
      </View>
    );
  }

  const filteredManagers = getFilteredManagers();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <Text style={styles.headerSubtitle}>Yoneticilerle mesajlas</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Yonetici, site veya e-posta ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray400}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredManagers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Sonuc bulunamadi' : 'Henuz yonetici yok'}
            </Text>
          </View>
        ) : (
          filteredManagers.map(manager => renderManagerCard(manager))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray500,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },
  managerInfo: {
    flex: 1,
  },
  managerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.success,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  managerEmail: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 8,
  },
  siteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  siteTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray400,
  },
});

export default SuperAdminMessages;
