# Phase 5-C 保持・公開文面準備

確認日時2026-10-14 12:26〜12:28 JST。基準Phase5/5-B policy資料・source、PPC公式FAQ、TikTok Developer Guidelines。公開文面未変更。

30日review、90日消去候補、通常消去24h目標は運用案で法定期限ではない。PPCは不要な個人データを長期保持しないことを説明する。HMAC/素材hashを当然匿名や法定の仮名加工情報と扱わない。

|論点|評価・必要な採用条件|
|---|---|
|通常消去24h|Phase5-Bは24h待機を除いたが、scheduler/復旧/通知未導入で達成保証できない。受領202と完了を区別|
|UNKNOWN|成功/失敗を推定しない。必要最小台帳とレビュー例外を期限管理。実送信結果は未確認|
|90日期限後|台帳/例外消去前に停止、承認自動生成なし。新承認は別リスク評価、単なる期限を再送許可にしない|
|鍵不一致・削除請求|認証済みowner救済、account権限を推定せずglobal停止。法務/本人説明/手動救済を確認|
|R2期限|logical deadlineは物理通信取消/外部受理取消を保証しない。locator・期限超過救済を正確に説明|
|延長例外|具体的法令/紛争/消去障害の必要性、対象最小化、期限、再審査と本人案内。UNKNOWNだけで無期限保持しない|
|backup/ログ|実host保持が未確認。消去済み情報が復元された場合の再消去手順を確定|
|Privacy|現行登録削除時に履歴消去という説明と安全台帳保持の差を修正案へ反映|
|Terms/Support|1日5回と限定Sandbox1回承認の混同、素材URL成功とInbox成功未確認を区別。正式窓口と期限対応を確認|

TikTok Guidelinesは目的透明性・データ保護・Privacy/Terms表示を確認。Developer Data Sharing Agreement本文は今回も取得不可、NOT VERIFIED。保存期限の契約適合をPASSにせず、Research/Data Portabilityの専用条件を転用しない。法務確認・業務責任者/社長採用は未実施。

次の採用承認に、保持起算点・早期請求・例外・外国処理先/保護措置・窓口・scheduler・backup消去・監視数値の表示条件を含める。採用決定なしに公開ページやPortalを更新しない。

出典（2026-10-14）：[PPC FAQ](https://www.ppc.go.jp/personalinfo/faq/APPI_QA/)、[TikTok Guidelines](https://developers.tiktok.com/docs/en/our-guidelines-developer-guidelines)、[Data Sharing Agreement](https://www.tiktok.com/legal/tiktok-data-sharing-agreement)（本文取得不可）。
