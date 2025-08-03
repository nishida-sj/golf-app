-- コンペ組み合わせ機能用テーブル作成SQL
-- Supabase DashboardのSQL Editorで実行してください

-- コンペ組テーブル
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

-- 組メンバーテーブル
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
CREATE INDEX IF NOT EXISTS idx_groups_competition ON competition_groups(competition_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member ON group_members(member_id);

-- RLS設定
ALTER TABLE competition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Enable all access for competition_groups" ON competition_groups;
DROP POLICY IF EXISTS "Enable all access for group_members" ON group_members;

-- RLSポリシー作成
CREATE POLICY "Enable all access for competition_groups" ON competition_groups FOR ALL USING (true);
CREATE POLICY "Enable all access for group_members" ON group_members FOR ALL USING (true);