import { createClient } from '@supabase/supabase-js';

// These will be set via environment variables in production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names
export const DB_TABLES = {
  YEARS: 'years',
  MEMBERS: 'members',
  FEE_SETTINGS: 'fee_settings',
  FEE_PAYMENTS: 'fee_payments',
  COMPETITIONS: 'competitions',
  COMPETITION_ATTENDANCES: 'competition_attendances',
  TRANSACTIONS: 'transactions',
  MEMBER_CELEBRATIONS: 'member_celebrations',
  COMPETITION_GROUPS: 'competition_groups',
  GROUP_MEMBERS: 'group_members',
} as const;