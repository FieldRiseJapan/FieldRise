# Phase 5 保持・削除方針の最終評価

確認日：2026-10-14 JST。基準：`3ea80f209e5797f6867dbda2e25982fdfab81ed7`。読み取りと文書作成のみ。公開適用 BLOCKED。

## 根拠と法務上の境界

個人情報保護委員会のFAQは、一律の保存期間を定めず、不要となった個人データの遅滞ない消去に努めることを説明する。30日・90日・24時間はFieldRiseの運用案で法定期限ではない。HMACは照合可能な識別子であり、匿名情報と主張しない。法定の仮名加工情報に当然該当するとも主張しない。

TikTok Developer Guidelinesは利用目的の透明性、データ保護、Privacy/Terms表示を求める。一方Developer Terms/Data Sharing Agreement本文の最新全体は取得制限により未確認。検索結果の終了時削除条項だけで現行契約全体への適合をPASSにしない。Research API専用の30日条件やData Portability専用要件をInbox/Login Kitへ転用しない。

国外処理、委託先監督、利用停止・消去請求、TikTok契約終了時の識別記録保持は、実際の事業者契約/データ経路を踏まえ法務確認が必要。法務確認は未実施。

## データ分類・推奨保持期間（未承認案）

|データ|分類・目的|起算点・推奨期限|現行Phase 4との差|
|---|---|---|---|
|profile/規約同意、表示名|識別可能な個人データ。登録・認証・利用条件|利用中は目的達成まで。削除要求で新規操作停止、通常情報24h以内消去目標|UNKNOWN時は24h経過まで待つため完了目標に余裕なし|
|connectionのopen_id/name/avatar/scopes/暗号化token|個人データ・認証情報。接続・Inbox|削除要求後、不要情報を速やかに消去、24h以内目標|UNKNOWN時に通常データと一緒に待機。鍵/接続欠如で削除開始が止まり得る|
|素材・下書き、asset manifest|投稿準備・所有者隔離。内容に個人情報を含み得る|利用者削除まで。登録削除は24h以内目標。長期未利用素材の見直しを別途告知|active素材の期限は未設定、無期限必要性の再評価要|
|raw jobs/leases/request_key/open_id|識別可能。結果表示・重複防止・素材取得|削除要求後24h以内に通常情報消去、必要部分のみ仮名台帳へ|台帳なし旧UNKNOWNの削除前移行が必要|
|send_attempts/grantsのHMAC・素材hash・状態|仮名化した安全性記録。承認消費/UNKNOWN二重dispatch抑止|試行作成/承認消費から30日review、必要性終了で早期消去、原則90日以内に消去。未使用grantは失効・発行から90日以内|legacy移行はreview/purgeを移行時から設定するため起算点差を要補修|
|grant_id/approval_ref/attempt_id|個人データと照合できる監査識別|前行と同じ。approval_refに氏名/email/自由記述を入れない|approval_refにformat/length制約なし。発行経路はまだ作らない|
|delete_requests|owner HMACと要求状態。削除再開・競合防止|完了から24hで消去。未完了は完了まで管理し期限超過を警告|QUEUED/DELETINGはpurge_atがあっても自動消去されない。放置不可|
|R2 cleanup locator（raw owner/id）|匿名でない短期清掃記録。遅延upload orphan防止|通常消去後24hを目安に削除。R2消去未確認なら期限延長は安全上必要な分だけ|現行tombstone sweepはR2 delete成功後24hでDB削除。失敗は残る|
|OAuth state/期限切れmedia lease|短期認証・URL管理|state10min、URL最大2hはアクセス期限。物理消去は期限後の次回清掃、通常15min以内目標|現行runnerに期限切れstate/leaseの通常清掃なし|
|監視ログ/削除証跡|個人単位に結び付けない集計。運用失敗確認|run集計は30日候補。受領/完了の仮名証跡は必要性と本人権利を評価、原則90日以内|ホストのURL/headers/IPログ設定・保存期間は未確認|
|D1バックアップ・ホストログ|通常・安全性情報を含み得る|契約プランの実保持期限。復元時は既実施削除を再適用|公開DB種別/Time Travel期限・取得権限未確認|

## 削除フロー推奨

1. 認証済み利用者の要求を原子的に受領し、新規送信/素材操作を拒否、未使用承認取消。
2. UNKNOWN結果は変更せず、必要最小限の承認消費・account HMACを保全。旧UNKNOWNに安全台帳がない場合は移行または送信停止を維持し手動処理。
3. 通常データを必要以上に待機させずR2とD1から消去。R2失敗はmanifestを残し再開、遅延upload locatorは短期掃除対象。
4. 受領と通常情報消去を利用者へ区別して通知。台帳保持がある場合、目的・期限・相談窓口を説明。
5. 30日reviewで必要性を再判定。90日期限ではUNKNOWNを成功/失敗へ変えず最小記録を消去し、承認発行なし/送信停止を維持。期限超過UNKNOWNの新承認発行は個別リスク評価まで禁止。
6. 再登録は利用登録のみで送信権限なし。台帳を消しても利用者API/同意/登録から承認を生成しない。

## 例外・優先順位

本人の正当な削除要求を最優先で審査する。法令保存義務・具体的な係争/侵害対応などの例外は、対象最小化、根拠、承認者、終了条件、再審査日を記録する。単にUNKNOWNというだけで90日を無期限延長しない。法令・TikTok契約が早期消去を求める場合はその義務を評価し、account単位の停止を維持したまま消去する。法務判断未確認時は公開適用しない。

R2失敗中のlocatorは即消去すると未消去素材を追跡できなくなる。期限超過を障害扱いし手動救済、24h成功を偽らない。backup復旧で消去済み情報を復活させる場合は再公開前に消去要求を再適用する。削除証跡自体も個人情報として扱う。

## 補修候補（今回は未実装）

B02：未確定時の24h待機と即時最小化の両立、鍵異常/未接続時の正規削除救済。B03：legacyの期限起算、状態/lease物理清掃、集計証跡。合成D1/R2で期限境界・途中停止・鍵異常・再登録・早期消去を試験する必要がある。

## 公式出典（確認日2026-10-14、引用でなく要旨）

- [PPC FAQ Q5-2](https://www.ppc.go.jp/all_faq_index/faq1-q5-2/)：一律の保存期限なし、不要データ消去の努力義務。
- [PPC FAQ Q5-3](https://www.ppc.go.jp/all_faq_index/faq1-q5-3/)：業務必要性・影響を踏まえ過度に長期化しない。
- [PPC通則編](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/)：利用目的・安全管理・本人請求の評価。
- [PPC外国提供編](https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore/)：処理先・監督確認。
- [PPC仮名・匿名編](https://www.ppc.go.jp/personalinfo/legal/guidelines_anonymous/)：HMACだけで法定匿名と扱わない評価の参考。
- [TikTok Developer Guidelines](https://developers.tiktok.com/docs/en/our-guidelines-developer-guidelines)：透明性・利用者のデータ保護。
- [Developer Terms](https://www.tiktok.com/legal/tik-tok-developer-terms-of-service)、[Data Sharing Agreement](https://www.tiktok.com/legal/tiktok-data-sharing-agreement)：公式リンク確認、本文全文取得不可・NOT VERIFIED。
