import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { H1, H2, H3, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Plus, TrendingDown } from 'lucide-react-native';

interface Profile {
  monthly_income: number;
  impulse_blocker_enabled: boolean;
  show_total_balance: boolean;
}

interface BudgetCategory {
  id: string;
  category_name: string;
  category_type: string;
  current_balance: number;
  allocation_percentage: number;
  color_code: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      setShowBalance(profileData.show_total_balance);

      if (!profileData.onboarding_completed) {
        router.replace('/onboarding');
        return;
      }
    }

    const { data: categoriesData } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('category_type');

    if (categoriesData) {
      setCategories(categoriesData);
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

  const totalBalance = categories.reduce((sum, cat) => sum + cat.current_balance, 0);
  const dailyCategory = categories.find((cat) => cat.category_type === 'daily');
  const dailyAllowance = dailyCategory ? dailyCategory.current_balance / 100 : 0;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <H1>IronWallet</H1>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
            {showBalance ? (
              <Eye size={24} color="#FFD700" strokeWidth={2} />
            ) : (
              <EyeOff size={24} color="#FFD700" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <Card style={styles.balanceCard}>
          <Caption style={styles.balanceLabel}>Today's Allowance</Caption>
          <H1 style={styles.balanceAmount}>
            {showBalance ? formatCurrency(dailyCategory?.current_balance || 0) : '••••'}
          </H1>
          <Body style={styles.balanceHint}>
            This is all you can spend today. Make it count.
          </Body>
        </Card>

        {!profile?.impulse_blocker_enabled && (
          <Card style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Body>Total Balance</Body>
              <H2>{showBalance ? formatCurrency(totalBalance) : '••••'}</H2>
            </View>
          </Card>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <H2>Budget Categories</H2>
          </View>

          {categories.map((category) => (
            <Card key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[styles.categoryDot, { backgroundColor: category.color_code }]}
                  />
                  <View>
                    <H3>{category.category_name}</H3>
                    <Caption>{category.allocation_percentage}% allocated</Caption>
                  </View>
                </View>
                <H3 style={styles.categoryAmount}>
                  {showBalance ? formatCurrency(category.current_balance) : '••••'}
                </H3>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <Button
            title="Add Income"
            onPress={() => {}}
            variant="primary"
            fullWidth
          />
          <Button
            title="Add Expense"
            onPress={() => {}}
            variant="secondary"
            fullWidth
          />
        </View>

        <Card style={styles.motivationCard}>
          <TrendingDown size={32} color="#FF4444" strokeWidth={2} />
          <Body style={styles.motivationText}>
            "You said you'd save this month. Let's see if you mean it this time."
          </Body>
        </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
  balanceLabel: {
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    marginBottom: 8,
  },
  balanceHint: {
    textAlign: 'center',
    color: '#888',
  },
  totalCard: {
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  categoryCard: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryAmount: {
    color: '#FFD700',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  motivationCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderColor: '#FF4444',
  },
  motivationText: {
    textAlign: 'center',
    color: '#FF4444',
    fontStyle: 'italic',
  },
});
