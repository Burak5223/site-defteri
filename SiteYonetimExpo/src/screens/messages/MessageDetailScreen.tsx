import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, fontSize } from '../../theme';

const MessageDetailScreen = ({ route }: any) => {
  const { message } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.senderInfo}>
              <Icon name="account-circle" size={48} color="#2563eb" />
              <View style={styles.senderText}>
                <Text style={styles.senderName}>{message.senderName}</Text>
                <Text style={styles.date}>
                  {new Date(message.sentAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.subject}>{message.subject}</Text>
          <Text style={styles.content}>{message.content}</Text>
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
    marginBottom: spacing.lg,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  senderName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  date: {
    fontSize: fontSize.sm,
    color: '#64748b',
    marginTop: spacing.xs,
  },
  subject: {
    fontSize: fontSize.xl,
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

export default MessageDetailScreen;
