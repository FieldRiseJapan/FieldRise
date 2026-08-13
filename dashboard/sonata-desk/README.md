# Sonata Desk

Sonata Deskは、FieldRise Music AIの001・002再現研究における**表示・比較・参照層**です。GitHubを唯一の正本とし、このアプリはデータベースや外部APIを持ちません。

## 実装本体

| 項目 | パス | 役割 |
|---|---|---|
| 画面本体 | [`src/Home.tsx`](./src/Home.tsx) | 001・002比較、A1進捗、Pattern DB、検証台帳、参照音源を描画します。 |
| 起動処理 | [`src/main.tsx`](./src/main.tsx) | Reactのエントリーポイントです。 |
| 表示規則 | [`src/index.css`](./src/index.css) | Sonata Deskの紙面、譜面ルーラー、状態色を定義します。 |
| 画面資産 | [`public/assets/`](./public/assets/) | FieldRiseのロゴと研究デスク画像。GitHub上のアプリ単体で表示できるよう同梱します。 |
| 検証資料 | [`VERIFICATION.md`](./VERIFICATION.md) | 彩花の実体確認指示に対する検証結果です。 |

## 正本の扱い

画面中の数値と状態は、以下のGitHub正本から読み取れる形で表示します。画面が独自の値を保存・更新することはありません。

- [`music_ai/reference_music/`](../../music_ai/reference_music/)
- [`music_ai/experiments/A1_001-002-ground-truth-capture.md`](../../music_ai/experiments/A1_001-002-ground-truth-capture.md)
- [`music_ai/suno_database/successful_patterns.md`](../../music_ai/suno_database/successful_patterns.md)
- [`music_ai/reference_music/audio/README.md`](../../music_ai/reference_music/audio/README.md)

## ローカル起動

```bash
pnpm install
pnpm dev
```

本体データの変更時は、正本ファイルを先に更新し、続けて`src/Home.tsx`の表示値と参照リンクを更新します。外部DB、SaaS、生成APIは追加しません。
