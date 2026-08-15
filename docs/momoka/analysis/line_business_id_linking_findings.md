# LINE Business IDとLINEアカウント連携：公式確認メモ

## 目的

Issue #18で必要な `LINE_TARGET_ID` を、安全に確認できる状態にするため、LINE Developers Consoleに紐づくBusiness IDと社長のLINEアカウントを連携する。

## 公式手順

1. LINE Developers Consoleへログインする。
2. 画面右上のユーザーアイコンを選択する。
3. アカウント情報を選択してプロフィール画面を開く。
4. **Go to Business ID Profile** を選択する。
5. LINE account欄で **Unlinked** の隣にあるリンクアイコンを選択する。
6. 連携対象のLINEアカウントへログインする。
7. ログイン完了後、Business IDとLINEアカウントが連携される。

## 制約と確認事項

- 1つのLINEアカウントに連携できるBusiness IDは1つだけである。
- すでに別のBusiness IDに連携済みのLINEアカウントを選ぶと、「This LINE account is already in use」と表示され、連携できない。
- 連携後、対象Messaging APIチャネルの **Basic settings** に表示される **Your user ID** が、`LINE_TARGET_ID` として必要な値である。
- ドキュメント中の `U...` の例示値、Channel secret、Channel access tokenは使用・転記しない。

## 出典

- LINE Developers, [Log in to the LINE Developers Console](https://developers.line.biz/en/docs/line-developers-console/login-account/)
- LINE Developers, [Get user IDs](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/)
