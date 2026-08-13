# GitHub → Sonata Desk 自動反映

GitHubは唯一の正本です。Sonata Deskは正本Markdownを直接変更せず、GitHub Actionsが必要最小限の表示用JSONを生成し、ブラウザはそのJSONを読み込んで表示します。

```text
正本Markdown
  → GitHub Actions（正本データ同期）
  → src/generated/dashboard-data.json
  → Sonata Desk（読み取り専用表示）
```

## トリガー対象

以下の正本データに`main`ブランチへの更新があると、[`.github/workflows/sonata-desk-sync.yml`](../../.github/workflows/sonata-desk-sync.yml)が起動します。

| 正本 | 反映領域 |
|---|---|
| `reference_music/success_song_001.md`、`success_song_002.md` | 001・002比較、A1ゲート |
| `experiments/A1_001-002-ground-truth-capture.md` | A1進捗、検証台帳 |
| `suno_database/successful_patterns.md` | Pattern DB |
| `reference_music/audio/README.md` | 参照音源の由来・状態 |

## 生成物と失敗追跡

- `src/generated/dashboard-data.json`：画面表示用の派生データ。
- `src/generated/sync-status.json`：元ファイルのSHA-256、全体digest、生成状態。
- GitHub Actionsの実行ログとStep Summary：失敗した処理、入力コミット、同期digestをGitHub上で追跡する記録。

生成スクリプトはPython標準ライブラリだけを使い、外部DB、SaaS、API、AI処理は追加しません。元Markdownの内容が変わらない限り、派生JSONを再コミットしません。
