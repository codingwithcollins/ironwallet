import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { H1, H2, H3, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react-native';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  merchant: string;
  description: string;
  transaction_date: string;
  is_impulse: boolean;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const fetchTransactions = async () => {
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('transaction_type', filter);
    }

    const { data } = await query;

    if (data) {
      setTransactions(data);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const totalIncome = transactions
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <H1 style={styles.title}>Transactions</H1>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <ArrowUpCircle size={24} color="#4ECDC4" strokeWidth={2} />
            <Caption style={styles.summaryLabel}>Income</Caption>
            <H3 style={styles.incomeAmount}>{formatCurrency(totalIncome)}</H3>
          </Card>

          <Card style={styles.summaryCard}>
            <ArrowDownCircle size={24} color="#FF6B6B" strokeWidth={2} />
            <Caption style={styles.summaryLabel}>Expenses</Caption>
            <H3 style={styles.expenseAmount}>{formatCurrency(totalExpenses)}</H3>
          </Card>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Caption style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Caption>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
            onPress={() => setFilter('income')}
          >
            <Caption style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>
              Income
            </Caption>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
            onPress={() => setFilter('expense')}
          >
            <Caption style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>
              Expenses
            </Caption>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Body style={styles.emptyText}>No transactions yet</Body>
            <Caption style={styles.emptyHint}>
              Start tracking your income and expenses
            </Caption>
          </Card>
        ) : (
          <View style={styles.transactionList}>
            {transactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    {transaction.transaction_type === 'income' ? (
                      <ArrowUpCircle size={20} color="#4ECDC4" strokeWidth={2} />
                    ) : (
                      <ArrowDownCircle size={20} color="#FF6B6B" strokeWidth={2} />
                    )}
                    <View>
                      <H3 style={styles.transactionMerchant}>
                        {transaction.merchant || 'Unknown'}
                      </H3>
                      <Caption>{formatDate(transaction.transaction_date)}</Caption>
                      {transaction.is_impulse && (
                        <Caption style={styles.impulseTag}>Impulse</Caption>
                      )}
                    </View>
                  </View>

                  <H3
                    style={
                      transaction.transaction_type === 'income'
                        ? styles.incomeAmount
                        : styles.expenseAmount
                    }
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </H3>
                </View>

                {transaction.description && (
                  <Caption style={styles.transactionDescription}>
                    {transaction.description}
                  </Caption>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    marginTop: 4,
  },
  incomeAmount: {
    color: '#4ECDC4',
  },
  expenseAmount: {
    color: '#FF6B6B',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  filterText: {
    color: '#888',
  },
  filterTextActive: {
    color: '#FFD700',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptyHint: {
    color: '#666',
  },
  transactionList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionMerchant: {
    marginBottom: 2,
  },
  transactionDescription: {
    marginTop: 8,
    paddingLeft: 32,
  },
  impulseTag: {
    color: '#FF4444',
    fontWeight: '600',
    marginTop: 2,
  },
});
