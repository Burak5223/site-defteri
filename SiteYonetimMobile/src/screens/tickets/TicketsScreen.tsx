import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react-native';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

export function TicketsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const tickets: Ticket[] = [
    {
      id: '1',
      title: 'İnternet Problemi',
      description: 'İnternet bağlantısı yavaş',
      category: 'Teknik',
      priority: 'high',
      status: 'open',
      createdAt: '2024-02-12',
    },
    {
      id: '2',
      title: 'Asansör Arızası',
      description: '3. kat asansörü çalışmıyor',
      category: 'Bakım',
      priority: 'urgent',
      status: 'in_progress',
      createdAt: '2024-02-11',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return priority;
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
        {tickets.map((ticket) => (
          <Card key={ticket.id} style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getPriorityColor(ticket.priority)}20` }]}>
                  <AlertTriangle size={20} color={getPriorityColor(ticket.priority)} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{ticket.title}</Text>
                  <Text style={styles.category}>{ticket.category}</Text>
                </View>
              </View>

              <Text style={styles.description}>{ticket.description}</Text>

              <View style={styles.footer}>
                <View style={styles.chips}>
                  <Chip 
                    style={[styles.chip, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}
                    textStyle={{ color: getStatusColor(ticket.status), fontSize: 11 }}
                  >
                    {getStatusText(ticket.status)}
                  </Chip>
                  <Chip 
                    style={[styles.chip, { backgroundColor: `${getPriorityColor(ticket.priority)}20` }]}
                    textStyle={{ color: getPriorityColor(ticket.priority), fontSize: 11 }}
                  >
                    {getPriorityText(ticket.priority)}
                  </Chip>
                </View>
                <View style={styles.date}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.dateText}>{ticket.createdAt}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 24,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
});
