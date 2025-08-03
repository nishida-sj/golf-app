# FTP経由デプロイガイド

## ⚠️ 重要な制限事項

### 動作しない機能
- サーバーサイドレンダリング
- API Routes
- 動的インポート
- 一部のNext.js固有機能

### 動作する機能
- 静的ページ表示
- クライアントサイドルーティング  
- Supabaseとの通信（クライアントサイド）
- フォーム送信

## 🔧 FTPデプロイ手順

### 1. 設定ファイルの変更

**next.config.js を作成済み**（静的サイト生成用）

### 2. ビルドコマンド

```bash
# 静的サイトとしてビルド
npm run build

# outフォルダが生成される
```

### 3. FTPアップロード

生成された `out` フォルダの中身をすべてFTPでアップロード：

```
out/
├── index.html
├── years.html  
├── members.html
├── competitions.html
├── _next/
│   ├── static/
│   └── ...
└── ...
```

### 4. サーバー設定

**.htaccess ファイルが必要（Apache）:**

```apache
# .htaccess
RewriteEngine On

# SPAルーティング対応
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# MIME type設定
AddType application/javascript .js
AddType text/css .css

# キャッシュ設定
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>
```

## 🚨 発生する問題と対処法

### 問題1: 動的ルーティングエラー
**対処:** 全てのページを静的生成する必要があります

### 問題2: APIルートが動作しない  
**対処:** すべてSupabaseクライアントサイドで処理

### 問題3: 画像最適化エラー
**対処:** `next.config.js` で `images.unoptimized: true`

### 問題4: ルーティングが404
**対処:** `.htaccess` でSPAルーティング設定

## 📁 必要なファイル構成

```
public_html/          # FTPルートディレクトリ
├── .htaccess        # ルーティング設定
├── index.html       # メインページ
├── years.html       # 年度管理ページ
├── members.html     # 会員管理ページ
├── competitions.html # コンペ管理ページ
├── finances.html    # 入出金管理ページ
├── celebrations.html # お祝い管理ページ
└── _next/           # Next.jsアセット
    ├── static/
    └── ...
```

## 🎯 推奨される代替案

### Node.js対応レンタルサーバー
- **エックスサーバー**（Node.js対応プラン）
- **さくらのレンタルサーバー**（スタンダード以上）
- **ロリポップ**（ハイスピードプラン）

### クラウドホスティング
- **Vercel**（無料・推奨）
- **Netlify**（無料）
- **Firebase Hosting**（無料）

## 💡 現実的な解決策

### オプション1: 静的サイト生成で妥協
- 基本機能は動作
- 一部制限あり
- FTP可能

### オプション2: サーバー変更
- 全機能が動作
- Node.js対応サーバーに変更
- 月額+500円程度

### オプション3: ハイブリッド構成
- フロントエンド: FTPサーバー（静的）
- バックエンド: Vercel/Netlify（API）
- 複雑な設定が必要

## 🚀 簡単テスト手順

```bash
# 1. 設定変更
# next.config.js を確認

# 2. ビルド実行
npm run build

# 3. outフォルダを確認
ls out/

# 4. ローカルテスト
npx serve out

# 5. FTPアップロード
# outフォルダの中身をすべてアップロード
```