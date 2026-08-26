# Copilot限定再読取 仕様調査メモ

調査日: 2026-08-26

## 確認できた公式情報

Microsoft 365 Copilot APIsは、独自アプリやカスタムエージェントからMicrosoft 365 Copilotの機能へアクセスするREST APIを提供している。Microsoft Graphの `/v1.0/copilot` または `/beta/copilot` 配下で、OAuth認証とMicrosoft Entra IDのアプリ登録が必要。組織のアクセス制御・条件付きアクセス・権限設定を尊重するが、利用には対象ユーザーごとのMicrosoft 365 CopilotライセンスとMicrosoft 365サブスクリプション（E3/E5または同等）が必要と公式説明にある。

Copilot Studioでは、設定でファイルアップロードを有効にしたエージェントに、JPG/PNG/WebP等の画像やPDFを利用者が添付して解析させられる。ファイル入力対応チャネルにはMicrosoft Teams、カスタムWebサイト、Microsoft 365 Copilot等が含まれる。画像は明瞭で高品質である必要があり、個別ファイルサイズは15MBまでと説明されている。これは「アプリから自動送信」ではなく、Copilot Studio側のエージェント／チャネル構築が必要な方式である。

## yutakaengでの採用方針

WindowsアプリにCopilotのログイン情報や秘密鍵を埋め込まない。標準運用は完全オフラインのままとし、ローカル再補正で警告が残った行だけ「外部支援」ボタンを表示する。ボタンはMicrosoft 365 Copilot APIまたは会社が承認したCopilot Studioエージェントの接続先を後から設定できる抽象化層へ接続する。

送信対象は、利用者がプレビューで確認した主文字・L側・R側のいずれか1セルのみ。PDF全体、他の行、ファイル名、盤番号、周辺ページは送信しない。送信前に範囲画像と対象項目を表示し、明示的な「送信する」操作がなければ通信しない。外部結果は確定値として直接Excelへ入れず、OCR候補として表示し、利用者確認後にのみ反映する。

## 未確定事項

「Copilotが使える」だけではAPI利用可否は確定しない。Microsoft 365 Copilotライセンス、Entra IDアプリ登録、管理者のGraph権限同意、またはCopilot Studioエージェント／チャネルの有無を会社側で確認する必要がある。接続先が未定でも、アプリ内の限定画像選択・プレビュー・送信確認UIと、接続先差し替え可能なインターフェースは先行実装できる。

## 参照

1. https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview
2. https://learn.microsoft.com/en-us/microsoft-copilot-studio/image-input-analysis
