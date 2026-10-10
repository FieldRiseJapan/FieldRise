# Windows CSS修正の安全な適用

## 準備・承認
対象は `C:\Users\user\Downloads\FieldRise-e9babbaa5c8838bbdf8609cc1f4d172004b088b3` のCSSのみです。社長の実行承認を得るまでスクリプトは実行しません。GPT桃花には社長PCへの直接アクセスがありません。

[適用スクリプト](../../automation/sns_auto_posting/tiktok/photo/tools/apply_hidden_css_windows.cmd) をPCへ保存し、承認後にダブルクリックします。既存Python 3ランチャー `py` を使います。追加インストール・ネット通信・PowerShell・Console入力は不要です。Windowsが実行を拒否した場合は保護設定を解除せず、表示内容を報告してください。

## 動作
1. 対象フォルダ・CSSの存在と、リダイレクトされていないことを確認。
2. hidden非表示ルールが既にあればALREADY APPLIEDとして何も変更しない。
3. 未適用CSSのSHA-256が承認対象と違えばFAILで停止。
4. 元CSSを同じ場所の `style.css.before-hidden-fix.<UTC>.<一意ID>.bak` に排他的にバックアップし、内容一致を検査。
5. 同じフォルダの一時ファイルへ修正版を作成し、元CSSが途中で変わっていないか再確認。正常時だけファイルを置換。
6. 適用後の内容・SHA-256を確認し、PASS／バックアップ場所を表示。一時ファイルを除去。

変更は対象style.cssとそのバックアップ・一時CSSだけです。JavaScript・HTML・JSON・画像・ブラウザ保存領域にアクセスせず、既存10セット・楽曲情報・バックアップ2本を変更しません。

旧CSS SHA-256:
`20dab296d72709e0150ba5517ea8c9ecb59d4e5f1e104bad0471e11dcea4cb3b`

修正後CSS SHA-256:
`bde2bc396abc82bdb9b91e3982dfdb14c3eddb2230df82694e2f3ecdcb08adee`

適用スクリプトSHA-256:
`c2cb7a4c662eb38f49737aae3c9638da8d94326610aa3677364db835f7823472`

## 失敗・復旧
FAILならブラウザ保存を初期化せず、エラー表示を報告します。置換前の失敗なら元CSSを保持。バックアップは削除しません。適用後の確認異常が出た場合、別の変更を上書きしないため自動復元しません。

ロールバックが必要な場合だけ別途承認を得て、画面に表示されたバックアップを対象style.cssへコピーします（バックアップ自体は保持）。変更前にバックアップSHA-256が旧CSSと一致することを確認します。HTML・JavaScript・Chromeデータは戻しません。

## 実機確認は一操作ずつ
スクリプト結果を受領した後、ChromeでCtrl+F5を案内します。次に状態文・復旧操作非表示・10セット・ID・cafeを確認。保存とF5復元、二タブ競合はその後に別々に確認します。既存セットの内容変更は社長の明示判断の範囲に限り、無断のテスト上書きをしません。破壊的・競合テストは隔離した合成データを優先します。

CSS表示PASSと保存正常PASSを別判定にします。現段階では両方の今回Windows実機結果はNOT TESTED。完了条件を満たすまでCTO最終レビューを依頼しません。Production・SNS投稿は別承認まで禁止です。
