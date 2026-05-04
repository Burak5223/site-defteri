import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { CheckCircle, Calendar, Users } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { votingService, Voting } from '../../services/voting.service';
import { useAuth } from '../../context/AuthContext';

const ResidentVoting = () => {
  const { user } = useAuth();
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVotings();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadVotings = async () => {
    if (!user?.siteId) return;
    
    try {
      const data = await votingService.getVotings(user.siteId);
      setVotings(data);
    } catch (error) {
      console.error('Load votings error:', error);
      Alert.alert('Hata', 'Oylamalar yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVotings();
  };

  const handleVote = async (votingId: string, optionId: string) => {
    try {
      await votingService.castVote({ votingId, optionId });
      Alert.alert('Başarılı', 'Oyunuz kaydedildi');
      loadVotings();
    } catch (error: any) {
      console.error('Cast vote error:', error);
      const errorMessage = error.message || 'Oy kullanılamadı';
      
      if (errorMessage.includes('Sadece kat malikleri') || errorMessage.includes('Kiracılar')) {
        Alert.alert(
          'Oy Kullanılamadı', 
          'Sadece kat malikleri oylamaya katılabilir. Kiracılar oy kullanamaz.',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert('Hata', errorMessage);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: colors.successLight, text: colors.successDark, label: 'Devam Ediyor' };
      case 'ended': return { bg: colors.gray200, text: colors.textSecondary, label: 'Sona Erdi' };
      case 'upcoming': return { bg: colors.primaryLight, text: colors.primary, label: 'Yakında' };
      default: return { bg: colors.gray200, text: colors.textSecondary, label: status };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>E-Oylama</Text>
          <Text style={styles.headerSubtitle}>{votings.filter(v => v.status === 'active').length} aktif oylama</Text>
        </View>

        <View style={styles.votingsList}>
          {votings.map(voting => {
            const statusInfo = getStatusColor(voting.status);
            return (
              <View key={voting.id} style={styles.votingCard}>
                <View style={styles.votingHeader}>
                  <Text style={styles.votingTitle}>{voting.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.votingDescription}>{voting.description}</Text>

                <View style={styles.votingMeta}>
                  <View style={styles.metaItem}>
                    <Users size={16} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{voting.totalVotes} oy</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {new Date(voting.endDate).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>

                {voting.hasVoted ? (
                  <View style={styles.votedSection}>
                    <View style={styles.votedBadge}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={styles.votedText}>Oy kullandınız</Text>
                    </View>
                    {voting.options.map(option => {
                      const isUserVote = option.id === voting.userVotedOptionId;
                      return (
                        <View key={option.id} style={styles.resultOption}>
                          <View style={styles.resultHeader}>
                            <Text style={[styles.resultText, isUserVote && styles.resultTextBold]}>
                              {option.optionText}
                              {isUserVote && ' ✓'}
                            </Text>
                            <Text style={styles.resultPercentage}>{option.percentage.toFixed(0)}%</Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${option.percentage}%`, backgroundColor: isUserVote ? colors.primary : colors.gray300 }]} />
                          </View>
                          <Text style={styles.resultVotes}>{option.voteCount} oy</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.optionsSection}>
                    <Text style={styles.optionsTitle}>Oy Verin</Text>
                    {voting.options.map(option => (
                      <Pressable
                        key={option.id}
                        style={styles.optionButton}
                        onPress={() => handleVote(voting.id, option.id)}
                        disabled={voting.status !== 'active'}
                      >
                        <Text style={styles.optionText}>{option.optionText}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  headerTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 4 },
  votingsList: { gap: spacing.lg },
  votingCard: { backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  votingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  votingTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.pill },
  statusText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold },
  votingDescription: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginBottom: spacing.md },
  votingMeta: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  votedSection: { marginTop: spacing.md },
  votedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, alignSelf: 'flex-start', marginBottom: spacing.lg },
  votedText: { fontSize: fontSize.cardSubtitle, color: colors.successDark, fontWeight: fontWeight.semibold },
  resultOption: { marginBottom: spacing.md },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  resultText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  resultTextBold: { fontWeight: fontWeight.semibold, color: colors.textPrimary },
  resultPercentage: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.bold, color: colors.textPrimary },
  progressBar: { height: 8, backgroundColor: colors.gray100, borderRadius: borderRadius.sm, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', borderRadius: borderRadius.sm },
  resultVotes: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  optionsSection: { marginTop: spacing.md },
  optionsTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  optionButton: { backgroundColor: colors.primaryLight, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderRadius: borderRadius.button, marginBottom: spacing.sm, borderWidth: 2, borderColor: colors.primary },
  optionText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.primary, textAlign: 'center' },
});

export default ResidentVoting;
