# Supabase セットアップガイド

このプロジェクトはSupabaseをバックエンドとして使用しています。以下の手順に従ってセットアップしてください。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウントを作成
2. 「New Project」をクリックして新しいプロジェクトを作成
3. プロジェクト名: `golf-club-management`（任意）
4. データベースパスワードを設定（強力なパスワードを推奨）
5. リージョンを選択（日本の場合は `ap-northeast-1` を推奨）

## 2. データベースの設定

1. Supabaseダッシュボードの左サイドバーから「SQL Editor」を選択
2. `supabase-setup.sql` の内容をコピー&ペースト
3. 「Run」ボタンをクリックしてSQLを実行
4. 全てのテーブルが正常に作成されたことを確認

## 3. 環境変数の設定

1. Supabaseダッシュボードの「Settings」→「API」に移動
2. 以下の情報を確認:
   - Project URL
   - anon public key
   - service_role key（サーバーサイド操作用）

3. プロジェクトルートの `.env.local` ファイルを編集:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. RLS（Row Level Security）ポリシーの設定

現在は開発用の全権限ポリシーが設定されています。本番環境では以下のようなより細かいポリシーを設定することを推奨します：

```sql
-- 例: 読み取り専用ポリシー
CREATE POLICY "Enable read access for all users" ON competitions FOR SELECT USING (true);

-- 例: 出欠テーブルは誰でも挿入・更新可能
CREATE POLICY "Enable insert for all users" ON competition_attendances FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON competition_attendances FOR UPDATE USING (true);
```

## 5. 作成されるテーブル

- `years` - 年度管理
- `members` - 会員情報
- `fee_settings` - 会費設定
- `fee_payments` - 会費支払い記録
- `competitions` - コンペ情報
- `competition_attendances` - コンペ出欠記録
- `transactions` - 入出金記録（将来実装）
- `member_celebrations` - お祝い記録（将来実装）

## 6. サンプルデータ

SQLスクリプトには以下のサンプルデータが含まれています：
- 2024年度・2023年度の年度データ
- 2024年度の会費設定（会員: 5000円、旧会員: 2000円など）

## 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして、アプリケーションが正常に動作することを確認してください。

## トラブルシューティング

### 接続エラーが発生する場合
1. `.env.local` のURLとキーが正しいか確認
2. Supabaseプロジェクトが正常に作成されているか確認
3. ネットワーク接続を確認

### テーブルが見つからないエラー
1. `supabase-setup.sql` が正常に実行されたか確認
2. Supabaseダッシュボードの「Table Editor」でテーブルが作成されているか確認

### RLSエラー
1. ポリシーが正しく設定されているか確認
2. 開発時は一時的にRLSを無効にすることも可能（非推奨）

## セキュリティ考慮事項

- **本番環境**: より厳密なRLSポリシーを設定
- **認証**: 管理機能には認証を追加することを推奨
- **キー管理**: service_role_keyは厳重に管理