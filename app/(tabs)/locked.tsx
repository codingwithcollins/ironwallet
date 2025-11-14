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
import { Lock, Unlock, X } from 'lucide-react-native';

interface LockedSaving {
  id: string;
  amount: number;
  lock_reason: string;
  locked_at: string;
  unlock_date: string;
  status: string;
  goal_amount: number;
}

export default function LockedSavingsScreen() {
  const { user } = useAuth();
  const [savings, setSavings] = useState<LockedSaving[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSavings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('locked_savings')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'unlocked'])
      .order('unlock_date', { ascending: true });

    if (data) {
      setSavings(data);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavings();
    setRefreshing(false);
  };

  const handleLockSavings = async () => {
    if (!user || !amount || !reason || !unlockDate) return;

    setLoading(true);

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const unlockDateTime = new Date(unlockDate).toISOString();

    const { error } = await supabase.from('locked_savings').insert({
      user_id: user.id,
      amount: amountInCents,
      lock_reason: reason,
      unlock_date: unlockDateTime,
      status: 'active',
    });

    if (!error) {
      setModalVisible(false);
      setAmount('');
      setReason('');
      setUnlockDate('');
      await fetchSavings();
    }

    setLoading(false);
  };

  const handleUnlock = async (id: string) => {
    await supabase
      .from('locked_savings')
      .update({ status: 'unlocked' })
      .eq('id', id);

    await fetchSavings();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUnlockable = (unlockDateString: string) => {
    return new Date(unlockDateString) <= new Date();
  };

  const totalLocked = savings
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  const activeSavings = savings.filter((s) => s.status === 'active');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <H1>Locked Savings</H1>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Lock size={28} color="#FFD700" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Card style={styles.totalCard}>
          <Lock size={32} color="#FFD700" strokeWidth={2} />
          <Caption style={styles.totalLabel}>Total Locked</Caption>
          <H1 style={styles.totalAmount}>{formatCurrency(totalLocked)}</H1>
          <Body style={styles.totalHint}>Money you can't touch until the unlock date</Body>
        </Card>

        {activeSavings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Lock size={48} color="#666" strokeWidth={2} />
            <Body style={styles.emptyText}>No locked savings yet</Body>
            <Caption style={styles.emptyHint}>
              Lock money away to prevent impulse spending
            </Caption>
          </Card>
        ) : (
          <View style={styles.savingsList}>
            <H2 style={styles.sectionTitle}>Active Locks</H2>
            {activeSavings.map((saving) => (
              <Card key={saving.id} style={styles.savingCard}>
                <View style={styles.savingHeader}>
                  <H3>{saving.lock_reason}</H3>
                  <H3 style={styles.savingAmount}>{formatCurrency(saving.amount)}</H3>
                </View>

                <View style={styles.savingDetails}>
                  <Caption>Locked: {formatDate(saving.locked_at)}</Caption>
                  <Caption>Unlocks: {formatDate(saving.unlock_date)}</Caption>
                </View>

                {isUnlockable(saving.unlock_date) && (
                  <Button
                    title="Unlock Now"
                    onPress={() => handleUnlock(saving.id)}
                    variant="primary"
                    fullWidth
                  />
                )}
              </Card>
            ))}
          </View>
        )}
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
              <H2>Lock Savings</H2>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Body style={styles.modalHint}>
              Lock money away until a future date. No early withdrawals.
            </Body>

            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="100.00"
              keyboardType="numeric"
            />

            <Input
              label="Reason"
              value={reason}
              onChangeText={setReason}
              placeholder="Emergency fund, Vacation, etc."
            />

            <Input
              label="Unlock Date (YYYY-MM-DD)"
              value={unlockDate}
              onChangeText={setUnlockDate}
              placeholder="2025-12-31"
            />

            <Button
              title="Lock It"
              onPress={handleLockSavings}
              loading={loading}
              disabled={!amount || !reason || !unlockDate}
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
  totalCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
    gap: 8,
  },
  totalLabel: {
    marginTop: 8,
  },
  totalAmount: {
    fontSize: 48,
    marginVertical: 8,
  },
  totalHint: {
    textAlign: 'center',
    color: '#888',
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
  savingsList: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  savingCard: {
    marginBottom: 12,
  },
  savingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingAmount: {
    color: '#FFD700',
  },
  savingDetails: {
    gap: 4,
    marginBottom: 16,
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
    color: '#888',
  },
});
