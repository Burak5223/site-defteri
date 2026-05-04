import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react-native';
import { apiClient } from '../../api/apiClient';
import { Due } from '../../types';
import { spacing } from '../../theme';

type StatusKey = 'all' | 'pending' | 'overdue' | 'paid';

interface MappedDue {
  id: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

const DuesScreen = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusKey>('all');
  const [selectedDues, setSelectedDues] = useState<string[]>([]);

  useEffect(() => {
    loadDues();
  }, []);

  const loadDues = async () => {
    try {
      const data = await apiClient.get<Due[]>('/dues/my-dues');
      setDues(data);
    } catch (error) {
      console.error('Aidatlar yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDues();
  };

  const mappedDues: MappedDue[] = dues.map((d) => ({
    id: d.dueId,
    amount: d.amount,
    dueDate: d.dueDate,
    status:
      d.status === 'PAID'
        ? 'paid'
        : d.status === 'OVERDUE'
        ? 'overdue'
        : 'pending',
    description: d.description,
  }));

  const filteredDues =
    activeTab === 'all'
      ? mappedDues
      : mappedDues.filter((d) => d.status === activeTab);

  const totalPending = mappedDues
    .filter((d) => d.status === 'pending' || d.status === 'overdue')
    .reduce((sum, d) => sum + d.amount, 0);

  const selectedTotal = mappedDues
    .filter((d) => selectedDues.includes(d.id))
    .reduce((sum, d) => sum + d.amount, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const toggleDueSelection = (id: string) => {
    setSelectedDues((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'pending':
        return 'Bekliyor';
      case 'overdue':
        return 'Gecikmiş';
      default:
        return status;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(16,185,129,0.08)', color: '#16a34a' };
      case 'pending':
        return { bg: 'rgba(245,158,11,0.08)', color: '#d97706' };
      case 'overdue':
        return { bg: 'rgba(239,68,68,0.08)', color: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconPrimary}>
              <CreditCard size={18} color="#0f766e" />
            </View>
            <Text style={styles.summaryLabel}>Bekleyen Aidat</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        </View>

        <View style={styles.tabsWrapper}>
          {(['all', 'pending', 'overdue', 'paid'] as StatusKey[]).map(
            (tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab === 'all'
                    ? 'Tümü'
                    : tab === 'pending'
                    ? 'Bekleyen'
                    : tab === 'overdue'
                    ? 'Gecikmiş'
                    : 'Ödenmiş'}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {selectedDues.length > 0 && (
          <View style={styles.selectedPill}>
            <Text style={styles.selectedPillText}>
              {selectedDues.length} aidat seçildi •{' '}
              {formatCurrency(selectedTotal)}
            </Text>
          </View>
        )}

        {filteredDues.length === 0 ? (
          <View style={styles.emptyState}>
            <Shield size={40} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>
              Bu filtrede aidat bulunamadı
            </Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {filteredDues.map((due) => {
              const checked = selectedDues.includes(due.id);
              const colors = getStatusColors(due.status);
              const StatusIcon =
                due.status === 'paid'
                  ? CheckCircle2
                  : due.status === 'overdue'
                  ? AlertCircle
                  : Clock;

              return (
                <Pressable
                  key={due.id}
                  style={styles.dueCard}
                  onPress={() => toggleDueSelection(due.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked,
                    ]}
                  >
                    {checked && (
                      <CheckCircle2 size={16} color="#0f766e" />
                    )}
                  </View>
                  <View style={styles.dueInfo}>
                    <View style={styles.dueTopRow}>
                      <Text style={styles.dueTitle}>
                        {formatDate(due.dueDate)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: colors.bg },
                        ]}
                      >
                        <StatusIcon
                          size={14}
                          color={colors.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: colors.color },
                          ]}
                        >
                          {getStatusLabel(due.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dueMidRow}>
                      <Text style={styles.amountText}>
                        {formatCurrency(due.amount)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.hintCard}>
          <Clock size={14} color="#0f766e" style={{ marginRight: 6 }} />
          <Text style={styles.hintText}>
            Ödemeler mobil uygulama içinden veya yönetim ofisi üzerinden
            alınır.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    rowGap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  summaryRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  summaryIconPrimary: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '700',
    color: '#020617',
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 11,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#0f766e',
    fontWeight: '500',
  },
  selectedPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(15,118,110,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedPillText: {
    fontSize: 11,
    color: '#0f766e',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  listSpace: {
    rowGap: 8,
  },
  dueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    borderColor: '#0f766e',
    backgroundColor: 'rgba(15,118,110,0.08)',
  },
  dueInfo: {
    flex: 1,
    minWidth: 0,
  },
  dueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020617',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
  },
  dueMidRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#020617',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(15,118,110,0.06)',
    marginTop: 12,
  },
  hintText: {
    fontSize: 11,
    color: '#0f766e',
  },
});

export default DuesScreen;
