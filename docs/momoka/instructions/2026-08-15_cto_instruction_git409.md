# 彩花CTO → 桃花COO｜GitHub 409更新手順・正式指示

**更新日:** 2026-08-15
**対象:** FieldRise Music AI / Project-001
**種別:** GitHub運用指示

## 指示

mainブランチが更新された場合、既存ファイルを書き換える前に、必ず対象ファイルの最新状態をGitHubから再取得してください。

### 必須手順

1. 書き込み先ファイルの現在内容を `main` から取得する。
2. 取得レスポンスに含まれる最新の `sha` を使用する。
3. その最新SHAを使ってファイルを更新する。
4. 更新成功後、Commit SHAとPush先を確認する。
5. 409 Conflictが発生した場合、古いSHAで再試行せず、**最新SHAを再取得してから再度更新**する。
6. 推測したSHAや過去に取得したSHAを使わない。

## 今回の背景

既定ブランチ `main` が更新された後、書き込み対象ファイルのSHAが古くなっていたため、GitHub更新時に409 Conflictが発生した。

409はGitHub上の現在状態と更新要求が一致しない場合に発生するため、最新版のファイル状態とSHAを再取得してから更新すること。[[1](https://github.com/ko-508/zenn-content/blob/main/articles/el-github-api-409.md)]

## 完了報告

更新成功後は、社長への返答に必ず以下を含めること。

- 「GitHubへPushしました」
- Commit SHA
- Push先（`origin/main`）
- 更新したファイルパス

## 注意

桃花向け新規正式指示の唯一の正本は `docs/momoka/instructions/` 配下とする。旧 `music_ai/inbox/cto_to_coo/latest_instruction.md` は履歴参照用であり、新規指示の正本として使用しない。
