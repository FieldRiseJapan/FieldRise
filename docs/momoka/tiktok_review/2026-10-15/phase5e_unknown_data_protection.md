# Phase 5-E UNKNOWN・データ保護
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


## 事実分類
16:51:56 JST（2026-10-12）：HTTP502/NETWORK_RESULT_UNKNOWN、登録削除によりローカル履歴消失との既報。架空レコード復元禁止。
21:42:47 JST：別UNKNOWN試行、既報ではD1にjob/予約あり。今日の公開DB存在/件数/全fieldはNOT VERIFIED。送信回数は成功件数ではない。139PASSは隔離試験記録。

## 移行に必要な保全（実行しない）
- 社長承認下の正規export/backup能力と全writer停止/drainを先に確認。公開DB接続・コピー自体を今回実施しない。
- 移行対象：job全field、owner対応、request key/payload fingerprint、status、予約/lease/grant/attempt/delete request/maintenance状態、schema/journal、R2 key/size/hash/retentionを必要範囲で整合比較。鍵/Token/署名URL/利用者情報を報告やGitHubに入れない。
- 新hostは送信halt、grant0を初期状態とする。旧UNKNOWNからAVAILABLE承認を作らない。再登録・同一素材・別owner同一TikTokの未確定試行を保守的に拒否する。
- lease失効を送信失敗や承認返却と扱わない。バックアップのAVAILABLEを復活させない。UNKNOWN/consumedを旧記録より弱い状態へ巻戻さない。
- owner IDやHMAC用途鍵を無断変換しない。元暗号化鍵を安全に継続する場合も値を人間/ログ/公開コードへ出さず、承認されたsecret-to-secret経路のみ。HKDF/key_version/復号の合成→非出力実検査を別承認。経路不明なら移行停止。
- R2は照合完了/削除方針承認まで無断削除しない。期限到達で取得不能にしても、開始済み通信の取消やTikTokに未取得を証明しない。
- restoreは旧バックアップだけへ戻さず、消費済み承認・削除要求・安全性停止の最新証跡を保全してroll-forward。証跡不明なら両host停止を維持し復旧BLOCKED。
- 削除済み情報を復活させない。監査/仮名データも目的限定・最小化・期限付き、30/90/24は未採用運用候補。

## 旧Sites無害化ゲート（全案共通）
新hostで新しい鍵を設定するだけでは旧tokenの送信権限は失われない。Client Secret変更だけでも既発行tokenの失効を証明しない。
正規host全経路停止＋drain、または提供元/連携先の保証ある旧資格失効＋終了証拠を検討するが、後者は認証/環境変更の別承認が必要。現在どちらも未成立。DNS切替・UI無効・旧URL秘匿・期限待ちでは代替しない。
TikTokの状態APIで過去受理確認することも今回禁止。旧Sitesの送信能力喪失を確認できるまで、新hostから同じ素材/アカウントへ送信せず、二重稼働しない。

