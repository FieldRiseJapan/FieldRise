# YouTube Phase 3-B7D Staging最小権限検証レポート

**実施日:** 2026-09-27  
**最終判定:** **SECURITY REVIEW REQUIRED**  
**対象:** FieldRise Stagingのみ。Productionへの書き込み、migration、Auth変更、Function deployはなし。

## 判定要旨

B7C正式版の同期、Free plan、対象Staging、B7B失敗後のrollback状態、migration source、64件の回帰テストを確認した。Stagingへのmigration適用を1回だけ要求したが、Supabase migration toolが`INVALID_ARGUMENT`を返した。再試行やSQL経由の代替適用は行っていない。直後の読み取り検査ではmigration履歴、OAuthオブジェクト、Auth users/sessionsともに0で、永続的な部分適用は見つからなかった。

加えて、実行経路の`current_user`は`postgres`であり、同ロールは`rolbypassrls=true`、`rolcreaterole=true`だった。B7C候補のprivate `SECURITY DEFINER` helperは作成者を既定ownerとするため、実際に作成されればこの強い`postgres`権限で実行される。service_roleに`auth.sessions`の直接SELECT権限はないが、helperの実DB動作と実ownerを確認できず、B7D指示のowner最小権限基準を満たしたとは判定できない。権限を追加して通す対応は禁止されているため、fixture、function/ACL試験、後続DB試験は行わず停止した。

## 52項目の完了記録

