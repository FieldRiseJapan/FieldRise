# Sonata Desk｜GitHub自動同期 最終実証

**実施日:** 2026-08-13  
**報告者:** 桃花（COO）  
**対象指示:** [`cto/outbox/2026-08-13_dashboard-auto-sync-final-proof.md`](../../../../cto/outbox/2026-08-13_dashboard-auto-sync-final-proof.md)
**最終判定:** **完成**

## 結論

GitHub正本の変更から、GitHub Actionsの自動起動、表示用JSONの自動更新、Sonata Deskの表示同期、正本との一致確認、試験変更の復元、失敗原因の追跡までを、実際のGitHubコミットとAction Runで確認した。表示画面の手動編集は行っていない。

## 実装構成

| 要求 | 実装・証跡 |
|---|---|
| Workflow | [`.github/workflows/sonata-desk-sync.yml`](../../../../.github/workflows/sonata-desk-sync.yml) |
| トリガー条件 | `main`へのpushのうち、001・002正本、A1、Pattern DB、参照音源台帳、生成スクリプト、Workflowの変更。手動確認は`workflow_dispatch`。 |
| 同期処理 | [`dashboard/sonata-desk/scripts/generate_dashboard_data.py`](../../../../dashboard/sonata-desk/scripts/generate_dashboard_data.py) |
| 生成場所 | [`dashboard/sonata-desk/src/generated/dashboard-data.json`](../../../../dashboard/sonata-desk/src/generated/dashboard-data.json)、[`sync-status.json`](../../../../dashboard/sonata-desk/src/generated/sync-status.json) |
| Sonata Desk反映方法 | [`dashboard/sonata-desk/src/Home.tsx`](../../../../dashboard/sonata-desk/src/Home.tsx) がGitHub Contents APIから`main`の最新生成JSONを読み込む。GitHub Raw CDNの遅延を避けるため、GitHub内の公開Contents APIを鮮度確認の目的で用いる。 |
| 対象領域 | 001・002比較、A1進捗、Pattern DB、検証台帳、参照音源。参照音源は001・002カードに統合される。 |

外部DB、SaaS、不要なAPI、AI処理、正本への自動書戻し、画面への手動二重入力はない。

## 最終実証の時系列

| 段階 | 実行 | 結果・証拠 |
|---|---|---|
| 1 | 001正本の分析状態に試験マーカーを一件追加 | [`43dead9`](https://github.com/FieldRiseJapan/FieldRise/commit/43dead9)を`main`へpush。 |
| 2 | Pushで同期Actionを自動起動 | [Run 31708158821](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31708158821)が成功。 |
| 3 | 表示データを自動生成・コミット | [`e844ccd`](https://github.com/FieldRiseJapan/FieldRise/commit/e844ccd)が`dashboard-data.json`と`sync-status.json`を更新。 |
| 4 | 正本との一致・UI反映を確認 | `dashboard-data.json`の001要約に試験マーカーを確認。公開Sonata Deskは`CANONICAL / SYNCED`と同期digest `ed8f375099…`を表示。 |
| 5 | 正本を試験前へ復元 | [`115c485`](https://github.com/FieldRiseJapan/FieldRise/commit/115c485)をpush。 |
| 6 | 復元変更も自動同期 | [Run 31708297022](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31708297022)が成功し、[`3a5db46`](https://github.com/FieldRiseJapan/FieldRise/commit/3a5db46)で試験マーカーを生成JSONから自動削除。 |
| 7 | 最終表示状態を確認 | 公開Sonata Deskは`CANONICAL / SYNCED`、最終`sourceDigest` `046dd75259…`を表示。`sync-status.json`の`status`は`ok`。 |

このため、**GitHub変更 → Action起動 → Sonata Desk自動反映 → 正本との一致確認 → 復元**の一連の条件を満たす。

## 失敗追跡

手動実行専用の`simulate_failure=true`で、正本と生成物を変更せずに失敗経路を実行した。[Run 31706207859](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31706207859)は`失敗追跡テスト`ステップ、標準出力、`Process completed with exit code 1`をGitHub上に記録した。通常のパース・JSON検証・コミット失敗も同じRunのステップログで追跡できる。

| 確認項目 | 結果 |
|---|---|
| 失敗ステップ名 | `失敗追跡テスト` |
| 原因の可視化 | GitHub Actions RunのStep、標準出力、終了コードで確認可能。 |
| 正本・生成物への影響 | なし。 |
| 同期状態の由来 | `sync-status.json`に入力ファイルSHA-256と全体`sourceDigest`を記録。 |

## 既知の制約

002の正式Main、G02・G03・G07・G08の聴取記録、Common Metrics全項目、Fact/Hypothesis専用台帳、A/B自動差分、AI Search、Prompt Design Supportは未実装である。これらは同期基盤の不備ではなく、追加正本の設計・対象パーサー拡張として段階的に扱う。
