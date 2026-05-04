import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { spacing, fontSize } from '../../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Icon name="account-circle" size={80} color="#2563eb" />
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <List.Item
          title="Bildirim Ayarları"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* TODO */}}
        />
        <List.Item
          title="Şifre Değiştir"
          left={(props) => <List.Icon {...props} icon="lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* TODO */}}
        />
        <List.Item
          title="Yardım"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* TODO */}}
        />
        <List.Item
          title="Hakkında"
          left={(props) => <List.Icon {...props} icon="information" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* TODO */}}
        />
      </Card>

      <Button
        mode="contained"
        onPress={logout}
        style={styles.logoutButton}
        buttonColor="#dc2626"
        icon="logout"
      >
        Çıkış Yap
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileCard: {
    margin: spacing.md,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: spacing.md,
  },
  email: {
    fontSize: fontSize.md,
    color: '#64748b',
    marginTop: spacing.xs,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  logoutButton: {
    margin: spacing.md,
    paddingVertical: spacing.sm,
  },
});

export default ProfileScreen;
