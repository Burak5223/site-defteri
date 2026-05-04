import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const AnnouncementDetailScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text>Duyuru Detayı</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
});

export default AnnouncementDetailScreen;
