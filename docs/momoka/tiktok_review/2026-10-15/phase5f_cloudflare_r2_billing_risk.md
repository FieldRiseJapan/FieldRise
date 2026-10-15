# Phase 5-F R2課金防止
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


## 公式に確認できたこと
R2はsubscriptionのcheckoutが必要で、無料枠付き月次従量課金。Standard無料枠はstorage10GB-month、A100万/B1000万操作/月。超過はstorage $0.015/GB-month、A $4.50/百万、B $0.36/百万。egress無料でもstorage/操作は別。Infrequent Accessに同じ無料枠は適用されない。
ZERO-01のみVERIFIED。ZERO-02は超過課金と整合せずBLOCKED。ZERO-03と契約的hard capはNOT VERIFIED。

## 支払方法・hard cap
公式はsubscription有効化前の有効な支払手段、従量課金の事前承認/支払失敗時停止を説明。**R2を支払手段なしで開始・維持できる保証は未確認**。すべての利用者が特定のcredit card必須とも断定せず、正式照会で確認する。
hard capは今回の公式R2/billing検索・本文で確認できなかった。不在を断定せずNOT VERIFIED、採用ゲートBLOCKED。
Budget Alertsは通知のみ、usage停止/capではない。Threshold billingは合算利用料に達した時の自動徴収であり上限停止ではない。R2をWorkers Freeに組み合わせても、R2 subscription課金は別に発生し得る。
支払失敗・card削除・残高不足はゼロ請求の対策でない。既料金は残り、他サービス制限や保存情報喪失の危険もある。課金型product解約後も直近利用の請求処理が残り、支払手段を即撤去できない場合がある。

## account全体/動画容量
枠・請求は当Siteだけでなくaccountの他bucket/利用量と合算され得る。並行request・再試行・悪用・cleanup・storage日次peak・月次集計も含める。hash検証の全体取得自体もoperationになる。アプリで抑制してもplatform全アクセスのhard capではない。
将来MP4容量・利用者・保持期間が増えるとstorage/operation/Worker CPUが増える。概算を保証にしない。r2.devは試験用途でproduction向きではないが、Worker経由の対象限定pullなら独自bucket domainが必須とまでは断定しない。
R2を使わない別方式は新API/素材保持/権限設計が必要で、今回採用変更しない。

## 採用に必要な証拠
プラン・日本の当account条件・支払手段不要構成・各従量dimensionの$0 hard cap・超過時拒否の保証・権限と変更監査・既発生料金の扱いを正式回答/契約で確認。通知やcommunity推奨のみでは不十分。保証なしなら追加費用ゼロ必須構成として採用しない。

出典（2026-10-15本文確認）：
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/billing/manage/budget-alerts/
- https://developers.cloudflare.com/billing/threshold-billing/
- https://developers.cloudflare.com/billing/understand/billing-policy/
- https://developers.cloudflare.com/billing/troubleshoot/resolve-cannot-remove-payment-method/
r2.dev制限はPhase5-F公式検索 https://developers.cloudflare.com/r2/platform/limits/ 、その他Phase5-E既確認を再利用。新規登録・課金画面閲覧・設定なし。

