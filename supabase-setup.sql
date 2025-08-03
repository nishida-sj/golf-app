-- ゴルフ会管理システム用 Supabase テーブル作成スクリプト
-- このスクリプトをSupabase SQL Editorで実行してください

-- 1. 年度テーブル (years)
CREATE TABLE IF NOT EXISTS years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(20) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 会員テーブル (members)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('会員', '旧会員', '配偶者', 'ゲスト')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 会費設定テーブル (fee_settings)
CREATE TABLE IF NOT EXISTS fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year_id, member_type)
);

-- 4. 会費支払いテーブル (fee_payments)
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year_id, member_id)
);

-- 5. コンペテーブル (competitions)
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  golf_course VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  title VARCHAR(200) NOT NULL,
  rules TEXT NOT NULL,
  fee INTEGER NOT NULL,
  custom_field_1 VARCHAR(100),
  custom_field_2 VARCHAR(100),
  custom_field_3 VARCHAR(100),
  has_celebration BOOLEAN DEFAULT false,
  celebration_venue VARCHAR(100),
  celebration_start_time TIMESTAMP,
  celebration_fee INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. コンペ出欠テーブル (competition_attendances)
CREATE TABLE IF NOT EXISTS competition_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  golf_attendance VARCHAR(1) CHECK (golf_attendance IN ('〇', '×', '△')),
  golf_comment TEXT,
  celebration_attendance VARCHAR(1) CHECK (celebration_attendance IN ('〇', '×', '△')),
  celebration_comment TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, member_id)
);

-- 7. 入出金テーブル (transactions) - 将来の機能用
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  is_reimbursement BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. お祝い記録テーブル (celebrations) - 将来の機能用
CREATE TABLE IF NOT EXISTS member_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  age INTEGER NOT NULL CHECK (age IN (60, 70, 77, 80)),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, age)
);

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_years_active ON years(is_active);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_fee_settings_year ON fee_settings(year_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_year ON fee_payments(year_id);
CREATE INDEX IF NOT EXISTS idx_competitions_year ON competitions(year_id);
CREATE INDEX IF NOT EXISTS idx_competitions_start_time ON competitions(start_time);
CREATE INDEX IF NOT EXISTS idx_attendances_competition ON competition_attendances(competition_id);

-- サンプルデータを挿入（オプション）
-- 年度データ
INSERT INTO years (name, start_date, end_date, is_active) VALUES
('2024年度', '2024-07-01', '2025-06-30', true),
('2023年度', '2023-07-01', '2024-06-30', false)
ON CONFLICT (name) DO NOTHING;

-- 会費設定のサンプル（2024年度用）
INSERT INTO fee_settings (year_id, member_type, amount)
SELECT y.id, member_type, amount FROM years y, (VALUES
  ('会員', 5000),
  ('旧会員', 2000),
  ('配偶者', 2000),
  ('ゲスト', 3000)
) AS settings(member_type, amount)
WHERE y.name = '2024年度'
ON CONFLICT (year_id, member_type) DO NOTHING;

-- Row Level Security (RLS) を有効化（セキュリティ強化）
-- 注意: 本番環境では適切なRLSポリシーを設定してください
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_celebrations ENABLE ROW LEVEL SECURITY;

-- 開発用の全権限ポリシー（本番環境では修正が必要）
CREATE POLICY "Enable all operations for authenticated users" ON years FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON members FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON fee_settings FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON fee_payments FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON competitions FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON competition_attendances FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON member_celebrations FOR ALL USING (true);