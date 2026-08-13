# Sonata Desk 実体・機能検証

> 検証日: 2026-08-13  
> 対象: [`src/Home.tsx`](./src/Home.tsx)  
> 目的: 彩花の「ダッシュボード実装の実体確認」指示に対し、実装箇所、正本、表示、制約を追跡可能にする。

## 設計確認

Sonata DeskはGitHubを唯一の正本とする読み取り専用の表示・比較層です。ローカルDB、外部DB、外部SaaS、不要なAPI連携は使用していません。数値・状態・音源は`src/Home.tsx`の`referenceTracks`、`a1Gates`、`ledgerRows`、`patterns`で表示し、各領域から正本Markdownまたは音源へ直接リンクします。

| 必須機能 | 実装箇所 | GitHub正本 | 確認結果 |
|---|---|---|---|
| 001・002比較 | `referenceTracks`、`#references` | `reference_music/success_song_001.md`、`success_song_002.md`、`audio/README.md` | 正本001と暫定002を区別し、Length、Format、BPM、Bass Onset、Intro Bass、Drums RMSを比較表示する。 |
| A1進捗 | `a1Gates`、`#a1` | `experiments/A1_001-002-ground-truth-capture.md` | G01〜G09を「実測済み」「一部実測」「聴取待ち」に分け、002 Main無音を保留表示する。 |
| Pattern DB | `patterns`、`#patterns` | `suno_database/successful_patterns.md` | `confirmed`、`provisional`、無音Main回避を状態色つきで参照する。 |
| 検証台帳 | `ledgerRows`、`#ledger` | `experiments/A1_001-002-ground-truth-capture.md` | A1とB1の目的、単独変更変数、状態、次の承認条件を表示する。 |
| 参照音源 | `referenceTracks`、`#sources` | `reference_music/audio/README.md`、GitHub上のFLAC | 001正本FLACと002暫定4ステム合成FLACのブラウザ再生・GitHub直接リンクを表示する。 |

## 動作確認

| 確認項目 | 結果 | 根拠 |
|---|---|---|
| 型チェック | 通過 | `pnpm check` 相当のTypeScript検証を実施。 |
| 本番ビルド | 通過 | `pnpm build`（TypeScript検証 + Vite production build）を実施。 |
| デスクトップ表示 | 通過 | 左索引、中央の比較譜面、右の意思決定メモ、全5機能を表示。 |
| モバイル表示 | 通過 | 左索引を折りたたみ、比較カード・A1・証跡カードを縦方向に再配置。 |
| GitHub導線 | 通過 | 各主要領域に正本MarkdownまたはFLACへの外部リンクを配置。 |
| GitHub単独表示 | 通過 | `public/assets/`内のロゴ・画像を参照し、Manus固有の画像パスに依存しない。 |

## 001・002の確認結果

001は受領Mainを可逆圧縮した正本FLACであり、002は受領Mainが無音だったため、4ステムをゲイン正規化なしで合成した**暫定参照Main**です。両曲のBass Onsetは0.464秒、推定BPMは001が86.13、002が80.75、Intro 0〜2秒のBass低域比率は001が98.73%、002が84.21%です。002の正式Main、G02・G03・G07・G08の聴取記録は未解決であり、画面上でも保留として扱います。

## 未実装・制約

GitHub Markdownの実行時解析、Common Metrics Schemaの全項目、Fact/Hypothesisの専用台帳、A/B自動差分、AI Search、Prompt Design Supportは未実装です。これらはP0/P1で正本・分析基盤が確定した後に追加します。002の正式Mainが未登録のため、002のMain全体に関する音圧・構成・ノイズ・Loop判定はできません。

## 次の作業

002の正式Mainまたは暫定Main採用を承認し、G02・G03・G07・G08の聴取記録を正本へ追加します。その後、B1の0.3秒案と2.3秒案を比較するためのCommon Metrics SchemaとFact/Hypothesis台帳を実装します。
