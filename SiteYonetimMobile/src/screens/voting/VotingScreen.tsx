import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { Vote, CheckCircle, Clock, TrendingUp } from 'lucide-react-native';

interface VotingItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed';
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  endDate: string;
}

export function VotingScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const votings: VotingItem[] = [
    {
      id: '1',
      title: 'Yüzme Havuzu Yapımı',
      description: 'Site bahçesine yüzme havuzu yapılması önerisi',
      status: 'active',
      yesVotes: 45,
      noVotes: 20,
      totalVotes: 65,
      endDate: '2024-02-20',
    },
    {
      id: '2',
      title: 'Otopark Yenileme',
      description: 'Kapalı otoparkın yenilenmesi',
      status: 'closed',
      yesVotes: 80,
      noVotes: 15,
      totalVotes: 95,
      endDate: '2024-02-05',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {votings.map((voting) => {
          const yesPercentage = (voting.yesVotes / voting.totalVotes) * 100;
          const isActive = voting.status === 'active';

          return (
            <Card key={voting.id} style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <View style={[styles.iconContainer, isActive ? styles.activeIcon : styles.closedIcon]}>
                    <Vote size={20} color={isActive ? '#6366f1' : '#666'} />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>{voting.title}</Text>
                    <View style={styles.statusRow}>
                      {isActive ? (
                        <>
                          <Clock size={14} color="#10b981" />
                          <Text style={[styles.statusText, { color: '#10b981' }]}>
                            Aktif • {voting.endDate}'e kadar
                          </Text>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} color="#666" />
                          <Text style={[styles.statusText, { color: '#666' }]}>
                            Sonuçlandı
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.description}>{voting.description}</Text>

                <View style={styles.votingStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Evet</Text>
                    <Text style={styles.statValue}>
                      {voting.yesVotes} ({Math.round(yesPercentage)}%)
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={yesPercentage / 100} 
                    color="#10b981"
                    style={styles.progressBar}
                  />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Hayır</Text>
                    <Text style={styles.statValue}>
                      {voting.noVotes} ({Math.round(100 - yesPercentage)}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <TrendingUp size={16} color="#666" />
                  <Text style={styles.totalVotes}>
                    Toplam {voting.totalVotes} oy
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    backgroundColor: '#eef2ff',
  },
  closedIcon: {
    backgroundColor: '#f3f4f6',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  votingStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalVotes: {
    fontSize: 12,
    color: '#666',
  },
});
