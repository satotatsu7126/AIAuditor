# AI Auditor

AI成果物監査プラットフォーム - 生成AIの成果物（コード、翻訳、論文）に対し、人間の専門家が監査・修正・保証を行うマッチングプラットフォーム

## 技術スタック

- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (Auth, Postgres)
- **Payment**: Stripe (Auth & Capture方式)
- **Infrastructure**: Vercel

## 機能

### 認証
- Google Loginによるソーシャル認証
- 3つのロール: Client, Reviewer, Admin

### 依頼作成
3つのカテゴリに対応した動的フォーム:
- **Type A: IT/コード** - 利用フェーズ、優先度、技術レベル
- **Type B: ビジネス翻訳** - 関係性、目的、懸念点
- **Type C: 学術/ファクトチェック** - 媒体、重点、方針

### 決済
- Stripe仮払い方式 (Auth & Capture)
- 納品完了時に決済確定
- 手数料率は管理画面から設定可能

### ダッシュボード
- **Client**: 依頼一覧、ステータス確認、納品物閲覧
- **Reviewer**: 対応可能案件、担当中案件、納品フォーム
- **Admin**: 専門家申請の承認/却下、手数料率設定

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、以下の値を設定:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/schema.sql`の内容をSQL Editorで実行
3. Authentication > ProvidersでGoogleを有効化

### 4. Stripeの設定

1. [Stripe Dashboard](https://dashboard.stripe.com)でアカウントを作成
2. APIキーを取得して環境変数に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

## 画面構成

- `/` - ランディングページ（3つのカテゴリ選択）
- `/login` - ログイン画面
- `/request` - 依頼作成フォーム
- `/request/payment` - 決済画面
- `/dashboard` - クライアントダッシュボード
- `/dashboard/requests/[id]` - 依頼詳細
- `/reviewer` - 専門家ダッシュボード
- `/reviewer/work/[id]` - 監査作業画面
- `/apply-reviewer` - 専門家申請
- `/admin` - 管理画面

## デプロイ

Vercelにデプロイ:

```bash
vercel
```

環境変数はVercelのダッシュボードで設定してください。

## ライセンス

MIT
