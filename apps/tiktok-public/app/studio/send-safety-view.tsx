export function SendSafetyNotice({gate}:{gate?:{allowed:boolean;code:string}}){
 if(gate?.allowed===true)return null;
 const code=['SANDBOX_SEND_LIMIT','ACCOUNT_DELETION_PENDING'].includes(gate?.code||'')?gate!.code:'SEND_SAFETY_NOT_READY';
 const text=code==='ACCOUNT_DELETION_PENDING'?'削除要求を受け付けました。送信は停止中です。未確定履歴を保護しながら削除を進めます。':code==='SANDBOX_SEND_LIMIT'?'送信承認がないか、未確定の送信があります。追加送信はできません。':'送信の安全性を確認できません。送信は停止しています。';
 return <p role="status" className="notice">{code} — {text}</p>;
}
