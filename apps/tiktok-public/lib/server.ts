import {requestDeletion} from './maintenance';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { AppError,check,identifier,sameOrigin,draftInput,inboxPayload,statusLabel,safeType,LIMITS } from './policy.mjs';
import { now,random,hash,crypt } from './security';
import { safetyContext,ownerSafetyKey,gateFor,reserveAttempt,claimDispatch,saveOutcome,beginDeletion,deletionReady,finishDeletionRows } from './send-safety';
const config=()=>env as unknown as {DB:D1Database,BUCKET:R2Bucket,TIKTOK_CLIENT_KEY?:string,TIKTOK_CLIENT_SECRET?:string,TOKEN_ENCRYPTION_KEY?:string,SITE_ORIGIN?:string,TIKTOK_ENABLED?:string,TIKTOK_MODE?:string,MEDIA_DOMAIN_VERIFIED?:string};
const sql=(q:string,...v:any[])=>config().DB.prepare(q).bind(...v);
const one=(q:string,...v:any[])=>sql(q,...v).first<any>();
const all=async(q:string,...v:any[])=>(await sql(q,...v).all<any>()).results;
const run=(q:string,...v:any[])=>sql(q,...v).run();
const json=(x:unknown,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
function enabled(){const c=config();return !!(c.TIKTOK_ENABLED==='true'&&c.TIKTOK_CLIENT_KEY&&c.TIKTOK_CLIENT_SECRET&&c.TOKEN_ENCRYPTION_KEY&&c.SITE_ORIGIN);}
function gate(){check(enabled(),'TIKTOK_NOT_CONFIGURED',503);}
function origin(request:Request){const o=new URL(request.url).origin;check(!config().SITE_ORIGIN||o===config().SITE_ORIGIN,'HOST_REJECTED',403);return o;}
async function body(request:Request){check(Number(request.headers.get('content-length')||0)<=20000,'REQUEST_TOO_LARGE',413);check(request.body,'INVALID_JSON');const reader=request.body!.getReader(),chunks:Uint8Array[]=[];let size=0;while(true){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>20000){await reader.cancel();throw new AppError('REQUEST_TOO_LARGE',413);}chunks.push(p.value);}const b=new Uint8Array(size);let offset=0;for(const part of chunks){b.set(part,offset);offset+=part.length;}try{return JSON.parse(new TextDecoder().decode(b))}catch{throw new AppError('INVALID_JSON');}}

