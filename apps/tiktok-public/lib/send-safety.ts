import {AppError} from './policy.mjs';
export type SafetyContext={owner:string;ownerKey:string;accountKey:string;appScope:string;mode:string;keyVersion:number;openId:string};
export type ReserveInput={jobId:string;requestKey:string;payload:unknown;draftId:string;revision:number;assetId:string;leaseHash:string;mediaSha:string;now:number};
const DAY=86400;
const stmt=(db:D1Database,q:string,...v:any[])=>db.prepare(q).bind(...v);
const first=(db:D1Database,q:string,...v:any[])=>stmt(db,q,...v).first<any>();
function reject(code='SANDBOX_SEND_LIMIT'):never{throw new AppError(code,409)}
const unresolved="('RESERVED','DISPATCH_STARTED','UNKNOWN','PENDING')";
function valid(c:SafetyContext){if(c.mode!=='sandbox'||c.keyVersion!==1||!c.owner||!c.openId||!c.appScope||!/^[a-f0-9]{64}$/.test(c.ownerKey)||!/^[a-f0-9]{64}$/.test(c.accountKey))reject('SEND_SAFETY_NOT_READY');}
async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');}
function canonical(x:any):string{if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
async function safetyMac(secret:string,label:string,value:string){
 if(!/^[a-f0-9]{64}$/.test(secret||''))reject('SEND_SAFETY_NOT_READY');
 const material=new Uint8Array(secret.match(/../g)!.map(h=>parseInt(h,16)));const base=await crypto.subtle.importKey('raw',material,'HKDF',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new TextEncoder().encode('FieldRise-send-safety-v1'),info:new TextEncoder().encode(label)},base,{name:'HMAC',hash:'SHA-256',length:256},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
}
export const ownerSafetyKey=(secret:string,owner:string)=>safetyMac(secret,'owner',owner);
export async function safetyContext(env:{TOKEN_ENCRYPTION_KEY?:string;TIKTOK_CLIENT_KEY?:string;TIKTOK_MODE?:string},owner:string,openId:string):Promise<SafetyContext>{
 if(!env.TIKTOK_CLIENT_KEY||env.TIKTOK_MODE!=='sandbox')reject('SEND_SAFETY_NOT_READY');const scope=await digest('sandbox:7695356222514235410:'+env.TIKTOK_CLIENT_KEY);
 const c={owner,openId,ownerKey:await ownerSafetyKey(env.TOKEN_ENCRYPTION_KEY!,owner),accountKey:await safetyMac(env.TOKEN_ENCRYPTION_KEY!,'account',scope+':'+openId),appScope:scope,mode:'sandbox',keyVersion:1};valid(c);return c;
}
export async function gateFor(db:D1Database,c:SafetyContext,mediaSha:string|undefined,now:number){
 try{valid(c);const control=await first(db,'SELECT halted,schema_version FROM send_control WHERE environment=? AND app_scope=?','sandbox',c.appScope);if(!control||control.halted!==0||control.schema_version!==1)return {allowed:false,code:'SEND_SAFETY_NOT_READY'};
 if(await first(db,"SELECT 1 FROM delete_requests WHERE owner_key=? AND state IN ('QUEUED','DELETING')",c.ownerKey))return {allowed:false,code:'ACCOUNT_DELETION_PENDING'};
 if(await first(db,`SELECT 1 FROM send_attempts WHERE environment='sandbox' AND app_scope=? AND account_key=? AND state IN ${unresolved}`,c.appScope,c.accountKey)||await first(db,"SELECT 1 FROM jobs WHERE open_id=? AND state IN ('INITIALIZING','PROCESSING','STATUS_UNKNOWN')",c.openId))return {allowed:false,code:'SANDBOX_SEND_LIMIT'};
 const grant=await first(db,"SELECT 1 FROM send_grants WHERE environment='sandbox' AND app_scope=? AND owner_key=? AND account_key=? AND key_version=1 AND state='AVAILABLE' AND issued_at<=? AND expires_at>? AND (? IS NULL OR media_sha256=?)",c.appScope,c.ownerKey,c.accountKey,now,now,mediaSha??null,mediaSha??null);
 return {allowed:!!grant,code:grant?'READY':'SANDBOX_SEND_LIMIT'};
 }catch{return {allowed:false,code:'SEND_SAFETY_NOT_READY'}}
}
export async function reserveAttempt(db:D1Database,c:SafetyContext,i:ReserveInput){
 valid(c);if(!i.requestKey||i.requestKey.length>100||!/^[a-f0-9]{64}$/.test(i.mediaSha))reject('INVALID_SEND_REQUEST');
 const requestHash=await digest(c.ownerKey+':'+i.requestKey);const payloadHash=await digest(canonical({account:c.accountKey,scope:c.appScope,kind:'VIDEO',media:i.mediaSha,draft:i.draftId,revision:i.revision,payload:i.payload,consentVersion:1}));
 try{
 const old=await first(db,"SELECT attempt_id,payload_hash FROM send_attempts WHERE environment='sandbox' AND app_scope=? AND owner_key=? AND request_key_hash=?",c.appScope,c.ownerKey,requestHash);
 if(old){if(old.payload_hash!==payloadHash)reject('IDEMPOTENCY_CONFLICT');return {id:old.attempt_id,replay:true};}
 const gate=await gateFor(db,c,i.mediaSha,i.now);if(!gate.allowed)reject(gate.code);
 const grant=await first(db,"SELECT grant_id FROM send_grants WHERE environment='sandbox' AND app_scope=? AND owner_key=? AND account_key=? AND key_version=1 AND state='AVAILABLE' AND media_sha256=? AND issued_at<=? AND expires_at>? ORDER BY issued_at,grant_id LIMIT 1",c.appScope,c.ownerKey,c.accountKey,i.mediaSha,i.now,i.now);if(!grant)reject();
 const tag='ready:'+JSON.stringify([i.draftId,i.revision,c.openId]);
 await db.batch([
 stmt(db,"INSERT INTO send_attempts VALUES(?,?,?,?,?,?,?,?,?,'RESERVED','NEW',?,?,0,?,?)",i.jobId,grant.grant_id,'sandbox',c.appScope,c.ownerKey,c.accountKey,requestHash,payloadHash,i.mediaSha,i.now,i.now,i.now+30*DAY,i.now+90*DAY),
 stmt(db,"INSERT INTO jobs(id,owner,request_key,draft_id,open_id,state,created) VALUES(?,(SELECT p.owner FROM profiles p JOIN connections c ON c.owner=p.owner JOIN drafts d ON d.owner=p.owner JOIN assets a ON a.owner=p.owner WHERE p.owner=? AND p.deleting=0 AND c.open_id=? AND instr(','||c.scopes||',',',user.info.basic,')>0 AND instr(','||c.scopes||',',',video.upload,')>0 AND d.id=? AND d.revision=? AND d.body=? AND a.id=? AND a.ready=1 AND a.type='video/mp4' AND NOT EXISTS(SELECT 1 FROM jobs WHERE open_id=c.open_id AND state IN ('INITIALIZING','PROCESSING','STATUS_UNKNOWN'))),?,?,?,'INITIALIZING',?)",i.jobId,c.owner,c.openId,i.draftId,i.revision,JSON.stringify(i.payload),i.assetId,i.requestKey,i.draftId,c.openId,i.now),
 stmt(db,"UPDATE leases SET job_id=? WHERE hash=? AND owner=? AND asset_id=? AND job_id=? AND expires>?",i.jobId,i.leaseHash,c.owner,i.assetId,tag,i.now+3600),
 stmt(db,"UPDATE send_attempts SET receipt=CASE WHEN EXISTS(SELECT 1 FROM jobs WHERE id=?) AND EXISTS(SELECT 1 FROM leases WHERE hash=? AND owner=? AND job_id=?) AND EXISTS(SELECT 1 FROM send_grants WHERE grant_id=? AND state='CONSUMED') THEN 1 ELSE -1 END WHERE attempt_id=?",i.jobId,i.leaseHash,c.owner,i.jobId,grant.grant_id,i.jobId)
 ]);
 return {id:i.jobId,replay:false};
 }catch(e){if(e instanceof AppError)throw e;
 // A concurrent replay may have won. Never turn a duplicate request into another dispatch.
 const old=await first(db,"SELECT attempt_id,payload_hash FROM send_attempts WHERE environment='sandbox' AND app_scope=? AND owner_key=? AND request_key_hash=?",c.appScope,c.ownerKey,requestHash).catch(()=>null);
 if(old){if(old.payload_hash!==payloadHash)reject('IDEMPOTENCY_CONFLICT');return {id:old.attempt_id,replay:true};}reject('SEND_SAFETY_NOT_READY');}
}
export async function claimDispatch(db:D1Database,c:SafetyContext,id:string,now:number){
 valid(c);try{const result=await db.batch([stmt(db,`UPDATE send_attempts SET state='DISPATCH_STARTED',updated_at=? WHERE attempt_id=? AND owner_key=? AND account_key=? AND app_scope=? AND environment='sandbox' AND state='RESERVED' AND receipt=1 AND EXISTS(SELECT 1 FROM send_grants g WHERE g.grant_id=send_attempts.grant_id AND g.state='CONSUMED' AND g.expires_at>?) AND EXISTS(SELECT 1 FROM send_control WHERE environment='sandbox' AND app_scope=? AND halted=0 AND schema_version=1) AND EXISTS(SELECT 1 FROM profiles WHERE owner=? AND deleting=0) AND EXISTS(SELECT 1 FROM connections WHERE owner=? AND open_id=? AND instr(','||scopes||',',',user.info.basic,')>0 AND instr(','||scopes||',',',video.upload,')>0) AND EXISTS(SELECT 1 FROM leases WHERE job_id=? AND owner=? AND expires>?) AND NOT EXISTS(SELECT 1 FROM delete_requests WHERE owner_key=? AND state IN('QUEUED','DELETING')) RETURNING attempt_id`,now,id,c.ownerKey,c.accountKey,c.appScope,now,c.appScope,c.owner,c.owner,c.openId,id,c.owner,now+3600,c.ownerKey),stmt(db,"UPDATE jobs SET state='STATUS_UNKNOWN',error='NETWORK_RESULT_UNKNOWN' WHERE id=? AND owner=? AND state='INITIALIZING' AND EXISTS(SELECT 1 FROM send_attempts WHERE attempt_id=? AND state='DISPATCH_STARTED')",id,c.owner,id)]);return result[0].results.length===1;}catch{reject('SEND_SAFETY_NOT_READY')}
}
export async function saveOutcome(db:D1Database,c:SafetyContext,id:string,state:'UNKNOWN'|'PENDING'|'DEFINITIVE_REJECT',category:string,publishId:string|null,now:number){
 valid(c);if(!['UNKNOWN','PENDING','DEFINITIVE_REJECT'].includes(state))reject();const jobState=state==='PENDING'?'PROCESSING':state==='DEFINITIVE_REJECT'?'FAILED':'STATUS_UNKNOWN';
 try{await db.batch([
 stmt(db,"UPDATE jobs SET state=?,error=?,publish_id=? WHERE id=? AND owner=?",jobState,state==='PENDING'?null:category,publishId,id,c.owner),
 stmt(db,"UPDATE send_attempts SET state=?,updated_at=?,receipt=CASE WHEN EXISTS(SELECT 1 FROM jobs WHERE id=? AND owner=? AND state=?) THEN 1 ELSE -1 END WHERE attempt_id=? AND owner_key=? AND state IN('RESERVED','DISPATCH_STARTED','UNKNOWN')",state,now,id,c.owner,jobState,id,c.ownerKey)
 ,stmt(db,"INSERT INTO send_control(environment,app_scope,halted,schema_version) SELECT 'assert-failed','',1,1 WHERE NOT EXISTS(SELECT 1 FROM send_attempts WHERE attempt_id=? AND owner_key=? AND state=?)",id,c.ownerKey,state)
 ]);}catch{reject('SEND_RESULT_SAVE_FAILED')}
}
export async function beginDeletion(db:D1Database,c:SafetyContext,now:number){
 // Deletion does not require an enabled TikTok connection, but it does require valid owner keys/schema.
 valid(c);try{await db.batch([
 stmt(db,"INSERT INTO delete_requests VALUES(?,?,'QUEUED',?,NULL,?) ON CONFLICT(owner_key) DO UPDATE SET state=CASE WHEN delete_requests.state='COMPLETE' THEN 'QUEUED' ELSE delete_requests.state END,requested_at=CASE WHEN delete_requests.state='COMPLETE' THEN excluded.requested_at ELSE delete_requests.requested_at END,purge_at=CASE WHEN delete_requests.state='COMPLETE' THEN excluded.purge_at ELSE delete_requests.purge_at END",c.ownerKey,crypto.randomUUID(),now,now+90*DAY),
 stmt(db,'UPDATE profiles SET deleting=1 WHERE owner=?',c.owner),
 stmt(db,"UPDATE send_grants SET state='REVOKED' WHERE owner_key=? AND state='AVAILABLE'",c.ownerKey)
 ]);const pending=await first(db,`SELECT 1 FROM send_attempts WHERE owner_key=? AND state IN ${unresolved}`,c.ownerKey)||await first(db,"SELECT 1 FROM jobs WHERE owner=? AND state IN ('INITIALIZING','PROCESSING','STATUS_UNKNOWN')",c.owner);if(!pending)await stmt(db,"UPDATE delete_requests SET state='DELETING' WHERE owner_key=?",c.ownerKey).run();return {state:pending?'QUEUED':'DELETING'};
 }catch{reject('DELETE_SAFETY_NOT_READY')}
}
export async function deletionReady(db:D1Database,c:SafetyContext,now:number){const r=await first(db,'SELECT state,requested_at FROM delete_requests WHERE owner_key=?',c.ownerKey);return !!r&&(r.state==='DELETING'||r.state==='COMPLETE'||now>=r.requested_at+DAY);}
export async function finishDeletionRows(db:D1Database,c:SafetyContext,now:number){
 if(!await deletionReady(db,c,now))reject('ACCOUNT_DELETION_PENDING');
 // The caller deletes R2 first. Failure leaves the ordinary asset manifest available for a safe retry.
 await db.batch([stmt(db,"UPDATE assets SET ready=-1,size=0,type='cleanup',created=? WHERE owner=? AND ready>=0",now,c.owner),...['leases','states','connections','jobs','drafts','profiles'].map(t=>stmt(db,`DELETE FROM ${t} WHERE owner=?`,c.owner)),stmt(db,"UPDATE delete_requests SET state='COMPLETE',completed_at=?,purge_at=? WHERE owner_key=?",now,now+DAY,c.ownerKey)]);return {deleted:true};
}
export async function migrateUnknown(db:D1Database,c:SafetyContext,mediaSha:string,now:number){
 valid(c);const jobs=(await stmt(db,"SELECT id,request_key,created FROM jobs WHERE owner=? AND open_id=? AND state='STATUS_UNKNOWN'",c.owner,c.openId).all<any>()).results;
 if(jobs.length>1)reject('LEGACY_ACCOUNT_REVIEW_REQUIRED');
 await stmt(db,"INSERT OR IGNORE INTO send_control VALUES('sandbox',?,1,1)",c.appScope).run();const control=await first(db,"SELECT halted FROM send_control WHERE environment='sandbox' AND app_scope=?",c.appScope);if(control?.halted!==1)reject('MIGRATION_REQUIRES_HALT');
 for(const j of jobs){if(await first(db,'SELECT 1 FROM send_attempts WHERE attempt_id=?',j.id))continue;const grant='legacy:'+j.id;await db.batch([
 stmt(db,"INSERT INTO send_grants VALUES(?,'sandbox',?,?,?,?,?,'legacy-record','LEGACY_CONSUMED',?,?,?)",grant,c.appScope,c.ownerKey,c.accountKey,1,mediaSha,j.created,j.created+1,j.created),
 stmt(db,"INSERT INTO send_attempts VALUES(?,?,'sandbox',?,?,?,?,?,?,'UNKNOWN','LEGACY_DB',?,?,1,?,?)",j.id,grant,c.appScope,c.ownerKey,c.accountKey,await digest(c.ownerKey+':'+j.request_key),await digest('legacy:'+j.id),mediaSha,j.created,now,j.created+30*DAY,j.created+90*DAY)
 ]);}return {migrated:jobs.length};
}
export {boundedRetention as purgeSafety} from './maintenance';
export async function processDeletionQueue(env:{DB:D1Database;BUCKET:R2Bucket},now:number){const start=Date.now();const r=await runMaintenanceInternal(env,()=>now+Math.floor((Date.now()-start)/1000));return {...r,completed:r.processed};}
import {runMaintenance as runMaintenanceInternal} from './maintenance';
export {acquireMaintenanceLock,maintenanceFence,requestDeletion,runMaintenance,finalizeDeletion,commitAssetCleanup,setMaintenancePaused,maintenanceStatus} from './maintenance';
export {applyIsolatedMigration} from './migration-executor';
