import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';

export function FinanceScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const financeData = {
    totalIncome: 125000,
    totalExpense: 75000,
    balance: 50000,
    monthlyIncome: 25000,
    monthlyExpense: 15000,
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <View style={styles.balanceHeader}>
              <Wallet size={24} color="#fff" />
              <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
            </View>
            <Text style={styles.balanceAmount}>
              ₺{financeData.balance.toLocaleString('tr-TR')}
            </Text>
          </Card.Content>
        </Card>

        {/* Income/Expense Cards */}
        <View style={styles.row}>
          <Card style={[styles.card, styles.incomeCard]}>
            <Card.Content>
              <TrendingUp size={20} color="#10b981" />
              <Text style={styles.cardLabel}>Gelir</Text>
              <Text style={styles.cardAmount}>
                ₺{financeData.totalIncome.toLocaleString('tr-TR')}
              </Text>
              <Text style={styles.cardSubtext}>
                Aylık: ₺{financeData.monthlyIncome.toLocaleString('tr-TR')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.expenseCard]}>
            <Card.Content>
              <TrendingDown size={20} color="#ef4444" />
              <Text style={styles.cardLabel}>Gider</Text>
              <Text style={styles.cardAmount}>
                ₺{financeData.totalExpense.toLocaleString('tr-TR')}
              </Text>
              <Text style={styles.cardSubtext}>
                Aylık: ₺{financeData.monthlyExpense.toLocaleString('tr-TR')}
              </Text>
            </Card.Content>
          </Card>
        </View>
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
  balanceCard: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
  },
  incomeCard: {
    backgroundColor: '#f0fdf4',
  },
  expenseCard: {
    backgroundColor: '#fef2f2',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  cardSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
