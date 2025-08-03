# ゴルフ会管理システム デプロイガイド

## 🚀 Vercelでのデプロイ（推奨）

### 1. GitHubへのアップロード

```bash
# Git初期化（まだの場合）
git init
git add .
git commit -m "Initial commit: Golf club management system"

# GitHubリポジトリを作成後
git remote add origin https://github.com/あなたのユーザー名/golf-app.git
git branch -M main
git push -u origin main
```

### 2. Vercelでのデプロイ

1. [Vercel](https://vercel.com/)にアクセス
2. GitHubアカウントでサインアップ/ログイン
3. 「New Project」をクリック
4. GitHubリポジトリを選択
5. プロジェクト名を入力
6. 「Deploy」をクリック

### 3. 環境変数の設定

Vercelプロジェクトの設定画面で以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL=https://vkunuejjuonhhdzklhpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabaseキー
```

### 4. 完了！

- 自動でビルド・デプロイが実行されます
- `https://your-app-name.vercel.app` でアクセス可能
- GitHubにプッシュするたびに自動デプロイ

## 🏠 従来のレンタルサーバー

### 静的サイト生成（制限あり）

```bash
# 静的サイトとして出力
npm run build
npm run export  # 設定が必要
```

**注意:** 動的機能（サーバーサイド処理）は利用できません

### Node.js対応サーバー

以下のサービスがNode.jsに対応：
- エックスサーバー（Node.js対応プラン）
- さくらのVPS
- ConoHa VPS
- AWS EC2

## 💾 データベース（Supabase）

現在使用中のSupabaseは継続利用可能：
- 無料プランで月間500MB、50,000行まで
- 必要に応じて有料プランにアップグレード
- データの移行は不要

## 🔧 カスタムドメイン設定

### Vercelでのカスタムドメイン
1. ドメインを購入（お名前.com、ムームードメインなど）
2. Vercelプロジェクト設定でドメインを追加
3. DNSレコードを設定
4. SSL証明書が自動で設定される

## 📱 運用上の注意点

### セキュリティ
- Supabaseの本番環境では適切なRLSポリシーを設定
- 管理者認証の実装を検討

### パフォーマンス
- 画像最適化の設定
- キャッシュ設定の調整

### バックアップ
- Supabaseの自動バックアップを有効化
- 定期的なデータエクスポート

## 💰 コスト概算

### 無料プラン
- **Vercel**: 個人利用無料
- **Supabase**: 500MB/月まで無料
- **合計**: 月額0円

### 有料プラン
- **Vercel Pro**: $20/月
- **Supabase Pro**: $25/月  
- **合計**: 月額$45（約6,500円）

## 🆘 トラブルシューティング

### ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 環境変数エラー
- Vercelの環境変数設定を確認
- `NEXT_PUBLIC_` プレフィックスを確認

### データベース接続エラー  
- Supabase URLとキーを確認
- ネットワーク設定を確認