| # | 項目 | 結果 |
|---:|---|---|
| 1 | 最終判定 | **SECURITY REVIEW REQUIRED**。migration toolの`INVALID_ARGUMENT`と、候補helperがBYPASSRLSを持つ`postgres` ownerで実行される設計上の懸念が残る。 |
| 2 | Git同期 | SOURCE MATCH後にローカルをGitHub mainへ同期。local HEADとorigin/mainは`df02f14a62e154aec232372239ac69a720359099`、作業ツリーclean。 |
| 3 | B7D baseline SHA | `df02f14a62e154aec232372239ac69a720359099`。 |
| 4 | B7C累積差分 | B7B `40a1a5a851e6d5fa1d1ebc3f767b23b621e19357`からの変更はsecurity report、migration候補、contract testの3ファイル。最終commitだけで差分を誤認していない。3ファイルのGitHub版とlocal版が一致。 |
| 5 | Billing確認 | Supabase組織APIは`plan=free`、`tier_free`、`opt_in_tags=[]`。新規project/branch、Compute/add-on、billing/payment設定操作はなし。 |
| 6 | Free plan維持 | Staging確認後も組織はFree。Staging DBサイズは10,521,747 bytes、Freeの500 MB枠未満。migrationは永続適用されておらず、追加料金は発生していない。Free超過時は課金でなく制限が適用される旨を[Supabase Cost Control](https://supabase.com/docs/guides/platform/cost-control)で確認。 |
| 7 | Staging identity | `FieldRise Staging`、ref `zjgmgwjeebphkbbqjbfi`、region `ap-northeast-1`、`ACTIVE_HEALTHY`を適用直前に再確認。 |
| 8 | Production分離 | Productionは別projectとして識別。Staging以外へのDB writeは行っていない。 |
| 9 | B7B rollback状態 | 適用直前・直後ともmigration historyなし。OAuth private schema/table/RPC/helperなし。Auth user数0、session数0。 |
| 10 | Migration SOURCE MATCH | `supabase/migrations/20260927084829_youtube_oauth_transactions.sql` localと正式mainの内容・blobが一致（`545c986de4bf0ab3ed6534e48609ce4c88468038`）。 |
| 11 | `supabase_auth_admin` owner依存 | migrationにowner移譲、`SET ROLE`、同ロールへのschema権限付与なし。適用されていないため、実DBでの関数owner変更もなし。 |
| 12 | Migration apply | `supabase_apply_migration`を1回呼び出し、`INVALID_ARGUMENT`。再実行、`execute_sql`経由の適用、GRANT/owner変更は行わず停止。ツール応答からSQL実行段階まで到達したかは判別できない。 |
| 13 | Migration履歴 | 適用前後とも空。 |
| 14 | 作成object | schema、table、RPC、private helperいずれも作成されていない。 |
| 15 | RLS | OAuth tableが存在しないため適用後のRLS監査は未実施。既存`auth.sessions`はRLS有効。 |
| 16 | ACL | OAuth function/tableがないため適用後ACL監査は未実施。適用前はservice_roleに`auth.sessions`の直接SELECT権限なし。 |
| 17 | 実function owner | custom helperが存在しないため実ownerなし。現在のmigration実行roleは`postgres`。`postgres`は`rolsuper=false`だが`rolbypassrls=true`、`rolcreaterole=true`。 |
| 18 | SECURITY DEFINER | 実DB functionがないため挙動未検証。候補SQLではhelperのみ`SECURITY DEFINER`。実行時に既定owner `postgres`の強い権限を使う可能性があるため、最小権限のSecurity Reviewが必要。 |
| 19 | search_path | migration sourceでは関数の`search_path`は空。実DB関数がないためcatalog値の監査なし。 |
| 20 | PostgREST境界 | 実DB helper/RPCがなく、公開境界の実行・discovery試験は未実施。SQL接続の`pgrst.db_schemas`設定は取得できず、公開schema一覧は未検証。 |
| 21 | Fixture | Auth user/session、transaction、dummy token fixtureとも未作成。 |
| 22 | Session helper | 未実行。boolean以外を返さない設計はsourceで確認したが、実DB動作は未確認。 |
| 23 | Atomic consume | 未実行。 |
| 24 | Replay | 未実行。 |
| 25 | Concurrent consume | 未実行。 |
| 26 | Session revoke race | 未実行。安全なlock順序を実DBで証明できていない。 |
| 27 | Expiry boundary | 未実行。 |
| 28 | Token cutover | Staging dummy tokenを使った試験なし。 |
| 29 | Rollback | migration toolエラー後、読み取り確認で履歴・部分objectがないことを確認。cutover rollback試験は未実施。 |
| 30 | `OLD_DUMMY_PRESERVED` | 試験していない（dummy未作成）。 |
| 31 | Partial stateなし | private schema/table/RPC/helperなし、historyなしを確認。Auth user/sessionも0。 |
| 32 | Fixture cleanup | fixture未作成のためcleanupなし。migration objectもなし。 |
| 33 | Callback-time AAL2 | `callback-time AAL2 VERIFIED`とは扱っていない。B7C trust modelを維持。 |
| 34 | Free-operation compatibility | B7CはFree上で動く設計候補。B7D実動作は未確認。Free超過時の有料upgradeを前提にしない。 |
| 35 | Production DB無変更 | Productionに対するDB write/migration/RPC変更なし。project情報取得のみ。 |
| 36 | Production Auth/Secret/Function | Auth、Secret、Function変更/deployなし。 |
| 37 | Deno validation | `DENO VALIDATION NOT AVAILABLE`。global installなし。 |
| 38 | Node/regression | 64/64 PASS：OAuth、Auth、Gateway、DB contract、Creator Studio関連。 |
| 39 | Creator Studio regression | 含まれる8件PASS。投稿ボタン有効化なし。 |
| 40 | `git diff --check` | B7BからB7D report追加前のB7C累積差分でPASS。 |
| 41 | Secret scan | Staging対象3ファイルのcredential-shaped value scan PASS。Production refやtoken/API key値は含まない。 |
| 42 | 残るStaging blocker | `INVALID_ARGUMENT`のままで、再実行禁止。候補helperのpostgres owner/BYPASSRLS設計をSecurity Reviewし、承認済みの新しい手順が決まるまでmigration適用・fixture・実DB試験を行わない。 |
| 43 | 残るProduction blocker | B7D判定後もProduction migration/deploy/Secret設定/Google再認可/実API/実uploadは別承認まで禁止。 |
| 44 | 変更ファイル | 本レポート1ファイルのみ。B7C migration/testは変更していない。 |
| 45 | local Commit SHA | 本レポート作成後のcommit SHAはcommit完了報告に記録（自己参照を避けるため本ファイルには含めない）。 |
| 46 | GitHub正式Commit SHA | GitHub main登録後の正式SHAはcommit完了報告に記録。 |
| 47 | GitHub SOURCE MATCH | GitHub登録後、対象ファイルをSHAと内容の両方で読み戻して確認する。 |
| 48 | Deploy | なし。 |
| 49 | Google/OAuth/YouTube実通信 | なし。 |
| 50 | 再認可 | なし。 |
| 51 | 実upload | なし。 |
| 52 | 課金0円維持 | Free plan維持。課金・有料機能・Compute/add-on・支払設定を変更していない。migrationは永続適用されず、今回の操作による追加課金なし。 |

## Supabase資料と実行環境メモ

- [Supabase billing and Free plan cost control](https://supabase.com/docs/guides/platform/cost-control)
- [Supabase API security: grants, RLS, and exposed schemas](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase changelog](https://supabase.com/changelog)：2026-09-25のPostgreSQL 17.11/15.19更新告知を確認。候補migrationが使う型・演算（UUID、interval、octet_length、標準SQL）に影響するextension/operator変更は見当たらない。Staging DBはPostgreSQL 17.6.1.166。
- B7D適用toolの応答は`INVALID_ARGUMENT`のみで、詳細エラーは返されなかった。これをPostgreSQL構文エラー、roleエラー、tool入力エラーのいずれかと断定していない。

## 停止条件

B7Dはここで停止。再申請・別経路でのmigration適用、role/ACL/owner変更、fixture作成をしない。彩花CTOのSecurity Review後に、追加承認された手順がある場合のみ次工程を決める。
