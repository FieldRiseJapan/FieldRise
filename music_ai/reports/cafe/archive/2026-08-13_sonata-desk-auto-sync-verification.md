# Sonata Desk｜GitHub自動反映 実証報告

**実施日:** 2026-08-13  
**報告者:** 桃花（COO）  
**対象指示:** `cto/outbox/2026-08-13_github-dashboard-auto-sync.md`  
**判定:** **完了（実際の正本変更・Action起動・表示用データ更新・失敗追跡を確認済み）**

## 実装構成

GitHubを唯一の正本とし、正本Markdownを変更しない派生JSONだけを自動生成する。Sonata Deskは公開時にGitHub Contents APIから`main`の`dashboard-data.json`を取得するため、GitHub Raw CDNの遅延に左右されず、GitHubの表示用データ更新後にページを再読込すれば新しい正本状態を表示する。

```text
正本Markdownの更新
  → GitHub Actions（Sonata Desk - 正本データ同期）
  → display JSON / sync status の更新コミット
  → 公開Sonata DeskがGitHub Contents APIから最新JSONを再取得して表示
```

| 項目 | 実装先 | 役割 |
|---|---|---|
| 表示データ生成 | [`dashboard/sonata-desk/scripts/generate_dashboard_data.py`](../../../../dashboard/sonata-desk/scripts/generate_dashboard_data.py) | 5つの正本Markdownを決定的に解析し、表示専用JSONを生成する。 |
| 自動起動 | [`.github/workflows/sonata-desk-sync.yml`](../../../../.github/workflows/sonata-desk-sync.yml) | 正本更新を検知し、JSON検証・コミット・GitHubログ記録を行う。 |
| 表示データ | [`dashboard-data.json`](../../../../dashboard/sonata-desk/src/generated/dashboard-data.json) | 001・002比較、A1、台帳、Pattern DB、音源カードの派生表示データ。 |
| 同期状態 | [`sync-status.json`](../../../../dashboard/sonata-desk/src/generated/sync-status.json) | 入力ファイルSHA-256、全体digest、生成状態を保持する。 |
| 画面接続 | [`dashboard/sonata-desk/src/Home.tsx`](../../../../dashboard/sonata-desk/src/Home.tsx) | 同期JSONを優先表示し、取得失敗時だけ既存の読取専用フォールバックを使う。 |

## トリガー対象と反映領域

| 正本データ | 自動反映する領域 |
|---|---|
| `reference_music/success_song_001.md`、`success_song_002.md` | 001・002比較、A1ゲート |
| `experiments/A1_001-002-ground-truth-capture.md` | A1進捗、検証台帳 |
| `suno_database/successful_patterns.md` | Pattern DB |
| `reference_music/audio/README.md` | 参照音源の由来・状態 |

外部DB、SaaS、不要なAPI、AI処理、手動の画面二重入力は使用しない。正本データが変わらない場合、Actionは派生JSONを再コミットしない。

## 実際の自動反映テスト

| 手順 | 実行内容 | 結果 | 証拠 |
|---|---|---|---|
| 1 | `success_song_001.md`の分析状態へ試験文言を1件追加 | 正本変更コミット`a802fb7`をpush | [正本変更](https://github.com/FieldRiseJapan/FieldRise/commit/a802fb7) |
| 2 | Pushトリガーで同期Actionが起動 | 12秒で成功 | [Run 31706090531](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31706090531) |
| 3 | Actionが派生JSONを更新・コミット | `e44aeda`が生成された | [生成コミット](https://github.com/FieldRiseJapan/FieldRise/commit/e44aeda) |
| 4 | 生成JSONに試験文言が反映されたことを確認 | `summary`で一致 | [表示データ](../../../../dashboard/sonata-desk/src/generated/dashboard-data.json) |
| 5 | 正本を元の分析状態へ復元 | `01f8187`をpush | [復元コミット](https://github.com/FieldRiseJapan/FieldRise/commit/01f8187) |
| 6 | 復元PushでActionが再度成功しJSONを更新 | 試験文言が最終JSONから消えた | [生成コミット](https://github.com/FieldRiseJapan/FieldRise/commit/c37d0cf) |

公開中Sonata Deskでは、ヘッダーの`CANONICAL / SYNCED`とヒーローの`SYNC <digest>`で、同期JSONの読込状態と入力正本digestを確認できる。

## 失敗追跡テスト

`workflow_dispatch`の`simulate_failure=true`で、正本・生成物を変更せずにActionの失敗経路を実行した。Runは`失敗追跡テスト`ステップで意図的に`exit 1`となり、GitHub Actions画面にステップ名、標準出力、終了コードが記録された。

| 項目 | 結果 |
|---|---|
| 実行 | [Run 31706207859](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31706207859) |
| 最終状態 | failure（意図どおり） |
| 追跡情報 | `失敗追跡テスト`、`意図的な失敗テスト`、`Process completed with exit code 1` |
| 正本・生成物 | 変更なし |

通常の生成失敗も同じGitHub Actions Runでステップ単位に追跡できる。`sync-status.json`には成功時の入力ファイルSHA-256と`sourceDigest`が残るため、どの正本状態から表示データが生成されたかを確認できる。

## 制約と次の改善

002の正式Main、G02・G03・G07・G08の聴取記録、Common Metrics全項目、Fact/Hypothesis専用台帳、A/B自動差分、AI Search、Prompt Design Supportは未実装である。これは同期機構の完了を妨げないが、各正本ファイルが追加・更新されたときに同じ決定的な生成対象へ拡張する。
