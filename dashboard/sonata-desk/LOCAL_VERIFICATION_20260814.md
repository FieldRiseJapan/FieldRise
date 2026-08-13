# Sonata Desk｜ローカル起動確認 2026-08-14

## 実施内容

ローカルViteサーバー（`http://localhost:5173/`）でSonata Deskを起動し、ブラウザから初期表示、判断要約、エビデンス信頼性、確認待ち一覧、ナビゲーションを確認した。

| 確認項目 | 結果 | 記録 |
|---|---|---|
| 開発サーバー起動 | 通過 | Viteが`http://localhost:5173/`で起動。 |
| 初期同期状態 | 通過 | `CANONICAL / SYNCED`を表示。 |
| 判断要約 | 通過 | B1の比較変数、002の前提条件、完全分析へのリンクを表示。 |
| Evidence Integrity | 通過 | 001を`VERIFIED / CANONICAL`、002を`PROVISIONAL / STEM MIX`として表示。 |
| Open Review Queue | 通過 | 002正式Main、テンポ確定、Loop／聴取レビューの3項目を表示。 |
| ページ内ナビゲーション | 通過 | 「判断要約」を含む7項目を表示。 |

## 修正した不具合

起動確認の初回画面で曲尺とフォーマットが`未観測`と表示された。原因は、正本Markdownの`**元Main**:`／`**提供Main**:`という太字表記をデータ生成の正規表現が解釈していなかったことである。`generate_dashboard_data.py`を修正し、再生成JSONで001が`222.400秒 / 48 kHz / Stereo`、002が`212.920秒 / 44.1 kHz / Stereo`となることを確認した。

## 同期に関する注意

ローカル起動時の画面は、GitHub Contents APIから現行`main`の表示JSONを取得する。Push前のGitHub上には更新前JSONが残るため、ブラウザ表示では旧JSON由来の曲尺・フォーマットが一時的に残る。この作業ツリーの生成JSONは修正済みであり、`main`へのPush後にGitHub上の最新JSONが取得されれば解消する。

## 実行コマンド

```bash
python3 dashboard/sonata-desk/scripts/generate_dashboard_data.py
pnpm run build
pnpm dev
```
