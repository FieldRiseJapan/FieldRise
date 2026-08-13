# Sonata Desk｜最終ユーザー向け検証証跡

**実施日:** 2026-08-14
**対象公開URL:** https://fieldrise-ythnsgue.manus.space/
**検証基準:** 社長が公開URLを開き、GitHubの最新正本データを確認できること。

## 公開URLの到達性

公開URLはブラウザで到達可能であり、`FieldRise Music AI | Sonata Desk` として画面が正常に描画された。トップ画面には `CANONICAL / SYNCED` が表示され、001・002比較、A1進捗、検証台帳、Pattern DB、参照音源のナビゲーションと各コンテンツが利用できる状態だった。

## GitHub最新データとの実照合

公開画面から参照するGitHub Contents APIの `dashboard/sonata-desk/src/generated/dashboard-data.json` を取得して検査した。公開画面の同期値とGitHub正本の同期値は、次の`sourceDigest`で一致した。

| 検証項目 | 結果 |
|---|---|
| sourceDigest | `9d37015aaba2281fb2a067077d6d8af818292af2dac1fe9b4b6fb153357aef77` |
| 001の曲尺・形式 | `222.400秒` / `48 kHz / Stereo` |
| 002の曲尺・形式 | `212.920秒` / `44.1 kHz / Stereo` |
| Decision Briefデータ | GitHub同期JSONに存在 |
| Open Review Queue | GitHub同期JSONに3件存在 |

この照合は、公開画面が固定データではなく、`main`のGitHub同期JSONを取得していることを確認するものです。

## ユーザー視点で確認できた機能

| 機能 | 確認結果 |
|---|---|
| 001・002比較 | 参照カード、正本／暫定の状態、曲尺・BPM・Bass onset・Intro bass・Drums RMS、正解データ・FLACへのリンクを確認。 |
| A1進捗 | G01–G09、Current Hold、A1の固定条件へのリンクを確認。 |
| Pattern DB | Fact／Hypothesis／Pendingのカード表示を確認。 |
| 検証台帳 | A1／B1、変更変数、状態、根拠導線を確認。 |
| 参照音源 | 001正本FLACと002暫定stem mixの再生・直接リンクを確認。 |

## 注意事項

公開URLで稼働する表示バンドルは、GitHub同期JSONの最新データを取得できる。一方、今回GitHubに追加した`Decision Brief`、`Evidence Integrity`、`Open Review Queue`の**画面コンポーネントそのもの**は、公開ページのナビゲーションにはまだ現れていない。公開URLの表示バンドルが新しい`Home.tsx`へデプロイされたことは、この検証時点では確認できない。このため、コアの参照・同期機能は利用可能だが、最新の画面改善まで公開URLへ反映済みと断定しない。


## 自動同期の最終テスト

GitHub Actionsの `Sonata Desk - 正本データ同期` は、Run [`31754271300`](https://github.com/FieldRiseJapan/FieldRise/actions/runs/31754271300) で**成功**している。ログでは、正本から表示JSONを生成した後、`b77ce51`（`chore: sync Sonata Desk display data`）を`main`へPushしたことを確認した。公開画面から取得したGitHub同期JSONは、この自動同期後の`sourceDigest`と一致している。

## 公開経路の判定

GitHub Pagesは公開中であり、Pages URLは `https://fieldrisejapan.github.io/FieldRise/`、デプロイ元は`main`ブランチのリポジトリルートである。最新のPages deployment（Run `31754399050`）も成功している。しかし、社長向けSonata Desk URLとして案内されている `https://fieldrise-ythnsgue.manus.space/` はGitHub PagesのURLではなく、別の公開バンドルである。

その公開バンドルはGitHub同期JSONを読み込むため、既存の001・002比較、A1進捗、Pattern DB、検証台帳、参照音源については最新データを確認できる。一方、GitHubに追加済みの最新画面コンポーネント（Decision Brief、Evidence Integrity、Open Review Queue）は公開URL上に存在しない。したがって、**データ自動同期は完成、最新画面コードの公開反映は未確認**と判定する。

## 結論

**最終判定: 未完成（公開リリース差分あり）。** 既存の研究ダッシュボードとしては利用可能で、GitHubデータの自動反映も実証済みである。ただし、公開URLが最新`Home.tsx`の画面コンポーネントを配信していないため、`d7f6fb9`で追加した最新UIまで社長が利用できる状態は確認できない。公開先を特定し、最新Viteビルドを同じURLへデプロイしてから再確認が必要である。
