-- ゴルフ会管理アプリのデータベーススキーマ

-- 年度テーブル
CREATE TABLE IF NOT EXISTS years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会員テーブル
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('会員', '旧会員', '配偶者', 'ゲスト')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会費設定テーブル
CREATE TABLE IF NOT EXISTS fee_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('会員', '旧会員', '配偶者', 'ゲスト')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year_id, member_type)
);

-- 会費支払いテーブル
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- コンペテーブル
CREATE TABLE IF NOT EXISTS competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  golf_course VARCHAR(100) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  title VARCHAR(200) NOT NULL,
  rules TEXT NOT NULL,
  fee INTEGER NOT NULL CHECK (fee >= 0),
  custom_field_1 VARCHAR(100),
  custom_field_2 VARCHAR(100),
  custom_field_3 VARCHAR(100),
  has_celebration BOOLEAN DEFAULT FALSE,
  celebration_venue VARCHAR(100),
  celebration_start_time TIMESTAMP WITH TIME ZONE,
  celebration_fee INTEGER CHECK (celebration_fee >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- コンペ出欠テーブル
CREATE TABLE IF NOT EXISTS competition_attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  golf_attendance VARCHAR(1) CHECK (golf_attendance IN ('〇', '×', '△')),
  golf_comment VARCHAR(200),
  celebration_attendance VARCHAR(1) CHECK (celebration_attendance IN ('〇', '×', '△')),
  celebration_comment VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition_id, member_id)
);

-- 取引テーブル
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description VARCHAR(200) NOT NULL,
  transaction_date DATE NOT NULL,
  is_reimbursement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会員お祝いテーブル
CREATE TABLE IF NOT EXISTS member_celebrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  age INTEGER NOT NULL CHECK (age IN (60, 70, 77, 80)),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, age, year_id)
);

-- コンペ組テーブル（新規追加）
CREATE TABLE IF NOT EXISTS competition_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  group_number INTEGER NOT NULL,
  start_time TIME,
  notes VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition_id, group_number)
);

-- 組メンバーテーブル（新規追加）
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES competition_groups(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, position),
  UNIQUE(group_id, member_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_years_active ON years(is_active);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_competitions_year ON competitions(year_id);
CREATE INDEX IF NOT EXISTS idx_competitions_start_time ON competitions(start_time);
CREATE INDEX IF NOT EXISTS idx_attendances_competition ON competition_attendances(competition_id);
CREATE INDEX IF NOT EXISTS idx_attendances_member ON competition_attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_year ON transactions(year_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_celebrations_member ON member_celebrations(member_id);
CREATE INDEX IF NOT EXISTS idx_celebrations_year ON member_celebrations(year_id);
CREATE INDEX IF NOT EXISTS idx_groups_competition ON competition_groups(competition_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member ON group_members(member_id);

-- Row Level Security (RLS) を有効化
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（全テーブルで読み取り・書き込みを許可）
-- 本番環境では適切な認証ベースのポリシーに変更してください

-- Years
CREATE POLICY IF NOT EXISTS "Enable all access for years" ON years FOR ALL USING (true);

-- Members
CREATE POLICY IF NOT EXISTS "Enable all access for members" ON members FOR ALL USING (true);

-- Fee Settings
CREATE POLICY IF NOT EXISTS "Enable all access for fee_settings" ON fee_settings FOR ALL USING (true);

-- Fee Payments
CREATE POLICY IF NOT EXISTS "Enable all access for fee_payments" ON fee_payments FOR ALL USING (true);

-- Competitions
CREATE POLICY IF NOT EXISTS "Enable all access for competitions" ON competitions FOR ALL USING (true);

-- Competition Attendances
CREATE POLICY IF NOT EXISTS "Enable all access for competition_attendances" ON competition_attendances FOR ALL USING (true);

-- Transactions
CREATE POLICY IF NOT EXISTS "Enable all access for transactions" ON transactions FOR ALL USING (true);

-- Member Celebrations
CREATE POLICY IF NOT EXISTS "Enable all access for member_celebrations" ON member_celebrations FOR ALL USING (true);

-- Competition Groups
CREATE POLICY IF NOT EXISTS "Enable all access for competition_groups" ON competition_groups FOR ALL USING (true);

-- Group Members
CREATE POLICY IF NOT EXISTS "Enable all access for group_members" ON group_members FOR ALL USING (true);