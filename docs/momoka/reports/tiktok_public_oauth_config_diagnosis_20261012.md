# OAuth開始条件・Secret実行環境診断（2026-10-12）
## 結果
|変数名|実行環境で確認した原因|
|---|---|
|TIKTOK_CLIENT_KEY|EMPTY（空文字または空白のみ）。OAuth開始を拒否する原因。|
|TIKTOK_CLIENT_SECRET|EMPTY（空文字または空白のみ）。OAuth開始を拒否する原因。|
|TOKEN_ENCRYPTION_KEY|EXPECTED_64_LOWERCASE_HEX。非空文字列だが、既存AES-GCM実装の形式に不適合。OAuth開始判定は真偽値のみなので、この項目は開始失敗の直接原因とは断定しない。認証後の暗号化保存で失敗する追加ブロッカー。|
|SITE_ORIGIN|不足・形式エラーなし。|

## 判定と根拠
GitHub公開版の lib/server.ts の enabled() は TIKTOK_ENABLED==='true' と4必須値の真偽値を要求。modeは開始判定に関与しない。
設定メタデータのSecret登録表示と、ランタイムの非空値は別。今回は実Worker内で名前と形式だけを診断。
不足名の不一致・未反映は今回4項目では報告なし。2項目はMISSING_RUNTIME_BINDINGではなくEMPTY。
空欄になった操作・時点までは未特定。UI保存時の原因と断定しない。
TOKEN_ENCRYPTION_KEYの変更原因も未特定。既存値を取得/置換していない。

## 安全な診断方法
一時saved version2、source bbeaa0890c383cab77e2baab30f4a812b71e3654。
GET /api/health に一度だけサーバーログを出す診断を追加。公開レスポンスは従来のhealthのみ。Secret値、長さ、ハッシュ、トークン、例外本文を記録しない。
イベントFIELD_RISE_OAUTH_CONFIG_DIAG_20261012のissuesだけを抽出。
専用3件テストPASS、型検査・ビルドPASS。既存30件と134ファイル照合の不要な再実行なし。
診断版デプロイ appgdep_6acc522d5fa08191a4896b1ff3b62ec6（環境revision12）。
診断後はsaved version1/source c68e93f0471c432d432aa1bccc6de2496afe5711へ戻した。復元デプロイ appgdep_6acc52828c4c8191833f70480ba5a08a、succeeded、2026-10-12T03:23:00.230894Z、env_set_revision12。
復元後のHTTP確認：tiktok=false,mode=unconfigured。TIKTOK_ENABLEDはOFFのまま。診断処理は現在の稼働版には含まれない。
一時診断のソースはSites Git履歴に保存済み。FieldRise mainには変更なし。

## 修正案（未実施）
1. 社長がSites Settingsで、新SandboxのTIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRETを直接再入力し、保存する。入力値をAIへ共有しない。登録行の表示だけでは非空の証明にならない。
2. TOKEN_ENCRYPTION_KEYは既存の正しい暗号鍵の復元を優先。勝手な再生成は禁止。復元不能な場合、既存connectionsの保存有無を値を読まず確認してから再生成・再接続案を承認対象とする。新暗号鍵へ単純に置換すると既存暗号化tokenが読めなくなる。
3. SITE_ORIGINは変更不要。
4. 再入力/暗号鍵修正の承認後、OFFのまま形式診断。問題解消を確認後にのみ、別途条件に従いOAuth有効化・実機認証検証へ再開。

実APIの資格情報有効性・OAuth成功・Token Refresh・審査動画完成は未確認。
Sandbox送信・実投稿・審査提出・課金、社内版・Supabase Production・SoundOn変更なし。
