# 再登録反映・暗号化済みトークン件数確認（2026-10-12）

## 確認済み
- 環境revision14。新SandboxのClient key/secretはSecret属性のまま。実Workerで両方の空欄・周辺空白・引用符等の診断エラーなし。
- これは非空/基本形式/ランタイム反映の証明のみ。TikTokが有効な資格情報として認めるかは未検証。
- TOKEN_ENCRYPTION_KEY：EXPECTED_64_LOWERCASE_HEX。不適合が継続。
- SITE_ORIGIN：問題なし。
- 公開版D1の暗号化済みtoken件数：0件。集計SQLのみを実行し、秘密値・token・ciphertext・owner・アカウント情報をSELECTしていない。

SQL:
```sql
SELECT COUNT(*) AS count FROM connections
WHERE secret IS NOT NULL AND secret <> '';
```

## 元キー復元の必要性
既存コードではAES暗号化キーの利用先はconnections.secret。保存済み暗号化tokenが0件のため、このデータの復号を保護する目的で元キーを復元する必要はない。
キーを新規生成して登録する案が可能。別途社長承認まで実施しない。過去のキー値は取得・表示していない。

## 安全な新キー登録手順（未実施）
1. 社長がTOKEN_ENCRYPTION_KEYだけの新規生成/登録を明示承認。
2. 暗号学的乱数32bytesを実行環境内で生成し、小文字16進数64文字に変換。
3. セッションメモリ内でのみ保持し、Sitesネイティブupdate_environment_variablesへis_secret=trueで登録。生成値はtext/notify/画面/ログに出さず、ファイル、GitHub、シェル引数へ保存しない。
4. 値非表示の形式診断を実施。TIKTOK_ENABLEDはOFFのまま。承認済みsaved versionへ再デプロイ。
5. 新しいキーが形式を満たすことだけを確認し、セッションの値を破棄。
6. OAuth有効化はOFF維持指示が解除された承認範囲でのみ実施。送信・投稿・審査提出は別承認。
生成・登録とも今回未実施。

## 一時診断と復元
一時source SHA: 8e951d40429221a1479acfd9c0d93fd46f627d5e、saved version3。
診断版デプロイ: appgdep_6acc5440bddc8191a9fd2cac84f40a45、envrevision14。
値を記録しない管理ログからissuesとtokenCountのみ抽出。
型検査/ビルドPASS。既存30件・134ファイル照合は再実行なし。
調査後saved version1に復元：appgdep_6acc549b040481919ab6c54d50f28ada、succeeded、envrevision14、2026-10-12T03:31:57.242774+00:00。
現稼働版には一時診断を残していない。環境変数変更なし、Secret変更なし、OFF/unconfiguredを維持。
既存社内版・Supabase Production・SoundOn変更、Sandbox送信・実投稿・審査提出・課金なし。
