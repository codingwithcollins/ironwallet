import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H1, H2, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';

const DEFAULT_CATEGORIES = [
  { type: 'bills', name: 'Bills', percentage: 30, color: '#FF6B6B' },
  { type: 'goals', name: 'Goals', percentage: 20, color: '#4ECDC4' },
  { type: 'daily', name: 'Daily', percentage: 25, color: '#FFD700' },
  { type: 'freedom', name: 'Freedom', percentage: 20, color: '#95E1D3' },
  { type: 'emergency', name: 'Emergency', percentage: 5, color: '#F38181' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePercentageChange = (index: number, value: string) => {
    const newCategories = [...categories];
    const percentage = parseInt(value) || 0;
    newCategories[index].percentage = Math.min(100, Math.max(0, percentage));
    setCategories(newCategories);
  };

  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    const incomeInCents = Math.round(parseFloat(monthlyIncome) * 100);

    await supabase
      .from('profiles')
      .update({
        monthly_income: incomeInCents,
        onboarding_completed: true,
      })
      .eq('user_id', user.id);

    for (const category of categories) {
      const { data: existingCategory } = await supabase
        .from('budget_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_type', category.type)
        .maybeSingle();

      if (!existingCategory) {
        await supabase.from('budget_categories').insert({
          user_id: user.id,
          category_name: category.name,
          category_type: category.type,
          allocation_percentage: category.percentage,
          current_balance: 0,
          color_code: category.color,
        });

        await supabase.from('income_splits').insert({
          user_id: user.id,
          category_id: existingCategory?.id,
          split_percentage: category.percentage,
        });
      }
    }

    setLoading(false);
    router.replace('/(tabs)');
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <H1 style={styles.title}>Let's Get Started</H1>
          <Body style={styles.subtitle}>
            First, we need to know your monthly income. Be honest — we're here to help, not judge.
          </Body>

          <Card style={styles.card}>
            <Input
              label="Monthly Income"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              placeholder="5000"
              keyboardType="numeric"
            />

            <Caption style={styles.hint}>
              Enter your total monthly income after taxes
            </Caption>
          </Card>

          <Button
            title="Next"
            onPress={() => setStep(2)}
            disabled={!monthlyIncome || parseFloat(monthlyIncome) <= 0}
            fullWidth
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <H1 style={styles.title}>Split Your Income</H1>
        <Body style={styles.subtitle}>
          Here's how we'll automatically split your money. Adjust as needed.
        </Body>

        {categories.map((category, index) => (
          <Card key={category.type} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={[styles.colorDot, { backgroundColor: category.color }]} />
              <H2 style={styles.categoryName}>{category.name}</H2>
            </View>

            <Input
              value={category.percentage.toString()}
              onChangeText={(value) => handlePercentageChange(index, value)}
              keyboardType="numeric"
              placeholder="0"
            />

            <Body style={styles.categoryAmount}>
              ${((parseFloat(monthlyIncome) * category.percentage) / 100).toFixed(2)}
            </Body>
          </Card>
        ))}

        <Card style={[styles.totalCard, totalPercentage !== 100 && styles.totalCardError]}>
          <Body style={styles.totalText}>Total Allocated</Body>
          <H2 style={totalPercentage !== 100 ? styles.totalError : styles.totalSuccess}>
            {totalPercentage}%
          </H2>
        </Card>

        {totalPercentage !== 100 && (
          <Caption style={styles.errorText}>
            Total must equal 100%. Currently: {totalPercentage}%
          </Caption>
        )}

        <Button
          title="Complete Setup"
          onPress={handleComplete}
          disabled={totalPercentage !== 100}
          loading={loading}
          fullWidth
        />
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
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 32,
  },
  card: {
    marginBottom: 24,
  },
  hint: {
    marginTop: 8,
  },
  categoryCard: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 18,
  },
  categoryAmount: {
    marginTop: 8,
    color: '#FFD700',
  },
  totalCard: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCardError: {
    borderColor: '#FF4444',
  },
  totalText: {
    fontSize: 16,
  },
  totalSuccess: {
    color: '#4ECDC4',
  },
  totalError: {
    color: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});
