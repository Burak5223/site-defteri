import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../theme';

const ApartmentsScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Daireler</Text>
        <Text style={styles.subtitle}>Daire yönetimi ekranı yakında eklenecek</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { flex: 1, padding: spacing.screenPaddingHorizontal },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary, marginTop: spacing.xl },
  subtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: spacing.sm },
});

export default ApartmentsScreen;
