# Phase 5-F ZERO-01/02/03
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


ZERO-01＝許容量内請求0、ZERO-02＝超過でも自動課金なし、ZERO-03＝操作なしの有料移行なし。下表は仕様レベルで、当account実確認ではない。

|機能|ZERO-01|ZERO-02|ZERO-03|条件/限界|
|---|---|---|---|---|
|Workers Free|VERIFIED|VERIFIED（Freeの制限分）|PARTIAL|100000 req/日・CPU10ms、超過1027/1102等。課金型add-onや管理者upgradeを別管理|
|D1 Free|VERIFIED|VERIFIED（Freeの制限分）|PARTIAL|read500万/write10万行/日、総5GB・1DB500MB。超過はエラー/挿入不可。Paidへの自動移行保証は契約/権限確認要|
|R2 Standard|VERIFIED（無料枠分）|BLOCKED：超過料金が明示|NOT VERIFIED|従量課金subscription。planがFreeでもR2利用量課金は別|
|Cron/Queues|PARTIAL|NOT VERIFIED（構成全体）|NOT VERIFIED|Cron5、Queue10000操作/日。Worker/DB/storage操作等の合算あり、実有効plan未確認|
|Logs/Analytics|PARTIAL|NOT VERIFIED（機能全体）|NOT VERIFIED|Free Logs20万/日・3日、他export/observability連携別料金。12/1料金変更予告|
|GitHub Actions|PARTIAL|PARTIAL|NOT VERIFIED（実account）|public standard runner無料、larger/artifact/cache/別契約に注意|
|Secrets|PARTIAL|NOT VERIFIED（全構成）|NOT VERIFIED|Worker secretsと別Secrets Storeを混同しない。secret呼出が無料でも実行/保存費は別|
|domain/OAuth|PARTIAL|NOT APPLICABLE（OAuth自体のCF課金）|NOT VERIFIED（全構成）|workers.devならdomain購入不要候補、独自domain登録更新は別料金、TikTok設定変更別承認|

Workers route fail-openは超過時にWorkerを迂回する。安全境界に使う場合fail-closedが必要だが、設定未実施。課金ゼロでも安全が維持されるとは限らない。FreeのCPU10ms/128MiBで全MP4 hashを実行できるか未試験。
D1正規migration/historyとTime Travel7日（Free/new storage）は公式機能。複数migration全体rollbackやGrant巻戻り防止は別で、復元のみでは安全にならない。
Versions/Version URLs、branch Previews/Deployment URLsを分離管理。workers_dev無効だけで全経路を止めない。これら一般仕様は旧Sites停止に転用しない。

## 商用利用/当account
Workers Freeが非商用限定と断定する根拠はないが、FieldRiseの商用適合と当契約全条件はNOT VERIFIED。Developer Platform条件の候補URLは取得不可で証拠に採用しない。登録/同意/支払手段を操作して確認しない。
構成全体でZERO-02/03が揃わず、**追加費用ゼロ保証はBLOCKED**。総額推定・アプリquota・予算通知で代用しない。

## 根拠
2026-10-15再取得：Workers limits/pricing、D1 FAQ、R2 pricing、Billing policy/threshold/budget、token資料。数値の詳細資料はPhase5-E free tier reviewを再利用。
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/reference/faq/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/r2/pricing/
その他機能はPhase5-E公式URL/取得済み本文を再利用し、追加account/公開試験なし。

