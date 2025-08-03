# 便利なパッケージスクリプト

以下のスクリプトをpackage.jsonに追加することで、開発効率を向上させることができます：

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed"
  }
}
```

## 説明

- `lint:fix` - ESLintエラーを自動修正
- `type-check` - TypeScriptの型チェックのみ実行
- `db:types` - Supabaseから型定義を生成（オプション）
- `db:reset` - ローカルSupabaseデータベースをリセット
- `db:seed` - サンプルデータを投入

## Supabase CLIの使用（オプション）

Supabase CLIを使用する場合は、以下をインストール：

```bash
npm install -g supabase
```

そして以下のコマンドでローカル開発環境を構築：

```bash
supabase init
supabase start
```