type ApiStage='BEFORE_API'|'COMMUNICATION_START'|'HTTP_RESPONSE'|'JSON_PARSE'|'D1_SAVE'|'D1_SAVED';
type Diagnose=(stage:ApiStage,httpStatus?:number,outcome?:'FAILED')=>void;
const diagnose:Diagnose=(stage,httpStatus,outcome)=>console.info(JSON.stringify({event:'FIELD_RISE_INBOX_STAGE',stage,...(httpStatus===undefined?{}:{httpStatus}),...(outcome?{outcome}:{})}));
async function saveInboxResult(query:string,...values:any[]){diagnose('D1_SAVE');try{await run(query,...values);diagnose('D1_SAVED');}catch(e){diagnose('D1_SAVE',undefined,'FAILED');throw e;}}
async function tiktok(path:string,token:string,payload?:unknown,trace?:Diagnose){
 const inbox=path==='/v2/post/publish/inbox/video/init/';
 trace?.('BEFORE_API');let r:Response;
 trace?.('COMMUNICATION_START');
 try{r=await fetch('https://open.tiktokapis.com'+path,{method:payload?'POST':'GET',headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,redirect:inbox?'manual':'error',signal:AbortSignal.timeout(20000)});}
 catch(e){trace?.('COMMUNICATION_START',undefined,'FAILED');if(inbox){const name=e&&typeof e==='object'&&'name' in e?e.name:undefined;const category=name==='TimeoutError'?'TIMEOUT':name==='AbortError'?'ABORT':name==='TypeError'?'TYPE_ERROR':'OTHER';console.info(JSON.stringify({event:'FIELD_RISE_INBOX_STAGE',stage:'COMMUNICATION_START',category}));}throw e;}
 trace?.('HTTP_RESPONSE',r.status);if(inbox&&r.status>=300&&r.status<400)throw new AppError('TIKTOK_UNEXPECTED_REDIRECT',502);let d:any;
 try{d=await r.json();trace?.('JSON_PARSE',r.status);}catch(e){trace?.('JSON_PARSE',r.status,'FAILED');throw e;}
 if(!r.ok||d?.error?.code!=='ok')throw new AppError('TIKTOK_'+String(d?.error?.code||'REQUEST_FAILED').replace(/[^a-zA-Z0-9_]/g,''),502);return d.data;
}
const PREFLIGHT_SHA='2e200e8634de51bf1ae2116dce07d39e4914351596b4b22e9b615cf6bf1a98ee';
async function verifyTransferUrl(url:string){
 let r:Response;
 try{r=await fetch(url,{method:'GET',credentials:'omit',redirect:'manual',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});}catch{throw new AppError('TRANSFER_MEDIA_FETCH_FAILED',502);}
 check(r.status===200&&!r.redirected,'TRANSFER_MEDIA_HTTP_FAILED',502);
 // Received body bytes are authoritative; transfer framing may omit Content-Length.
 check(r.body,'TRANSFER_MEDIA_FETCH_FAILED',502);
 const reader=r.body!.getReader(),parts:Uint8Array[]=[];let total=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.byteLength;if(total>2971884){await reader.cancel();throw new AppError('TRANSFER_MEDIA_SIZE_MISMATCH',502);}parts.push(chunk.value);}}
 catch(e){if(e instanceof AppError)throw e;throw new AppError('TRANSFER_MEDIA_FETCH_FAILED',502);}
 if(total!==2971884){console.warn(JSON.stringify({event:'FIELD_RISE_TRANSFER_SIZE_FAILURE',stage:'BODY',receivedBytes:total,expectedBytes:2971884}));throw new AppError('TRANSFER_MEDIA_SIZE_MISMATCH',502);}
 const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 check(digest===PREFLIGHT_SHA,'TRANSFER_MEDIA_HASH_MISMATCH',502);
 return {sha256:digest,size:bytes.byteLength,httpStatus:200,lengthHeaderPresent:r.headers.has('content-length')};
}
async function mediaSignature(token:string,lease:any){
 const secret=config().TOKEN_ENCRYPTION_KEY!;check(/^[a-f0-9]{64}$/.test(secret),'ENCRYPTION_NOT_CONFIGURED',503);
 const material=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('FieldRise-media-preflight-v1:'+secret));
 const key=await crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const data=new TextEncoder().encode(JSON.stringify([token,lease.owner,lease.asset_id,lease.expires]));
 return {key,data};
}
async function userInfo(token:string){
 const fail=(category:string,status?:number):never=>{
  console.warn(JSON.stringify({event:'FIELD_RISE_USER_INFO_FAILURE',category,...(status===undefined?{}:{httpStatus:status})}));
  throw new AppError('TIKTOK_USER_INFO_'+category+(status===undefined?'':'_'+status),502);
 };
 let r:Response;
 try{r=await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url',{method:'GET',headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(20000)});}
 catch(e){return fail(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError')?'TIMEOUT':'TRANSPORT_ERROR');}
 if(r.status>=300&&r.status<400)return fail('UNEXPECTED_REDIRECT',r.status);
 let d:any;try{d=await r.json();}catch{return fail('NON_JSON',r.status);}
 if(!d||typeof d!=='object')return fail('INVALID_RESPONSE',r.status);
 if(!r.ok||d.error?.code!=='ok'){
  const codes:Record<string,string>={access_token_invalid:'ACCESS_TOKEN_INVALID',scope_not_authorized:'SCOPE_NOT_AUTHORIZED',invalid_params:'INVALID_PARAMS',invalid_param:'INVALID_PARAM',rate_limit_exceeded:'RATE_LIMIT_EXCEEDED',internal_error:'INTERNAL_ERROR'};
  return fail(typeof d.error?.code==='string'?(codes[d.error.code]||'API_ERROR'):'HTTP_ERROR',r.status);
 }
 const u=d.data?.user;
 if(!u||typeof u.open_id!=='string'||typeof u.display_name!=='string'||typeof u.avatar_url!=='string')return fail('INVALID_RESPONSE',r.status);
 return {user:{open_id:u.open_id,display_name:u.display_name,avatar_url:u.avatar_url}};
}
async function exchange(values:Record<string,string>){
 const c=config();
 const fail=(category:string,status?:number):never=>{
  console.warn(JSON.stringify({event:'FIELD_RISE_TOKEN_EXCHANGE_FAILURE',category,...(status===undefined?{}:{httpStatus:status})}));
  throw new AppError('TIKTOK_TOKEN_'+category+(status===undefined?'':'_'+status),502);
 };
 let r:Response;
 try{r=await fetch('https://open.tiktokapis.com/v2/oauth/token/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_key:c.TIKTOK_CLIENT_KEY!,client_secret:c.TIKTOK_CLIENT_SECRET!,...values}).toString(),redirect:'manual',signal:AbortSignal.timeout(20000)});}
 catch(e){return fail(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError')?'TIMEOUT':'TRANSPORT_ERROR');}
 if(r.status>=300&&r.status<400)return fail('UNEXPECTED_REDIRECT',r.status);
 let d:any;
 try{d=await r.json();}catch{return fail('NON_JSON',r.status);}
 if(!d||typeof d!=='object')return fail('INVALID_RESPONSE',r.status);
 if(!r.ok||d.error){
  const allowed:Record<string,string>={invalid_client:'INVALID_CLIENT',invalid_request:'INVALID_REQUEST',invalid_grant:'INVALID_GRANT',unauthorized_client:'UNAUTHORIZED_CLIENT',unsupported_grant_type:'UNSUPPORTED_GRANT_TYPE',invalid_scope:'INVALID_SCOPE',server_error:'SERVER_ERROR',temporarily_unavailable:'TEMPORARILY_UNAVAILABLE',access_denied:'ACCESS_DENIED'};
  return fail(typeof d.error==='string'?(allowed[d.error]||'API_ERROR'):'HTTP_ERROR',r.status);
 }
 if(!(typeof d.access_token==='string'&&typeof d.refresh_token==='string'&&typeof d.open_id==='string'&&Number.isFinite(d.expires_in)&&d.expires_in>0))return fail('INVALID_RESPONSE',r.status);
 return d;
}
async function connection(owner:string){gate();const c=await one('SELECT * FROM connections WHERE owner=?',owner);check(c,'TIKTOK_NOT_CONNECTED',409);check(c.scopes.split(',').includes('video.upload'),'UPLOAD_PERMISSION_REQUIRED',403);let secrets=JSON.parse(await crypt(c.secret,config().TOKEN_ENCRYPTION_KEY!,owner,true));if(c.expires<now()+120){
 const lock=now()+30;const a=await run('UPDATE connections SET lock=? WHERE owner=? AND lock<?',lock,owner,now());check(a.meta.changes===1,'TOKEN_REFRESH_BUSY',409);
 try{const n=await exchange({grant_type:'refresh_token',refresh_token:secrets.refresh_token});check(n.open_id===c.open_id,'ACCOUNT_MISMATCH',403);check((n.scope||c.scopes).split(',').includes('video.upload'),'UPLOAD_PERMISSION_REQUIRED',403);secrets={access_token:n.access_token,refresh_token:n.refresh_token};await run('UPDATE connections SET secret=?,expires=?,scopes=?,lock=0 WHERE owner=?',await crypt(JSON.stringify(secrets),config().TOKEN_ENCRYPTION_KEY!,owner),now()+n.expires_in,n.scope||c.scopes,owner);}finally{await run('UPDATE connections SET lock=0 WHERE owner=? AND lock=?',owner,lock);}
 }return {...c,token:secrets.access_token};}
async function assetList(owner:string,ids:string[],kind:string){const items=[];for(const id of ids){const a=await one('SELECT * FROM assets WHERE owner=? AND id=? AND ready=1',owner,id);check(a,'ASSET_NOT_FOUND',404);check(a.type===(kind==='PHOTO'?'image/jpeg':'video/mp4'),'ASSET_TYPE_MISMATCH');items.push(a);}return items;}
async function ownerSafety(owner:string){const c=await one('SELECT open_id FROM connections WHERE owner=?',owner);return safetyContext(config(),owner,c?.open_id||'unconnected');}
async function sendGate(owner:string){try{return await gateFor(config().DB,await ownerSafety(owner),undefined,now());}catch{return {allowed:false,code:'SEND_SAFETY_NOT_READY'}}}
async function removeAccount(owner:string){
 let context=null;try{context=await ownerSafety(owner)}catch{}
 return requestDeletion(config().DB,owner,context,now());
}
export async function handle(request:Request,path:string[]){
 const diagnostic={stage:'SESSION'};
 try{return await dispatch(request,path,diagnostic)}catch(e){
  if(path.join('/')==='tiktok/callback'&&!(e instanceof AppError)){
   // Fixed labels only. Never log the exception, request, URL, headers or response body.
   console.warn(JSON.stringify({event:'FIELD_RISE_CALLBACK_FAILURE',stage:diagnostic.stage}));
   return json({error:'OAUTH_CALLBACK_FAILED',stage:diagnostic.stage},500);
  }
  return json({error:e instanceof AppError?e.message:'SERVER_ERROR'},e instanceof AppError?e.status:500);
 }
}
async function dispatch(request:Request,path:string[],diagnostic:{stage:string}){
 const route=path.join('/'),method=request.method;const url=new URL(request.url);const siteOrigin=origin(request);
 if(route==='health')return json({service:'FieldRise Creator Studio',tiktok:enabled(),mode:config().TIKTOK_MODE||'unconfigured'});
 // Signed, narrowly scoped test-media route; no OAuth or TikTok calls.
 if(path[0]==='media'&&path[1]==='preflight-pull'&&method==='GET'){
  const token=identifier(path[2]),signature=identifier(path[3]);
  check(/^[a-f0-9]{64}$/.test(token)&&/^[a-f0-9]{64}$/.test(signature),'MEDIA_EXPIRED',404);
  const lease=await one("SELECT l.* FROM leases l JOIN profiles p ON p.owner=l.owner JOIN assets a ON a.owner=l.owner AND a.id=l.asset_id WHERE l.hash=? AND l.job_id='preflight' AND l.expires>? AND p.deleting=0 AND a.ready=1",await hash(token),now());
  check(lease,'MEDIA_EXPIRED',404);const m=await mediaSignature(token,lease);
  check(await crypto.subtle.verify('HMAC',m.key,new Uint8Array(signature.match(/../g)!.map((x:string)=>parseInt(x,16))),m.data),'MEDIA_EXPIRED',404);
  const obj=await config().BUCKET.get(lease.owner+'/'+lease.asset_id);check(obj&&obj.size===2971884,'MEDIA_NOT_FOUND',404);
  return new Response(obj!.body,{headers:{'Content-Type':'video/mp4','Content-Length':String(obj!.size),'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }
 // Capability URLs: read-only, time limited; never allow an arbitrary external URL.
 if(path[0]==='media'&&path[1]==='pull'&&method==='GET'){
 const key=identifier(path[2]);const a=await one('SELECT a.*,l.expires FROM leases l JOIN assets a ON a.id=l.asset_id AND a.owner=l.owner JOIN profiles p ON p.owner=a.owner WHERE l.hash=? AND l.expires>? AND a.ready=1 AND p.deleting=0',await hash(key),now());check(a,'MEDIA_EXPIRED',404);const obj=await config().BUCKET.get(a.owner+'/'+a.id);check(obj,'MEDIA_NOT_FOUND',404);return new Response(obj!.body,{headers:{'Content-Type':a.type,'Content-Length':String(obj!.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 }
 const user=await getChatGPTUser();check(user,'SIGN_IN_REQUIRED',401);const owner=user!.userId;
 if(!['GET','HEAD'].includes(method))sameOrigin(request);
 diagnostic.stage='PROFILE_LOOKUP';const profile=await one('SELECT * FROM profiles WHERE owner=?',owner);
 if(route==='me'&&method==='GET'){const conn=await one('SELECT name,avatar,scopes FROM connections WHERE owner=?',owner);return json({registered:!!profile,deleting:!!profile?.deleting,user:{name:user!.displayName},connection:conn,tiktokEnabled:enabled(),mediaVerified:config().MEDIA_DOMAIN_VERIFIED==='true',mode:config().TIKTOK_MODE||'unconfigured',sendGate:await sendGate(owner)});}
 if(route==='register'&&method==='POST'){check(!await one("SELECT 1 FROM deletion_tasks WHERE owner=? AND state<>'COMPLETE'",owner),'ACCOUNT_DELETION_PENDING',409);const b=await body(request);check(b.consent===true,'CONSENT_REQUIRED');await run('INSERT OR IGNORE INTO profiles(owner,accepted) VALUES(?,?)',owner,now());return json({registered:true});}
 if(route==='account'&&method==='DELETE'){check(profile,'REGISTER_FIRST',403);const result=await removeAccount(owner);return json(result,result.deleted?200:202);}
 check(profile&&!profile.deleting,'REGISTER_FIRST',403);
 if(route==='media/preflight'&&method==='POST'){
  const b=await body(request);check(b.consent===true,'CONSENT_REQUIRED');
  check(config().TIKTOK_MODE==='sandbox','SANDBOX_REQUIRED',403);
  const assetId=identifier(b.assetId);const a=await one('SELECT * FROM assets WHERE owner=? AND id=? AND ready=1',owner,assetId);check(a,'ASSET_NOT_FOUND',404);
  check(a.type==='video/mp4'&&a.size===2971884,'PREFLIGHT_FILE_MISMATCH');
  const obj=await config().BUCKET.get(owner+'/'+assetId);check(obj,'ASSET_NOT_FOUND',404);
  const bytes=await obj!.arrayBuffer();const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');check(sha===PREFLIGHT_SHA,'PREFLIGHT_FILE_MISMATCH');
  await run("DELETE FROM leases WHERE owner=? AND job_id='preflight'",owner);
  const token=random(),expires=now()+90,lease={owner,asset_id:assetId,expires};const m=await mediaSignature(token,lease);
  const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',m.key,m.data)),v=>v.toString(16).padStart(2,'0')).join('');
  await run("INSERT INTO leases(hash,owner,asset_id,job_id,expires) VALUES(?,?,?,'preflight',?)",await hash(token),owner,assetId,expires);
  return json({url:siteOrigin+'/api/media/preflight-pull/'+token+'/'+signature,sha256:sha,size:bytes.byteLength,expires,ttl:90});
 }
 if(route==='drafts'&&method==='GET')return json(await all('SELECT id,body,revision,updated FROM drafts WHERE owner=? ORDER BY updated DESC',owner));
 if(route==='drafts'&&method==='POST'){const d=draftInput(await body(request));await assetList(owner,d.assets,d.kind);const id=crypto.randomUUID();const a=await run('INSERT INTO drafts(id,owner,body,updated) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM drafts WHERE owner=?)<?',id,owner,JSON.stringify(d),now(),owner,LIMITS.drafts);check(a.meta.changes===1,'DRAFT_LIMIT',429);return json({id,revision:1});}
 if(path[0]==='drafts'&&path.length===2){const id=identifier(path[1]);const d=await one('SELECT * FROM drafts WHERE owner=? AND id=?',owner,id);check(d,'DRAFT_NOT_FOUND',404);if(method==='DELETE'){await run('DELETE FROM drafts WHERE owner=? AND id=?',owner,id);return json({deleted:true});}if(method==='PUT'){const b=await body(request),v=draftInput(b);await assetList(owner,v.assets,v.kind);const r=await run('UPDATE drafts SET body=?,revision=revision+1,updated=? WHERE owner=? AND id=? AND revision=?',JSON.stringify(v),now(),owner,id,b.revision);check(r.meta.changes===1,'DRAFT_CHANGED_RELOAD',409);return json({id,revision:d.revision+1});}}
 if(route==='assets'&&method==='GET')return json(await all('SELECT id,size,type,ready FROM assets WHERE owner=? AND ready>=0',owner));
 if(route==='assets'&&method==='POST'){
 const type=request.headers.get('content-type')||'',size=Number(request.headers.get('content-length'));check(['image/jpeg','video/mp4'].includes(type),'UNSUPPORTED_MEDIA');check(Number.isSafeInteger(size)&&size>=12&&size<=(type==='image/jpeg'?LIMITS.photoBytes:LIMITS.videoBytes),'MEDIA_SIZE_LIMIT');check(request.body,'EMPTY_MEDIA');const id=crypto.randomUUID();
 const reserved=await run('INSERT INTO assets(id,owner,size,type,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM profiles WHERE owner=? AND deleting=0) AND (SELECT COALESCE(SUM(size),0) FROM assets WHERE owner=?)+?<=? AND (SELECT COALESCE(SUM(size),0) FROM assets)+?<=?',id,owner,size,type,now(),owner,owner,size,LIMITS.userBytes,size,LIMITS.globalBytes);check(reserved.meta.changes===1,'STORAGE_LIMIT',429);
 try{
 const reader=request.body!.getReader();const first=await reader.read();check(first.value&&safeType(first.value,type),'INVALID_MEDIA_SIGNATURE');
 // FixedLengthStream enforces the declared size without buffering the MP4 in memory.
 const stream=new FixedLengthStream(size);const writer=stream.writable.getWriter();const pump=(async()=>{try{await writer.write(first.value!);while(true){const part=await reader.read();if(part.done)break;await writer.write(part.value);}await writer.close();}catch(e){await writer.abort(e);throw e;}})();
 let uploadTimer:ReturnType<typeof setTimeout>;const deadline=new Promise<never>((_,reject)=>{uploadTimer=setTimeout(()=>{void reader.cancel().catch(()=>{});void writer.abort().catch(()=>{});reject(new AppError('UPLOAD_TIMEOUT',408));},600000)});try{await Promise.race([Promise.all([config().BUCKET.put(owner+'/'+id,stream.readable,{httpMetadata:{contentType:type}}),pump]),deadline]);}finally{clearTimeout(uploadTimer!);}const finished=await run('UPDATE assets SET ready=1 WHERE owner=? AND id=? AND ready=0 AND EXISTS(SELECT 1 FROM profiles WHERE owner=? AND deleting=0)',owner,id,owner);check(finished.meta.changes===1,'ACCOUNT_DELETED',409);return json({id,type,size});
 }catch(e){await config().BUCKET.delete(owner+'/'+id);await run('DELETE FROM assets WHERE owner=? AND id=? AND ready=0',owner,id);throw e;}
 }
 if(path[0]==='assets'&&path.length===2){const id=identifier(path[1]);const a=await one('SELECT * FROM assets WHERE owner=? AND id=? AND ready=1',owner,id);check(a,'ASSET_NOT_FOUND',404);if(method==='DELETE'){const inUse=(await all('SELECT body FROM drafts WHERE owner=?',owner)).some(d=>JSON.parse(d.body).assets.includes(id));check(!inUse,'ASSET_USED_BY_DRAFT',409);check(!await one('SELECT hash FROM leases WHERE owner=? AND asset_id=? AND expires>?',owner,id,now()),'ASSET_IN_TRANSFER',409);await config().BUCKET.delete(owner+'/'+id);await run('DELETE FROM assets WHERE owner=? AND id=?',owner,id);return json({deleted:true});}if(method==='GET'){const o=await config().BUCKET.get(owner+'/'+id);check(o,'ASSET_NOT_FOUND',404);return new Response(o!.body,{headers:{'Content-Type':a.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}}
 if(route==='tiktok/connect'&&method==='POST'){
 gate();const state=random();await run('DELETE FROM states WHERE owner=? OR expires<?',owner,now());await run('INSERT INTO states(hash,owner,expires) VALUES(?,?,?)',await hash(state),owner,now()+600);const u=new URL('https://www.tiktok.com/v2/auth/authorize/');u.search=new URLSearchParams({client_key:config().TIKTOK_CLIENT_KEY!,scope:'user.info.basic,video.upload',response_type:'code',redirect_uri:siteOrigin+'/api/tiktok/callback',state,disable_auto_auth:'1'}).toString();const res=json({url:u.href});res.headers.set('Set-Cookie',`fr_oauth=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/tiktok; Max-Age=600`);return res;
 }
 if(route==='tiktok/callback'&&method==='GET'){
 diagnostic.stage='STATE_VALIDATION';gate();const state=url.searchParams.get('state')||'';const cookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('fr_oauth='))?.slice(9);check(state.length===64&&cookie===state,'OAUTH_STATE_MISMATCH',403);diagnostic.stage='STATE_CONSUME';const consumed=await sql('DELETE FROM states WHERE hash=? AND owner=? AND expires>? RETURNING owner,expires',await hash(state),owner,now()).first<{owner:string;expires:number}>();check(consumed,'OAUTH_STATE_EXPIRED',403);check(!url.searchParams.get('error'),'OAUTH_DECLINED');const code=url.searchParams.get('code');check(code,'OAUTH_CODE_MISSING');diagnostic.stage='TOKEN_EXCHANGE';const token=await exchange({grant_type:'authorization_code',code:code!,redirect_uri:siteOrigin+'/api/tiktok/callback'});diagnostic.stage='SCOPE_VALIDATION';check(token.scope?.split(',').includes('user.info.basic')&&token.scope?.split(',').includes('video.upload'),'UPLOAD_PERMISSION_REQUIRED',403);diagnostic.stage='ACCOUNT_LOOKUP';const taken=await one('SELECT owner FROM connections WHERE open_id=?',token.open_id);check(!taken||taken.owner===owner,'TIKTOK_ACCOUNT_ALREADY_CONNECTED',409);diagnostic.stage='USER_INFO';const info=await userInfo(token.access_token);check(info.user?.open_id===token.open_id,'ACCOUNT_MISMATCH',403);diagnostic.stage='ENCRYPTION';const encrypted=await crypt(JSON.stringify({access_token:token.access_token,refresh_token:token.refresh_token}),config().TOKEN_ENCRYPTION_KEY!,owner);diagnostic.stage='CONNECTION_SAVE';check(consumed!.expires>now(),'OAUTH_STATE_EXPIRED',403);const ownerKey=await ownerSafetyKey(config().TOKEN_ENCRYPTION_KEY!,owner);const saved=await run('INSERT INTO connections(owner,open_id,secret,name,avatar,scopes,expires) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM profiles WHERE owner=? AND deleting=0 AND accepted=?) AND NOT EXISTS(SELECT 1 FROM deletion_tasks WHERE owner=? AND requested_at>=?) AND NOT EXISTS(SELECT 1 FROM delete_requests WHERE owner_key=? AND requested_at>=?) ON CONFLICT(owner) DO UPDATE SET open_id=excluded.open_id,secret=excluded.secret,name=excluded.name,avatar=excluded.avatar,scopes=excluded.scopes,expires=excluded.expires',owner,token.open_id,encrypted,info.user.display_name,info.user.avatar_url,token.scope,now()+token.expires_in,owner,profile.accepted,owner,consumed!.expires-600,ownerKey,consumed!.expires-600);check(saved.meta.changes===1,'ACCOUNT_DELETION_PENDING',409);return new Response(null,{status:303,headers:{Location:siteOrigin+'/studio?connected=1','Set-Cookie':'fr_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/api/tiktok; Max-Age=0','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }
 if(route==='tiktok/disconnect'&&method==='POST'){await run('DELETE FROM connections WHERE owner=?',owner);return json({disconnected:true});}
 if(route==='tiktok/prepare-inbox'&&method==='POST'){
  gate();check(config().TIKTOK_MODE==='sandbox','SANDBOX_REQUIRED',403);check(config().MEDIA_DOMAIN_VERIFIED==='true','MEDIA_DOMAIN_NOT_VERIFIED',503);
  const b=await body(request);check(b.consent===true,'CONSENT_REQUIRED');const dr=await one('SELECT * FROM drafts WHERE owner=? AND id=?',owner,identifier(b.draftId));check(dr,'DRAFT_NOT_FOUND',404);check(dr.revision===b.revision,'DRAFT_CHANGED_RELOAD',409);
  const d=draftInput(JSON.parse(dr.body));check(d.kind==='VIDEO'&&d.assets.length===1,'APPROVED_VIDEO_REQUIRED');await assetList(owner,d.assets,'VIDEO');
  const c=await one('SELECT open_id,name,scopes FROM connections WHERE owner=?',owner);check(c&&c.name==='Runa-Girl8215','APPROVED_SANDBOX_ACCOUNT_REQUIRED',403);check(c.scopes.split(',').includes('video.upload')&&c.scopes.split(',').includes('user.info.basic'),'UPLOAD_PERMISSION_REQUIRED',403);
  const sg=await gateFor(config().DB,await ownerSafety(owner),PREFLIGHT_SHA,now());check(sg.allowed,sg.code,409);
  const a=await one('SELECT size FROM assets WHERE owner=? AND id=?',owner,d.assets[0]);check(a.size===2971884,'APPROVED_VIDEO_REQUIRED');const original=await config().BUCKET.get(owner+'/'+d.assets[0]);check(original&&original.size===2971884,'APPROVED_VIDEO_REQUIRED');const raw=await original!.arrayBuffer();const originalHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');check(originalHash===PREFLIGHT_SHA,'APPROVED_VIDEO_REQUIRED');
  const key=random(),expires=now()+7200;const tag='ready:'+JSON.stringify([dr.id,dr.revision,c.open_id]);
  await run("DELETE FROM leases WHERE owner=? AND job_id LIKE 'ready:%'",owner);
  await run('INSERT INTO leases(hash,owner,asset_id,job_id,expires) VALUES(?,?,?,?,?)',await hash(key),owner,d.assets[0],tag,expires);
  try{const result=await verifyTransferUrl(siteOrigin+'/api/media/pull/'+key);return json({verified:true,transferKey:key,...result,expires,account:c.name,mode:'sandbox',mediaVerified:true});}
  catch(e){await run('DELETE FROM leases WHERE hash=? AND owner=?',await hash(key),owner);throw e;}
 }
 if(route==='jobs'&&method==='GET')return json(await all('SELECT id,draft_id,state,error,created FROM jobs WHERE owner=? ORDER BY created DESC LIMIT 100',owner));
 if(route==='jobs'&&method==='POST'){
 gate();check(config().TIKTOK_MODE==='sandbox','SEND_SAFETY_NOT_READY',403);check(config().MEDIA_DOMAIN_VERIFIED==='true','MEDIA_DOMAIN_NOT_VERIFIED',503);
 const b=await body(request);check(b.consent===true,'CONSENT_REQUIRED');check(b.confirmSend===true,'EXPLICIT_SEND_CONFIRMATION_REQUIRED',403);const requestKey=identifier(b.requestKey);
 const draft=await one('SELECT * FROM drafts WHERE owner=? AND id=?',owner,identifier(b.draftId));check(draft,'DRAFT_NOT_FOUND',404);check(draft.revision===b.revision,'DRAFT_CHANGED_RELOAD',409);
 const d=draftInput(JSON.parse(draft.body));check(d.kind==='VIDEO'&&d.assets.length===1,'APPROVED_VIDEO_REQUIRED',403);await assetList(owner,d.assets,'VIDEO');
 const current=await one('SELECT open_id,name,scopes FROM connections WHERE owner=?',owner);check(current&&current.name==='Runa-Girl8215','APPROVED_SANDBOX_ACCOUNT_REQUIRED',403);check(current.scopes.split(',').includes('video.upload')&&current.scopes.split(',').includes('user.info.basic'),'UPLOAD_PERMISSION_REQUIRED',403);
 const context=await safetyContext(config(),owner,current.open_id);
 // Replay is handled by the safety boundary before lease revalidation. It never performs another fetch.
 const key=identifier(b.transferKey);check(/^[a-f0-9]{64}$/.test(key),'TRANSFER_PREPARATION_REQUIRED',403);const leaseHash=await hash(key);
 const attemptInput={jobId:crypto.randomUUID(),requestKey,payload:d,draftId:draft.id,revision:draft.revision,assetId:d.assets[0],leaseHash,mediaSha:PREFLIGHT_SHA,now:now()};
 // A same-key replay may be resolved without refresh, URL fetch, or content API traffic.
 const replay=await one('SELECT id FROM jobs WHERE owner=? AND request_key=?',owner,requestKey);
 if(replay){const a=await reserveAttempt(config().DB,context,attemptInput);const row=await one('SELECT id,state,error FROM jobs WHERE owner=? AND id=?',owner,a.id);return json(row||{state:'STATUS_UNKNOWN',error:'CHECK_INBOX_BEFORE_RETRY'});}
 const sg=await gateFor(config().DB,context,PREFLIGHT_SHA,now());check(sg.allowed,sg.code,409);
 const lease=await one('SELECT * FROM leases WHERE hash=? AND owner=? AND asset_id=? AND expires>?',leaseHash,owner,d.assets[0],now()+3600);check(lease&&lease.job_id==='ready:'+JSON.stringify([draft.id,draft.revision,current.open_id]),'TRANSFER_PREPARATION_REQUIRED',403);
 const preparedUrl=siteOrigin+'/api/media/pull/'+key;await verifyTransferUrl(preparedUrl);
 const c=await connection(owner);check(c.open_id===current.open_id,'ACCOUNT_MISMATCH',403);
 const a=await reserveAttempt(config().DB,context,{...attemptInput,now:now()});if(a.replay){const row=await one('SELECT id,state,error FROM jobs WHERE owner=? AND id=?',owner,a.id);return json(row||{state:'STATUS_UNKNOWN'});}
 check(await claimDispatch(config().DB,context,a.id,now()),'SEND_DISPATCH_BLOCKED',409);
 try{const result=await tiktok('/v2/post/publish/inbox/video/init/',c.token,inboxPayload(d,[preparedUrl]),diagnose);check(typeof result?.publish_id==='string','TIKTOK_MISSING_PUBLISH_ID',502);
 diagnose('D1_SAVE');await saveOutcome(config().DB,context,a.id,'PENDING','',result.publish_id,now());diagnose('D1_SAVED');return json({id:a.id,state:'PROCESSING'});
 }catch(e){if(e instanceof AppError&&e.message==='SEND_RESULT_SAVE_FAILED')diagnose('D1_SAVE',undefined,'FAILED');const definitive=e instanceof AppError&&/^TIKTOK_(invalid_param|scope_not_authorized|url_ownership_unverified|access_token_invalid|spam_risk_|rate_limit_exceeded)/.test(e.message);const state=definitive?'FAILED':'STATUS_UNKNOWN';const error=e instanceof AppError?e.message:'NETWORK_RESULT_UNKNOWN';
 diagnose('D1_SAVE');try{await saveOutcome(config().DB,context,a.id,definitive?'DEFINITIVE_REJECT':'UNKNOWN',error,null,now());diagnose('D1_SAVED');}catch{diagnose('D1_SAVE',undefined,'FAILED');return json({id:a.id,state:'STATUS_UNKNOWN',error:'SEND_RESULT_SAVE_FAILED'},502)}
 return json({id:a.id,state,error},502);}
 }
 if(path[0]==='jobs'&&path.length===2&&method==='POST'){
 const id=identifier(path[1]);const j=await one('SELECT * FROM jobs WHERE owner=? AND id=?',owner,id);check(j,'JOB_NOT_FOUND',404);check(j.publish_id,'CHECK_INBOX_BEFORE_RETRY',409);const c=await connection(owner);check(c.open_id===j.open_id,'ORIGINAL_TIKTOK_ACCOUNT_REQUIRED',409);const throttle=await run('UPDATE jobs SET checked=? WHERE owner=? AND id=? AND checked<?',now(),owner,id,now()-10);check(throttle.meta.changes===1,'STATUS_RATE_LIMIT',429);const data=await tiktok('/v2/post/publish/status/fetch/',c.token,{publish_id:j.publish_id});const state=statusLabel(data.status);await run('UPDATE jobs SET state=?,error=? WHERE owner=? AND id=?',state,state==='FAILED'?String(data.fail_reason||'TIKTOK_FAILED').slice(0,100):null,owner,id);return json({id,state});
 }
 throw new AppError('NOT_FOUND',404);
}

