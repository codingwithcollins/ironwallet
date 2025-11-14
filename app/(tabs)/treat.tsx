import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { H1, H2, H3, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Gift, X, Heart } from 'lucide-react-native';

interface TreatWallet {
  current_balance: number;
  monthly_budget: number;
  total_spent_this_month: number;
}

interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  description: string;
  transaction_date: string;
}

export default function TreatWalletScreen() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<TreatWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    const { data: walletData } = await supabase
      .from('treat_wallet')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletData) {
      setWallet(walletData);
    }

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('transaction_type', 'treat')
      .order('transaction_date', { ascending: false })
      .limit(20);

    if (transactionsData) {
      setTransactions(transactionsData);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSpend = async () => {
    if (!user || !wallet || !amount || !recipient) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (amountInCents > wallet.current_balance) {
      return;
    }

    setLoading(true);

    await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_type: 'treat',
      amount: amountInCents,
      merchant: recipient,
      description: description || '',
    });

    await supabase
      .from('treat_wallet')
      .update({
        current_balance: wallet.current_balance - amountInCents,
        total_spent_this_month: wallet.total_spent_this_month + amountInCents,
      })
      .eq('user_id', user.id);

    setModalVisible(false);
    setAmount('');
    setRecipient('');
    setDescription('');
    await fetchData();
    setLoading(false);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const remainingBudget = wallet
    ? wallet.monthly_budget - wallet.total_spent_this_month
    : 0;

  const isBalanceEmpty = wallet && wallet.current_balance <= 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <H1>Treat Wallet</H1>
          <TouchableOpacity onPress={() => setModalVisible(true)} disabled={isBalanceEmpty}>
            <Gift size={28} color={isBalanceEmpty ? '#666' : '#FFD700'} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Card style={styles.balanceCard}>
          <Gift size={32} color="#FFD700" strokeWidth={2} />
          <Caption style={styles.balanceLabel}>Available to Give</Caption>
          <H1 style={styles.balanceAmount}>
            {wallet ? formatCurrency(wallet.current_balance) : '$0.00'}
          </H1>
          {isBalanceEmpty ? (
            <Body style={styles.emptyMessage}>
              Your generosity budget is empty. Time to refill it.
            </Body>
          ) : (
            <Body style={styles.balanceHint}>Money dedicated to treating others</Body>
          )}
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Caption>Monthly Budget</Caption>
            <H3 style={styles.statAmount}>
              {wallet ? formatCurrency(wallet.monthly_budget) : '$0.00'}
            </H3>
          </Card>

          <Card style={styles.statCard}>
            <Caption>Spent This Month</Caption>
            <H3 style={styles.spentAmount}>
              {wallet ? formatCurrency(wallet.total_spent_this_month) : '$0.00'}
            </H3>
          </Card>
        </View>

        {isBalanceEmpty && (
          <Card style={styles.warningCard}>
            <Body style={styles.warningText}>
              You've spent your entire generosity budget. No more treating until you add funds.
            </Body>
          </Card>
        )}

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Recent Treats</H2>

          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Heart size={48} color="#666" strokeWidth={2} />
              <Body style={styles.emptyText}>No treats yet</Body>
              <Caption style={styles.emptyHint}>
                Use this wallet to treat friends, family, or charity
              </Caption>
            </Card>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <Heart size={20} color="#FFD700" strokeWidth={2} />
                      <View>
                        <H3>{transaction.merchant}</H3>
                        <Caption>{formatDate(transaction.transaction_date)}</Caption>
                      </View>
                    </View>
                    <H3 style={styles.treatAmount}>
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
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <H2>Give a Treat</H2>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Body style={styles.modalHint}>
              Available: {wallet ? formatCurrency(wallet.current_balance) : '$0.00'}
            </Body>

            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="25.00"
              keyboardType="numeric"
            />

            <Input
              label="Who are you treating?"
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Friend, Family, Charity, etc."
            />

            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Coffee, Lunch, Gift, etc."
            />

            <Button
              title="Give"
              onPress={handleSpend}
              loading={loading}
              disabled={
                !amount ||
                !recipient ||
                (wallet && Math.round(parseFloat(amount) * 100) > wallet.current_balance)
              }
              fullWidth
            />

            <Button
              title="Cancel"
              onPress={() => setModalVisible(false)}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
    gap: 8,
  },
  balanceLabel: {
    marginTop: 8,
  },
  balanceAmount: {
    fontSize: 48,
    marginVertical: 8,
  },
  balanceHint: {
    textAlign: 'center',
    color: '#888',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#FF4444',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statAmount: {
    color: '#4ECDC4',
  },
  spentAmount: {
    color: '#FF6B6B',
  },
  warningCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: '#FF4444',
  },
  warningText: {
    color: '#FF4444',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    marginTop: 8,
  },
  emptyHint: {
    color: '#666',
    textAlign: 'center',
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
  treatAmount: {
    color: '#FFD700',
  },
  transactionDescription: {
    marginTop: 8,
    paddingLeft: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHint: {
    marginBottom: 24,
    color: '#FFD700',
  },
});
