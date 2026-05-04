import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing, fontSize, borderRadius } from '../../theme';
import { colors } from '../../theme';

const MessageDetailScreen = ({ route }: any) => {
  const { message } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
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
        </View>
      </View>
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: spacing.lg,
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
    marginTop: 4,
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
