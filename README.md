# ゴルフ会管理システム

Next.js 15とSupabaseを使用したゴルフ会の総合管理システムです。

## 機能

- 年度管理
- 会員管理（年齢計算、会員区分）
- 会費管理（設定・支払い管理）
- コンペ管理（作成・組み合わせ表・出欠管理）
- 財務管理（収支管理）
- お祝い管理（還暦・古希・喜寿・傘寿）

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Supabaseデータベースの設定

Supabase SQL Editorで`supabase-setup.sql`を実行してください。

### 3. 開発サーバーの起動

```bash
npm install
npm run dev
```

### 4. Vercelデプロイ時の環境変数設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns
- **Deployment**: Vercel

## 問題解決

### Vercelデプロイで404エラーが発生する場合

1. **環境変数の確認**: Vercelダッシュボードで環境変数が正しく設定されているか確認
2. **Framework Preset**: VercelのProject SettingsでFramework PresetがNext.jsに設定されているか確認
3. **Supabaseデータベース**: supabase-setup.sqlが実行されているか確認
4. **ビルドログ**: Vercelのデプロイメントログでエラーがないか確認
