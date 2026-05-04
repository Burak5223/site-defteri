import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { spacing, fontSize } from '../../theme';

const AnnouncementDetailScreen = ({ route }: any) => {
  const { announcement } = route.params;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#16a34a';
      default: return '#64748b';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Acil';
      case 'HIGH': return 'Yüksek';
      case 'MEDIUM': return 'Orta';
      case 'LOW': return 'Düşük';
      default: return priority;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Chip
              style={{ backgroundColor: getPriorityColor(announcement.priority) }}
              textStyle={{ color: '#ffffff' }}
            >
              {getPriorityLabel(announcement.priority)}
            </Chip>
            <Text style={styles.date}>
              {new Date(announcement.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.content}>{announcement.content}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.lg,
  },
  content: {
    fontSize: fontSize.md,
    color: '#475569',
    lineHeight: 24,
  },
});

export default AnnouncementDetailScreen;
