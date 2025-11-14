import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { H1, H2, H3, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, DollarSign, Eye, LogOut, Shield } from 'lucide-react-native';

interface Profile {
  full_name: string;
  email: string;
  monthly_income: number;
  currency: string;
  impulse_blocker_enabled: boolean;
  show_total_balance: boolean;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [impulseBlocker, setImpulseBlocker] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setMonthlyIncome((data.monthly_income / 100).toFixed(2));
      setImpulseBlocker(data.impulse_blocker_enabled);
      setShowBalance(data.show_total_balance);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const incomeInCents = Math.round(parseFloat(monthlyIncome) * 100);

    await supabase
      .from('profiles')
      .update({
        monthly_income: incomeInCents,
        impulse_blocker_enabled: impulseBlocker,
        show_total_balance: showBalance,
      })
      .eq('user_id', user.id);

    await fetchProfile();
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <H1 style={styles.title}>Settings</H1>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color="#FFD700" strokeWidth={2} />
            <H2>Profile</H2>
          </View>

          <View style={styles.infoRow}>
            <Caption>Email</Caption>
            <Body>{profile?.email}</Body>
          </View>

          <View style={styles.infoRow}>
            <Caption>Currency</Caption>
            <Body>{profile?.currency}</Body>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={24} color="#FFD700" strokeWidth={2} />
            <H2>Budget</H2>
          </View>

          <Input
            label="Monthly Income"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            placeholder="5000.00"
            keyboardType="numeric"
          />

          <Caption style={styles.hint}>
            Current monthly income: {profile ? formatCurrency(profile.monthly_income) : '$0.00'}
          </Caption>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color="#FFD700" strokeWidth={2} />
            <H2>Discipline Controls</H2>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <H3>Impulse Blocker</H3>
              <Caption style={styles.settingDescription}>
                Hide total balance, show only daily allowance
              </Caption>
            </View>
            <Switch
              value={impulseBlocker}
              onValueChange={setImpulseBlocker}
              trackColor={{ false: '#333', true: '#FFD700' }}
              thumbColor={impulseBlocker ? '#000' : '#666'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <H3>Show Total Balance</H3>
              <Caption style={styles.settingDescription}>
                Display your total balance on dashboard
              </Caption>
            </View>
            <Switch
              value={showBalance}
              onValueChange={setShowBalance}
              trackColor={{ false: '#333', true: '#FFD700' }}
              thumbColor={showBalance ? '#000' : '#666'}
            />
          </View>
        </Card>

        <Card style={styles.warningCard}>
          <Body style={styles.warningText}>
            "Discipline is doing what you hate to do, but doing it like you love it."
          </Body>
          <Caption style={styles.warningAuthor}>— Mike Tyson</Caption>
        </Card>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          fullWidth
        />

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />

        <Caption style={styles.version}>IronWallet v1.0.0</Caption>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  hint: {
    marginTop: 8,
    color: '#888',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    marginTop: 4,
  },
  warningCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: '#FFD700',
  },
  warningText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningAuthor: {
    textAlign: 'center',
    color: '#FFD700',
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
});
