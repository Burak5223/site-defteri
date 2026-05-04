import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { Wrench, Clock, CheckCircle, XCircle } from 'lucide-react-native';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export function MaintenanceScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const requests: MaintenanceRequest[] = [
    {
      id: '1',
      title: 'Musluk Tamiri',
      description: 'Mutfak musluğu damlıyor',
      status: 'in_progress',
      createdAt: '2024-02-10',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Elektrik Arızası',
      description: 'Salon ışıkları yanmıyor',
      status: 'pending',
      createdAt: '2024-02-09',
      priority: 'medium',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in_progress': return Wrench;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {requests.map((request) => {
          const StatusIcon = getStatusIcon(request.status);
          
          return (
            <Card key={request.id} style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Wrench size={20} color="#6366f1" />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>{request.title}</Text>
                    <Text style={styles.date}>{request.createdAt}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <StatusIcon size={14} color="#fff" />
                  </View>
                </View>
                <Text style={styles.description}>{request.description}</Text>
                <Chip 
                  style={[styles.chip, { backgroundColor: `${getStatusColor(request.status)}20` }]}
                  textStyle={{ color: getStatusColor(request.status), fontSize: 12 }}
                >
                  {getStatusText(request.status)}
                </Chip>
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
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chip: {
    alignSelf: 'flex-start',
  },
});
