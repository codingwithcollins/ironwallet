export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          monthly_income: number
          currency: string
          onboarding_completed: boolean
          impulse_blocker_enabled: boolean
          show_total_balance: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string
          email: string
          monthly_income?: number
          currency?: string
          onboarding_completed?: boolean
          impulse_blocker_enabled?: boolean
          show_total_balance?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          monthly_income?: number
          currency?: string
          onboarding_completed?: boolean
          impulse_blocker_enabled?: boolean
          show_total_balance?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budget_categories: {
        Row: {
          id: string
          user_id: string
          category_name: string
          category_type: 'bills' | 'goals' | 'daily' | 'freedom' | 'emergency'
          allocation_percentage: number
          current_balance: number
          is_locked: boolean
          color_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_name: string
          category_type: 'bills' | 'goals' | 'daily' | 'freedom' | 'emergency'
          allocation_percentage?: number
          current_balance?: number
          is_locked?: boolean
          color_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_name?: string
          category_type?: 'bills' | 'goals' | 'daily' | 'freedom' | 'emergency'
          allocation_percentage?: number
          current_balance?: number
          is_locked?: boolean
          color_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          transaction_type: 'income' | 'expense' | 'transfer' | 'treat'
          amount: number
          merchant: string
          description: string
          transaction_date: string
          is_impulse: boolean
          pain_reminder_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          transaction_type: 'income' | 'expense' | 'transfer' | 'treat'
          amount: number
          merchant?: string
          description?: string
          transaction_date?: string
          is_impulse?: boolean
          pain_reminder_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          transaction_type?: 'income' | 'expense' | 'transfer' | 'treat'
          amount?: number
          merchant?: string
          description?: string
          transaction_date?: string
          is_impulse?: boolean
          pain_reminder_sent?: boolean
          created_at?: string
        }
      }
      locked_savings: {
        Row: {
          id: string
          user_id: string
          amount: number
          lock_reason: string
          locked_at: string
          unlock_date: string
          status: 'active' | 'unlocked' | 'cancelled'
          goal_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          lock_reason: string
          locked_at?: string
          unlock_date: string
          status?: 'active' | 'unlocked' | 'cancelled'
          goal_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          lock_reason?: string
          locked_at?: string
          unlock_date?: string
          status?: 'active' | 'unlocked' | 'cancelled'
          goal_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      treat_wallet: {
        Row: {
          id: string
          user_id: string
          current_balance: number
          monthly_budget: number
          total_spent_this_month: number
          last_reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_balance?: number
          monthly_budget?: number
          total_spent_this_month?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_balance?: number
          monthly_budget?: number
          total_spent_this_month?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      income_splits: {
        Row: {
          id: string
          user_id: string
          category_id: string
          split_percentage: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          split_percentage: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          split_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      monthly_reports: {
        Row: {
          id: string
          user_id: string
          report_month: number
          report_year: number
          total_income: number
          total_expenses: number
          savings_rate: number
          impulse_spending: number
          top_spending_category: string
          brutal_summary: string
          goals_met: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_month: number
          report_year: number
          total_income?: number
          total_expenses?: number
          savings_rate?: number
          impulse_spending?: number
          top_spending_category?: string
          brutal_summary?: string
          goals_met?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_month?: number
          report_year?: number
          total_income?: number
          total_expenses?: number
          savings_rate?: number
          impulse_spending?: number
          top_spending_category?: string
          brutal_summary?: string
          goals_met?: boolean
          created_at?: string
        }
      }
    }
  }
}
