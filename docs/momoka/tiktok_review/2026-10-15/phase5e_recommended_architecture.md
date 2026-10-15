# Phase 5-E CTO評価用推奨候補
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


## 結論
**採用方式は確定しない。全案Production READYではない。** 技術調査の優先順位はB自主管理Cloudflare→Aの正規停止仕様の追加確認。既D1/R2/Worker APIを再利用できる可能性からBを最も有望な技術候補とするが、旧Sites無害化・drain・R2課金ゼロ保証・契約適合・実Free性能が未解決。C1/C2は商用条件で今回のサービス本体には推奨しない。

## Bで検討する責任分離（設計案、未実装）
- UI/API/cleanup起動と、実dispatch資格を扱う境界を分離。Tokenを持つ実行経路を最小化し、各version/preview/内部経路にも同一原子的停止条件を強制する。
- D1はowner/アカウント/素材/承認/試行/削除状態を保持し、未知・不整合・鍵異常では送信拒否。KV等の最終整合flagだけを停止の唯一根拠にしない。
- R2非公開保存＋対象/期限/署名限定のpull path、全体hash検証と同一URLの使用。権限・コスト上限・ログ非露出・期限後処理は再審査。
- 新環境に旧台帳を理解しない過去コードを入れない。previewに実Token/実DB bindingsを渡さない。Version URL・Preview・固定Deployment・RPC・Cron/Queueを別管理し、rollbackで停止回避できないようCIと権限を設計する。
- Cronはcleanup専用、送信を起動しない。QueueをInbox自動再送に使わない。heartbeat/固定エラー/操作数を監視し、個人情報を記録しない。

これは新hostの安全設計案に過ぎず、現Sites旧版directfetchを止める効果はない。B04-07を解消するまで同一TikTokアカウントを新旧両hostで稼働させない。

## 現行Sites継続
既存画面/採用済み動画/UNKNOWNの保存は維持。新機能公開やmigrationの継続はBLOCKED。AI Supportの未確認を未対応と断定せず、正式仕様回答で解消する余地は残す。
社長が必要な追加照会を承認する場合も、tokenやDB内容を渡さず、Plus当Siteへの停止・drain・backup適用条件と費用を質問する。今回は外部送信なし。

