/*
  # IronWallet Database Schema
  
  ## Overview
  Complete database schema for IronWallet - a personal finance app focused on discipline and impulse control.
  
  ## Tables Created
  
  ### 1. profiles
  - Stores user profile information and preferences
  - Links to auth.users via user_id
  - Tracks onboarding completion status
  - Stores impulse blocker settings
  
  ### 2. budget_categories
  - Defines the 5 core budget splits: Bills, Goals, Daily, Freedom, Emergency
  - Each category has allocation percentage and locked status
  - Tracks current balance per category
  
  ### 3. transactions
  - All financial transactions (income, expense, transfer)
  - Links to budget categories
  - Tracks transaction metadata (merchant, notes, etc)
  
  ### 4. locked_savings
  - Savings that users lock with unlock dates
  - Tracks lock reason and goal amount
  - Status: active, unlocked, cancelled
  
  ### 5. treat_wallet
  - Separate wallet for generosity/treating others
  - Tracks balance and monthly budget
  - Records all treat transactions
  
  ### 6. income_splits
  - Templates for auto-splitting income
  - Defines percentage allocation across categories
  
  ### 7. monthly_reports
  - Generated end-of-month summaries
  - Stores brutal/sarcastic report data
  - Tracks savings rate, impulse spending, etc
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Policies enforce authentication and ownership
  
  ## Notes
  - All monetary values stored in cents (integer) for precision
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text DEFAULT '',
  email text NOT NULL,
  monthly_income integer DEFAULT 0,
  currency text DEFAULT 'USD',
  onboarding_completed boolean DEFAULT false,
  impulse_blocker_enabled boolean DEFAULT false,
  show_total_balance boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_name text NOT NULL,
  category_type text NOT NULL CHECK (category_type IN ('bills', 'goals', 'daily', 'freedom', 'emergency')),
  allocation_percentage integer DEFAULT 0 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  current_balance integer DEFAULT 0,
  is_locked boolean DEFAULT false,
  color_code text DEFAULT '#FFD700',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_type)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'treat')),
  amount integer NOT NULL,
  merchant text DEFAULT '',
  description text DEFAULT '',
  transaction_date timestamptz DEFAULT now(),
  is_impulse boolean DEFAULT false,
  pain_reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create locked_savings table
CREATE TABLE IF NOT EXISTS locked_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  lock_reason text NOT NULL,
  locked_at timestamptz DEFAULT now(),
  unlock_date timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'unlocked', 'cancelled')),
  goal_amount integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treat_wallet table
CREATE TABLE IF NOT EXISTS treat_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_balance integer DEFAULT 0,
  monthly_budget integer DEFAULT 0,
  total_spent_this_month integer DEFAULT 0,
  last_reset_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create income_splits table
CREATE TABLE IF NOT EXISTS income_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES budget_categories(id) ON DELETE CASCADE NOT NULL,
  split_percentage integer NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Create monthly_reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_month integer NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year integer NOT NULL,
  total_income integer DEFAULT 0,
  total_expenses integer DEFAULT 0,
  savings_rate integer DEFAULT 0,
  impulse_spending integer DEFAULT 0,
  top_spending_category text DEFAULT '',
  brutal_summary text DEFAULT '',
  goals_met boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, report_month, report_year)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treat_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Budget categories policies
CREATE POLICY "Users can view own budget categories"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget categories"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget categories"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget categories"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Locked savings policies
CREATE POLICY "Users can view own locked savings"
  ON locked_savings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locked savings"
  ON locked_savings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locked savings"
  ON locked_savings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own locked savings"
  ON locked_savings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Treat wallet policies
CREATE POLICY "Users can view own treat wallet"
  ON treat_wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treat wallet"
  ON treat_wallet FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treat wallet"
  ON treat_wallet FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Income splits policies
CREATE POLICY "Users can view own income splits"
  ON income_splits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income splits"
  ON income_splits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income splits"
  ON income_splits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income splits"
  ON income_splits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Monthly reports policies
CREATE POLICY "Users can view own monthly reports"
  ON monthly_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly reports"
  ON monthly_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly reports"
  ON monthly_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_locked_savings_user_id ON locked_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_treat_wallet_user_id ON treat_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_income_splits_user_id ON income_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_id ON monthly_reports(user_id);