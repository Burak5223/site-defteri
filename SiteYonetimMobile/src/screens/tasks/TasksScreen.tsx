import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  dueDate: string;
}

export function TasksScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const tasks: Task[] = [
    {
      id: '1',
      title: 'Bahçe Temizliği',
      description: 'Ön bahçenin genel temizliği yapılacak',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Ahmet Yılmaz',
      dueDate: '2024-02-15',
    },
    {
      id: '2',
      title: 'Kapı Kontrol',
      description: 'Ana giriş kapısının kilit kontrolü',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Mehmet Demir',
      dueDate: '2024-02-16',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
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
        {tasks.map((task) => (
          <Card key={task.id} style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <ClipboardList size={20} color="#6366f1" />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{task.title}</Text>
                  <Text style={styles.assignee}>{task.assignedTo}</Text>
                </View>
              </View>

              <Text style={styles.description}>{task.description}</Text>

              <View style={styles.footer}>
                <View style={styles.chips}>
                  <Chip 
                    style={[styles.chip, { backgroundColor: `${getStatusColor(task.status)}20` }]}
                    textStyle={{ color: getStatusColor(task.status), fontSize: 11 }}
                  >
                    {getStatusText(task.status)}
                  </Chip>
                  <Chip 
                    style={[styles.chip, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}
                    textStyle={{ color: getPriorityColor(task.priority), fontSize: 11 }}
                  >
                    {getPriorityText(task.priority)}
                  </Chip>
                </View>
                <View style={styles.dueDate}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.dueDateText}>{task.dueDate}</Text>
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
  assignee: {
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
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
  },
});
