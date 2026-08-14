# 彩花CTO向け最終報告｜Task Data Backup 保全完了

**報告日:** 2026-08-14（GMT+9）
**報告者:** 桃花（COO）
**対象:** Type Cのデータ削除に備えたFieldRise／Sonata DeskのTask Data Backup
**最終判定:** **PCローカル保存まで完了**

## 結論

Type C対象アカウントについて、Task Data Backupを最新の状態で再作成し、PCのManus Downloaderを介してローカル端末へ保存した。今回のバックアップは、002正式Mainの登録、分析資産、Sonata DeskのGitHub正本、既存WebDevプロジェクトの記録を含む、現時点の復元基準である。ユーザーからPC保存完了の確認を受領した。

| 項目 | 記録 |
|---|---|
| Task Data Backupファイル | `tasks-data-ppp-ppp-08-14_08-48-58.manustask` |
| 生成時刻 | 2026-08-14 16:48（GMT+9） |
| 生成サイズ | 4.16 GB |
| 保存先 | ユーザーPCのローカル端末（Manus Downloader） |
| アカウント情報バックアップ | 既存の`account-data-ppp-ppp-08-11_14-55-27.manusaccount`が完了済み |
| 保存確認 | ユーザーがPC保存完了を通知 |

## 保全対象と位置付け

Task Data Backupは、選択時点のタスク、WebDevプロジェクト、コード、チェックポイント、アップロード済みファイル、設定、データベース等を含むスナップショットである。GitHubへのPushはコード・分析資料の保全には有効だが、Manus上のプロジェクト記録、公開設定、画像、ストレージ、データベースの代替にはならないため、今回のローカル保存を正本の復元手段として扱う。[1]

今回のバックアップ後に変更を加えた場合、その変更は自動追記されない。002正式MainやSonata Deskに追加変更を行う場合は、2026年8月23日 7:59（SGT）より前に再度Task Data Backupを作成・保存する必要がある。[1]

## 復元時の注意事項

Type Cでは、2026年8月25日 8:00（SGT）以降に、まずアカウント情報バックアップを復元し、ログイン後にTask Data Backupを復元する。復元は一度のみであるため、アカウントファイルとTask Data Backupファイルをどちらも保持し、ファイル名や内容を変更しない。公開済みだったWebDevサイトは、バックアップ時点の状態で同じ`*.manus.space` URLへ再デプロイされる見込みである。[1] [2]

> バックアップ時点以後の変更、または新しい公開は、今回のTask Data Backupには含まれない。復元後は、公開URL、002の正式Main表示、GitHub同期、カスタムドメイン、HTTPS、データベース、スケジュールタスク、外部連携の再有効化を確認する。

## 参照

[1]: https://help.manus.im/en/articles/16147892-service-change-overview-how-to-back-up-your-data "How to Back Up Your Data"
[2]: https://help.manus.im/en/articles/16147895-service-change-overview-how-to-restore-your-data "How to Restore Your Data"
