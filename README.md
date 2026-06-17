# grass to art

GitHub の1年間のコントリビューション（草）を、部屋に飾れる1枚のアートポスターに変換し、
印刷用の高解像度 **SVG / PDF** で書き出す Web サービス。

- **Next.js (App Router) + TypeScript**
- **Supabase Auth (GitHub)** — 認証 & 草データのスナップショット保存
- 日時はすべて **日本標準時 (JST)** 基準
- 4スタイル: 抽象幾何 / 都市・地形 / 有機・植物 / 粒子・星空

---

## すぐ試す（認証なしのデモ）

```bash
npm run dev
# http://localhost:3000 → 「ログインせずデモを見る」
# または直接 http://localhost:3000/editor?demo=1
```

デモはモックの草データでエディタ・プレビュー・SVG/PDF 書き出しまで一通り動きます。

---

## 本番セットアップ

### 1. Supabase プロジェクト
1. プロジェクトを作成。
2. SQL エディタで [`supabase/schema.sql`](supabase/schema.sql) を実行（テーブル + RLS）。

### 2. GitHub OAuth App
1. GitHub > Settings > Developer settings > **OAuth Apps** で作成。
2. **Authorization callback URL** に Supabase のコールバックを設定:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. `client_id` / `client_secret` を Supabase の **Authentication > Providers > GitHub** に登録。
   - 必要スコープ: `read:user`（public のみ）。private も含めるなら `repo`。

### 3. 環境変数
```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定
```

### 4. 起動
```bash
npm run dev
```

---

## 設計上のポイント（仕様レビュー反映）

- **`provider_token` はサーバー側でのみ扱う。** OAuth コード交換を
  [`app/auth/callback/route.ts`](app/auth/callback/route.ts) で行い、その場で
  GitHub をフェッチ → スナップショットを保存。GitHub トークンはブラウザに渡らない。
- **草データを永続化。** `provider_token` はログイン直後しか取れず再取得不可なので、
  正規化したデータを `contribution_snapshots` に保存。リロードしても再描画できる。
- **`viewer` + `contributionLevel`** を使用（login 不要・GitHub と同じ5段階の濃淡）。
- **JST**: 取得窓は `+09:00`、表示は `Intl.DateTimeFormat(timeZone: 'Asia/Tokyo')`。
  ※ `+09:00` は窓の端を動かすだけで日毎のバケットは GitHub 依存（ポスター用途では十分）。
- **乱数はシード固定**（`PosterConfig.seed`）。同じデータでも seed で別の絵、かつ保存物は再現可能。
- **出力**: `viewBox` は 1 unit = 1mm。PDF は `svg2pdf.js` + `jsPDF`、テキストは
  **アウトライン化**して日本語の tofu を回避（フォント配置は
  [`public/fonts/README.md`](public/fonts/README.md)）。星空の発光はフィルタを使わず
  半透明円で表現し、PDF でも崩れないようにしている。

---

## ディレクトリ

```
app/
  page.tsx                  トップ（ログイン / デモ）
  auth/callback/route.ts    OAuth コード交換 + 草フェッチ + 保存（サーバー）
  editor/                   エディタ（server page + client UI）
  api/contributions/route.ts 公開データモード（任意・PAT 使用）
components/poster/          ポスター SVG とスタイル4種
components/editor/          編集 UI
lib/github/                 GraphQL フェッチ & 型
lib/poster/                 config・パレット・幾何・seed RNG
lib/export/                 SVG 直書き出し / PDF 変換 / テキストのアウトライン
lib/jst.ts                  JST 変換ユーティリティ
supabase/schema.sql         テーブル + RLS
```

---

## 未実装 / 今後（仕様 §10）

- 保存ポスター一覧のマイページ UI（テーブル/関数 [`lib/db/posters.ts`](lib/db/posters.ts) は準備済み）
- 方針B（コミット単位の厳密 JST 日割り。※commit 以外のコントリビューションも数える点に注意）
- 任意年のフル切り替え（現状は現在年を取得。別年は再認証フローで取得）
