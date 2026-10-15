# Phase 5-E ホスティング比較
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


4構成を比較。候補のaccount作成・契約確認・実機試験なし。VERIFIEDは公式機能の存在、PARTIALは条件不足、NOT VERIFIEDは未確認、BLOCKEDは次工程不可、NOT APPLICABLEは構成上対象外。

|観点|A ChatGPT Sites Plus|B 自主管理CF Workers/D1/R2|C1 Vercel Hobby＋外部DB/storage|C2 GitHub Pages＋独立CF API|
|---|---|---|---|---|
|B04|BLOCKED：旧版/drain不明|PARTIAL：URL制御あり、全writer/drain要設計・検証|BLOCKED：商用不可、全旧版/drain未調査保証|BLOCKED：静的UIではbackend停止不可|
|旧Sites無害化|NOT VERIFIED|NOT VERIFIED：新CFの権限はSitesへ及ばない|同左|同左|
|UNKNOWN保護|実DBの現在状態未確認|設計案あり、export/移行未承認|外部DB含む再設計必要|B backendと同条件|
|DB/migration|管理経路不明|VERIFIED：Wrangler migration/history。実移行未検証|外部DB別契約・復旧未確定|Bと同条件|
|復旧|NOT VERIFIED|PARTIAL：Free Time Travel7日、台帳巻戻り別対策|外部DB次第、未確定|Bと同条件|
|OAuth/VIDEO Inbox|過去OAuth PASS/送信UNKNOWN|PARTIAL：HTTPS/fetch/Secret適合候補、callback/domain再設定必要|技術的候補に過ぎず商用ゲート不適合|静的UIにSecret置けずAPI必須|
|無料|既Plus内の実Scheduler限度不明|R2無料枠ありだが従量課金・hard cap未確認|商用の無料採用不可|商用SaaS用途のPages制限、backend費用も別|
|監視|Site固有保証不明|Free logs/cron等あり、全静止証明ではない|Hobby cron1回/日・機能/外部DB再評価要|静的trafficとbackend監視は別|
|GitHub|既存運用あり|公式Actions/Wrangler連携あり|連携可能でも採用根拠にならない|Pages連携あり、送信安全性はbackend責任|
|作業量|最小だがB04停止|中：adapter/identity/移行/host制御|大：DB含む再構成|中〜大：CORS/認証/二origin増加|
|採用判断|公開適用BLOCKED|技術検討の第一候補、採用未確定|FieldRise商用運用には不採用|このサービス本体の無料商用hostとして推奨しない|

C1公式Hobby/Fair Useは非商用個人用途に限定。C2公式Pages規約は事業運営・主に商用SaaS提供の無料hostingを制限。会社紹介ページすべて禁止とは解釈せず、今回の投稿Webサービス本体に対する判断。既存FieldRise公式HPを変更しない。

Bは同じruntime/DB/object APIを再利用しやすいという設計上の推論。Sites identity/build integrationの交換・テナント隔離・Token暗号化/HMAC継続は別検証であり、コードをそのままdeployできると断定しない。商用利用の契約適合と課金条件は別ゲート。

出典（2026-10-15本文確認）：
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features
- Cloudflare詳細は無料枠資料・B04資料のURL参照。

