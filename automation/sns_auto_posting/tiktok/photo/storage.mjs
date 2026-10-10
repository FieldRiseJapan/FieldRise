// Optimistic revision check: never replace a value changed since this tab read it.
export function protectedStorage(storage,key,validate){
 let baseline=null,blocked=false,reason='',failed=false;
 function read(){try{const raw=(storage.getItem(key)??null);if(raw!==null)validate(JSON.parse(raw));baseline=raw;blocked=false;failed=false;reason='';return {ok:true,raw};}catch(e){blocked=true;failed=true;reason=e instanceof SyntaxError?'JSON形式が不正':e?.name==='SecurityError'?'保存領域へのアクセスが拒否':'データ形式・バージョンまたは保存領域を確認できません';return {ok:false,reason};}}
 function write(value){if(blocked)return {ok:false,message:'保存保護中：'+reason+'。上書きせず、元データを退避してください'};try{if((storage.getItem(key)??null)!==baseline){blocked=true;reason='別タブまたは外部操作で保存データが変更されました';return {ok:false,message:'保存保護中：'+reason+'。画面の変更をJSONで退避し、再読み込みしてください'};}const raw=JSON.stringify(validate(value));storage.setItem(key,raw);baseline=raw;failed=false;return {ok:true,message:'端末保存済み'};}catch{failed=true;return {ok:false,message:'端末保存失敗：既存データは保持されています。保存操作を再試行してください'};}}
 return {read,write,block:message=>{blocked=true;reason=message;},state:()=>({blocked,failed,reason}),changed:()=>{try{return (storage.getItem(key)??null)!==baseline;}catch{return true;}}};
}
