import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { H1, H2, H3, Body, Caption } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { TrendingDown, AlertTriangle, Target, Award } from 'lucide-react-native';

interface MonthlyReport {
  id: string;
  report_month: number;
  report_year: number;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  impulse_spending: number;
  top_spending_category: string;
  brutal_summary: string;
  goals_met: boolean;
}

const BRUTAL_SUMMARIES = [
  "You said you'd save. You didn't.",
  "Another month, another excuse.",
  "Your wallet is crying. Again.",
  "Maybe next month will be different? (Spoiler: It won't.)",
  "That impulse spending though... Impressive. Impressively bad.",
  "You know better. But here we are.",
  "Financial discipline? Never heard of her.",
  "Coffee addiction: 1, Your savings: 0.",
];

export default function ReportsScreen() {
  const { user } = useAuth();
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const generateCurrentMonthReport = async () => {
    if (!user) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth);

    if (!transactions) return;

    const totalIncome = transactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const impulseSpending = transactions
      .filter((t) => t.is_impulse)
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    const randomSummary = BRUTAL_SUMMARIES[Math.floor(Math.random() * BRUTAL_SUMMARIES.length)];

    const report: MonthlyReport = {
      id: '',
      report_month: currentMonth,
      report_year: currentYear,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      savings_rate: savingsRate,
      impulse_spending: impulseSpending,
      top_spending_category: 'Daily',
      brutal_summary: randomSummary,
      goals_met: savingsRate >= 20,
    };

    setCurrentReport(report);
  };

  useEffect(() => {
    generateCurrentMonthReport();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await generateCurrentMonthReport();
    setRefreshing(false);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  };

  if (!currentReport) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <H1>Monthly Reports</H1>
          <Body style={styles.loadingText}>Generating your report...</Body>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <H1 style={styles.title}>Monthly Report</H1>
        <Caption style={styles.subtitle}>
          {getMonthName(currentReport.report_month)} {currentReport.report_year}
        </Caption>

        <Card style={styles.summaryCard}>
          <AlertTriangle size={32} color="#FF4444" strokeWidth={2} />
          <Body style={styles.brutalSummary}>{currentReport.brutal_summary}</Body>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Caption style={styles.statLabel}>Income</Caption>
            <H2 style={styles.incomeText}>{formatCurrency(currentReport.total_income)}</H2>
          </Card>

          <Card style={styles.statCard}>
            <Caption style={styles.statLabel}>Expenses</Caption>
            <H2 style={styles.expenseText}>{formatCurrency(currentReport.total_expenses)}</H2>
          </Card>

          <Card style={styles.statCard}>
            <Caption style={styles.statLabel}>Savings Rate</Caption>
            <H2
              style={
                currentReport.savings_rate >= 20 ? styles.successText : styles.warningText
              }
            >
              {currentReport.savings_rate}%
            </H2>
          </Card>

          <Card style={styles.statCard}>
            <Caption style={styles.statLabel}>Impulse Spending</Caption>
            <H2 style={styles.impulseText}>
              {formatCurrency(currentReport.impulse_spending)}
            </H2>
          </Card>
        </View>

        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <TrendingDown size={24} color="#FFD700" strokeWidth={2} />
            <H3>Reality Check</H3>
          </View>

          <View style={styles.insightList}>
            {currentReport.savings_rate < 20 && (
              <View style={styles.insightItem}>
                <Body style={styles.insightText}>
                  Your savings rate is {currentReport.savings_rate}%. Aim for at least 20%.
                </Body>
              </View>
            )}

            {currentReport.impulse_spending > 0 && (
              <View style={styles.insightItem}>
                <Body style={styles.insightText}>
                  You spent {formatCurrency(currentReport.impulse_spending)} on impulse
                  purchases. That's money you'll never see again.
                </Body>
              </View>
            )}

            {currentReport.total_expenses > currentReport.total_income && (
              <View style={styles.insightItem}>
                <Body style={styles.insightText}>
                  You spent more than you earned. This is not sustainable.
                </Body>
              </View>
            )}

            {currentReport.savings_rate >= 20 && currentReport.impulse_spending === 0 && (
              <View style={styles.insightItem}>
                <Award size={20} color="#4ECDC4" strokeWidth={2} />
                <Body style={styles.successInsight}>
                  Actually doing well this month. Keep it up.
                </Body>
              </View>
            )}
          </View>
        </Card>

        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Target size={24} color={currentReport.goals_met ? '#4ECDC4' : '#FF4444'} strokeWidth={2} />
            <H3>Goal Status</H3>
          </View>

          <Body style={styles.goalText}>
            {currentReport.goals_met
              ? 'Goals met this month. Surprisingly.'
              : 'Goals not met. As expected.'}
          </Body>
        </Card>

        <Card style={styles.adviceCard}>
          <H3 style={styles.adviceTitle}>For Next Month</H3>
          <View style={styles.adviceList}>
            <Body style={styles.adviceItem}>• Track every expense, no exceptions</Body>
            <Body style={styles.adviceItem}>• Wait 24 hours before impulse purchases</Body>
            <Body style={styles.adviceItem}>• Review your budget categories weekly</Body>
            <Body style={styles.adviceItem}>• Actually use the locked savings feature</Body>
          </View>
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
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 24,
    textAlign: 'center',
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
    gap: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderColor: '#FF4444',
  },
  brutalSummary: {
    color: '#FF4444',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    textAlign: 'center',
  },
  incomeText: {
    color: '#4ECDC4',
  },
  expenseText: {
    color: '#FF6B6B',
  },
  successText: {
    color: '#4ECDC4',
  },
  warningText: {
    color: '#FF4444',
  },
  impulseText: {
    color: '#FF4444',
  },
  insightCard: {
    marginBottom: 24,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 8,
  },
  insightText: {
    flex: 1,
    color: '#FF4444',
  },
  successInsight: {
    flex: 1,
    color: '#4ECDC4',
  },
  goalCard: {
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  goalText: {
    color: '#CCC',
  },
  adviceCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: '#FFD700',
  },
  adviceTitle: {
    color: '#FFD700',
    marginBottom: 16,
  },
  adviceList: {
    gap: 12,
  },
  adviceItem: {
    color: '#CCC',
  },
});
