import {AppError} from './policy.mjs';
import type {SafetyContext} from './send-safety';
const DAY=86400;
const q=(db:D1Database,sql:string,...args:any[])=>db.prepare(sql).bind(...args);
export type Fence={scope:string;holder:string;fence:number;expires_at:number;cursor?:string};
const fenceSQL="EXISTS(SELECT 1 FROM maintenance_locks WHERE scope=? AND holder=? AND fence=? AND expires_at>?)";
const fa=(f:Fence,now:number)=>[f.scope,f.holder,f.fence,now];
export async function acquireMaintenanceLock(db:D1Database,scope:string,holder:string,now:number,ttl=90):Promise<Fence|null>{
 if(!scope||!holder||ttl<1||ttl>120)throw new AppError('MAINTENANCE_REJECT',409);
 const r=await q(db,"INSERT INTO maintenance_locks(scope,holder,fence,expires_at) VALUES(?,?,1,?) ON CONFLICT(scope) DO UPDATE SET holder=excluded.holder,fence=maintenance_locks.fence+1,expires_at=excluded.expires_at WHERE maintenance_locks.expires_at<=? RETURNING scope,holder,fence,expires_at,cursor",scope,holder,now+ttl,now).first<Fence>();return r;
}
export async function maintenanceFence(db:D1Database,f:Fence,now:number){return !!await q(db,'SELECT 1 WHERE '+fenceSQL,...fa(f,now)).first();}
async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');}
export async function requestDeletion(db:D1Database,owner:string,c:SafetyContext|null,now:number){
 if(!owner||!await q(db,'SELECT 1 FROM profiles WHERE owner=?',owner).first())throw new AppError('REGISTER_FIRST',403);
 if(c&&c.owner!==owner)throw new AppError('OWNER_MISMATCH',403);
 if(c&&await q(db,"SELECT 1 FROM jobs j JOIN send_attempts a ON a.attempt_id=j.id WHERE j.owner=? AND (a.owner_key<>? OR a.account_key<>? OR a.app_scope<>?) LIMIT 1",owner,c.ownerKey,c.accountKey,c.appScope).first())c=null;
 const lock=await acquireMaintenanceLock(db,'owner:'+await digest(owner),crypto.randomUUID(),now);if(!lock)throw new AppError('DELETE_BUSY',409);
 try{
 const ids=(await q(db,'SELECT DISTINCT open_id FROM jobs WHERE owner=? UNION SELECT open_id FROM connections WHERE owner=?',owner,owner).all<{open_id:string}>()).results;
 // Rescue uses authenticated profile ownership, then global halt. It does not assert account authority or issue grants.
 const marker=c?null:await digest('deletion-exception:'+crypto.randomUUID()+':'+ids.map(x=>x.open_id).sort().join(':'));
 const rows=[q(db,"INSERT INTO deletion_tasks(owner,owner_key,request_id,requested_at,state,needs_review,exception_digest,purge_at) SELECT ?,?,?,?,'QUEUED',?,?,? WHERE "+fenceSQL+" ON CONFLICT(owner) DO UPDATE SET state=CASE WHEN deletion_tasks.state='COMPLETE' THEN 'QUEUED' ELSE deletion_tasks.state END,requested_at=CASE WHEN deletion_tasks.state='COMPLETE' THEN excluded.requested_at ELSE deletion_tasks.requested_at END,needs_review=MAX(deletion_tasks.needs_review,excluded.needs_review),purge_at=excluded.purge_at",owner,c?.ownerKey??null,crypto.randomUUID(),now,c?0:1,marker,now+90*DAY,...fa(lock,now)),q(db,'UPDATE profiles SET deleting=1 WHERE owner=? AND '+fenceSQL,owner,...fa(lock,now))];
 // Always freeze grants dispatch during deletion/rescue; re-enable requires an independent operator decision.
 rows.push(q(db,'UPDATE send_control SET halted=1 WHERE '+fenceSQL,...fa(lock,now)));
 if(c){rows.push(q(db,"UPDATE send_grants SET state='REVOKED' WHERE owner_key=? AND state='AVAILABLE' AND "+fenceSQL,c.ownerKey,...fa(lock,now)));rows.push(q(db,"INSERT INTO delete_requests SELECT ?,?,'DELETING',?,NULL,? WHERE "+fenceSQL+" ON CONFLICT(owner_key) DO UPDATE SET state='DELETING',requested_at=excluded.requested_at,purge_at=excluded.purge_at",c.ownerKey,crypto.randomUUID(),now,now+90*DAY,...fa(lock,now)));}
 if(!c)rows.push(q(db,'INSERT INTO safety_exceptions SELECT ?,?,?,?,? WHERE '+fenceSQL,crypto.randomUUID(),marker,now,now+30*DAY,now+90*DAY,...fa(lock,now)));
 rows.push(q(db,'DELETE FROM connections WHERE owner=? AND '+fenceSQL,owner,...fa(lock,now)),q(db,'DELETE FROM states WHERE owner=? AND '+fenceSQL,owner,...fa(lock,now)));
 rows.push(q(db,'INSERT INTO maintenance_control(id,paused,generation) SELECT -1,1,1 WHERE NOT (EXISTS(SELECT 1 FROM deletion_tasks WHERE owner=? AND state IN(\'QUEUED\',\'DELETING\')) AND EXISTS(SELECT 1 FROM profiles WHERE owner=? AND deleting=1) AND NOT EXISTS(SELECT 1 FROM connections WHERE owner=?) AND '+fenceSQL+')',owner,owner,owner,...fa(lock,now)));
 await db.batch(rows);return {deleted:false,deleting:true,state:'QUEUED',needsReview:!c};
 }finally{await q(db,'UPDATE maintenance_locks SET expires_at=? WHERE scope=? AND holder=? AND fence=?',now,lock.scope,lock.holder,lock.fence).run();}
}
export async function runMaintenance(env:{DB:D1Database;BUCKET:R2Bucket},clock:()=>number=()=>Math.floor(Date.now()/1000),limits={owners:2,r2:10,queries:40,seconds:60}){
 // This module never imports or invokes TikTok transport. Count queries before issuance, including final telemetry.
 if(limits.owners<1||limits.owners>2||limits.r2<1||limits.r2>10||limits.queries<20||limits.queries>40||limits.seconds<=0||limits.seconds>60)throw new AppError('MAINTENANCE_BUDGET',409);
 let queries=0,r2=0,processed=0,failed=0,deferred=0,overdue=0,category:string|null=null;const wallStart=Date.now();const start=clock(),runId=crypto.randomUUID();
 const db={prepare(sql:string){if(queries>=limits.queries-4)throw new AppError('BUDGET',409);queries++;return env.DB.prepare(sql)},batch:(qs:D1PreparedStatement[])=>env.DB.batch(qs)} as D1Database;
 const control=await q(db,'SELECT paused,generation FROM maintenance_control WHERE id=1').first<{paused:number;generation:number}>();if(!control||control.paused!==0)return {status:'STOPPED',category:'PAUSED',processed:0,failed:0,deferred:0,queries,r2};
 const lock=await acquireMaintenanceLock(db,'global',runId,start,90);if(!lock)return {status:'STOPPED',category:'FENCE',processed:0,failed:0,deferred:0,queries,r2};
 const active=async(f:Fence)=>{if(clock()-start>=limits.seconds||(Date.now()-wallStart)/1000>=limits.seconds)throw new AppError('BUDGET',409);if(!await q(db,'SELECT 1 FROM maintenance_control WHERE id=1 AND paused=0 AND generation=? AND '+fenceSQL,control.generation,...fa(f,clock())).first())throw new AppError('FENCE',409);};
 const r2Delete=async(key:string)=>{const remaining=limits.seconds*1000-(Date.now()-wallStart);if(remaining<=0)throw new AppError('BUDGET',409);let timer:ReturnType<typeof setTimeout>;try{await Promise.race([env.BUCKET.delete(key),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new AppError('BUDGET',409)),remaining)})]);}finally{clearTimeout(timer!);}};
 const release=async(f:Fence)=>q(env.DB,'UPDATE maintenance_locks SET expires_at=? WHERE scope=? AND holder=? AND fence=?',clock(),f.scope,f.holder,f.fence).run();
 await q(db,"INSERT INTO maintenance_runs(run_id,started_at,heartbeat_at,status,purge_at) VALUES(?,?,?,'RUNNING',?)",runId,start,start,start+30*DAY).run();
 try{
 const position=lock.cursor?JSON.parse(lock.cursor):{owner:'',asset:''};
 const rows=(await q(db,"SELECT owner,request_id,requested_at,needs_review FROM deletion_tasks WHERE state<>'COMPLETE' ORDER BY CASE WHEN request_id>? THEN 0 ELSE 1 END,request_id LIMIT ?",position.owner||'',limits.owners).all<{owner:string;request_id:string;requested_at:number;needs_review:number}>()).results;
 for(const row of rows){position.owner=row.request_id;await q(db,'UPDATE maintenance_locks SET cursor=? WHERE '+fenceSQL,JSON.stringify(position),...fa(lock,clock())).run();let ownerLock:Fence|null=null;try{await active(lock);ownerLock=await acquireMaintenanceLock(db,'owner:'+await digest(row.owner),runId,clock(),90);if(!ownerLock){deferred++;continue;}if(clock()>=row.requested_at+DAY)overdue++;
 const assets=(await q(db,'SELECT id FROM assets WHERE owner=? AND ready>=0 ORDER BY id LIMIT ?',row.owner,limits.r2-r2+1).all<{id:string}>()).results;
 for(const a of assets){if(r2>=limits.r2)throw new AppError('BUDGET',409);await active(ownerLock);await active(lock);r2++;try{await r2Delete(row.owner+'/'+a.id);}catch(e){if(e instanceof AppError&&e.message==='BUDGET')throw e;throw new AppError('R2',409);}await active(ownerLock);await active(lock);
 await commitAssetCleanup(db,row.owner,a.id,lock,ownerLock,clock(),control.generation);}
 const left=await q(db,'SELECT 1 FROM assets WHERE owner=? AND ready>=0 LIMIT 1',row.owner).first();if(left){deferred++;continue;}
 await active(ownerLock);await active(lock);
 const unfinished=await q(db,"SELECT COUNT(*) n FROM jobs WHERE owner=? AND state IN('INITIALIZING','PROCESSING','STATUS_UNKNOWN') AND NOT EXISTS(SELECT 1 FROM send_attempts WHERE attempt_id=jobs.id)",row.owner).first<{n:number}>();
 // Retain a minimal exception marker and a global halt if legacy safety proof cannot be matched.
 if(unfinished?.n&&!row.needs_review){await q(db,'INSERT INTO safety_exceptions VALUES(?,?,?,?,?)',crypto.randomUUID(),await digest('unknown-rescue:'+crypto.randomUUID()),row.requested_at,row.requested_at+30*DAY,row.requested_at+90*DAY).run();await q(db,"UPDATE deletion_tasks SET needs_review=1,exception_digest=?,last_error='KEY_REVIEW' WHERE owner=? AND "+fenceSQL,await digest('legacy-delete:'+crypto.randomUUID()+':'+unfinished.n),row.owner,...fa(ownerLock,clock())).run();}
 await finalizeDeletion(db,row.owner,lock,ownerLock,clock(),control.generation);processed++;

 }catch(e){failed++;category=e instanceof AppError&&['R2','DB','FENCE','BUDGET','PAUSED'].includes(e.message)?e.message:'DB';if(category==='BUDGET'||category==='FENCE'||category==='PAUSED')break;}finally{if(ownerLock){queries++;await release(ownerLock);}}}
 if(queries<limits.queries-18 && r2<limits.r2){
 const tombstones=(await q(db,'SELECT id,owner,created FROM assets WHERE ready=-1 ORDER BY CASE WHEN id>? THEN 0 ELSE 1 END,id LIMIT ?',position.asset||'',Math.min(2,limits.r2-r2)).all<{id:string;owner:string;created:number}>()).results;
 for(const a of tombstones){position.asset=a.id;await q(db,'UPDATE maintenance_locks SET cursor=? WHERE '+fenceSQL,JSON.stringify(position),...fa(lock,clock())).run();let local:Fence|null=null;try{await active(lock);local=await acquireMaintenanceLock(db,'owner:'+await digest(a.owner),runId,clock(),90);if(!local){deferred++;continue;}await active(local);r2++;try{await r2Delete(a.owner+'/'+a.id)}catch(e){if(e instanceof AppError&&e.message==='BUDGET')throw e;throw new AppError('R2',409)}await active(lock);await active(local);
 if(clock()>=a.created+DAY)await q(db,'DELETE FROM assets WHERE id=? AND owner=? AND ready=-1 AND '+fenceSQL+' AND '+fenceSQL,a.id,a.owner,...fa(lock,clock()),...fa(local,clock())).run();
 }catch(e){failed++;category=e instanceof AppError&&['R2','FENCE','BUDGET'].includes(e.message)?e.message:'DB';break;}finally{if(local){queries++;await release(local);}}}
 }else deferred++;
 }catch(e){failed++;category=e instanceof AppError&&['FENCE','BUDGET','PAUSED'].includes(e.message)?e.message:'DB';}
 const status=failed?(processed?'PARTIAL':'FAILED'):'SUCCESS';queries++;await q(env.DB,'UPDATE maintenance_runs SET heartbeat_at=?,finished_at=?,status=?,category=?,processed=?,failed=?,deferred=?,query_count=?,r2_count=?,overdue=? WHERE run_id=? AND '+fenceSQL,clock(),clock(),status,category,processed,failed,deferred,queries,r2,overdue,runId,...fa(lock,clock())).run();queries++;await release(lock);return {status,category,processed,failed,deferred,overdue,queries,r2};
}
export async function boundedRetention(db:D1Database,now:number){
 const control=await q(db,'SELECT paused,generation FROM maintenance_control WHERE id=1').first<{paused:number;generation:number}>();if(!control||control.paused!==0)return {reviewDue:0,deferred:true,stopped:true};
 const guard=fenceSQL+' AND EXISTS(SELECT 1 FROM maintenance_control WHERE id=1 AND paused=0 AND generation=?)';
 const f=await acquireMaintenanceLock(db,'global',crypto.randomUUID(),now,90);if(!f)return {reviewDue:0,deferred:true};
 try{
 const due=(await q(db,'SELECT attempt_id,grant_id,state,environment,app_scope FROM send_attempts WHERE purge_at<=? ORDER BY purge_at,attempt_id LIMIT 50',now).all<any>()).results;
 const review=await q(db,'SELECT COUNT(*) n FROM send_attempts WHERE review_at<=? AND purge_at>?',now,now).first<{n:number}>();
 // Removing uncertainty must never turn into permission; freeze the affected scopes first.
 await db.batch([q(db,'UPDATE send_control SET halted=1 WHERE app_scope IN(SELECT app_scope FROM send_attempts WHERE purge_at<=? ORDER BY purge_at,attempt_id LIMIT 50) AND '+guard,now,...fa(f,now),control.generation),q(db,'DELETE FROM send_attempts WHERE attempt_id IN(SELECT attempt_id FROM send_attempts WHERE purge_at<=? ORDER BY purge_at,attempt_id LIMIT 50) AND '+guard,now,...fa(f,now),control.generation),q(db,"UPDATE send_grants SET state='EXPIRED' WHERE grant_id IN(SELECT grant_id FROM send_grants WHERE state='AVAILABLE' AND expires_at<=? ORDER BY expires_at LIMIT 50) AND "+guard,now,...fa(f,now),control.generation),q(db,"DELETE FROM send_grants WHERE grant_id IN(SELECT grant_id FROM send_grants WHERE state<>'AVAILABLE' AND NOT EXISTS(SELECT 1 FROM send_attempts a WHERE a.grant_id=send_grants.grant_id) AND COALESCE(consumed_at,issued_at)+?<=? ORDER BY issued_at LIMIT 50) AND "+guard,90*DAY,now,...fa(f,now),control.generation),q(db,"DELETE FROM delete_requests WHERE owner_key IN(SELECT owner_key FROM delete_requests WHERE state='COMPLETE' AND purge_at<=? ORDER BY purge_at LIMIT 50) AND "+guard,now,...fa(f,now),control.generation),q(db,'DELETE FROM states WHERE hash IN(SELECT hash FROM states WHERE expires<=? ORDER BY expires LIMIT 50) AND '+guard,now,...fa(f,now),control.generation),q(db,"DELETE FROM leases WHERE hash IN(SELECT hash FROM leases WHERE expires<=? AND NOT EXISTS(SELECT 1 FROM jobs j WHERE j.id=leases.job_id AND j.state IN('INITIALIZING','PROCESSING','STATUS_UNKNOWN')) ORDER BY expires LIMIT 50) AND "+guard,now,...fa(f,now),control.generation),q(db,"DELETE FROM deletion_tasks WHERE owner IN(SELECT owner FROM deletion_tasks WHERE state='COMPLETE' AND purge_at<=? ORDER BY purge_at LIMIT 50) AND "+guard,now,...fa(f,now),control.generation),q(db,'UPDATE send_control SET halted=1 WHERE EXISTS(SELECT 1 FROM safety_exceptions WHERE purge_at<=?) AND '+guard,now,...fa(f,now),control.generation),q(db,'DELETE FROM safety_exceptions WHERE exception_id IN(SELECT exception_id FROM safety_exceptions WHERE purge_at<=? ORDER BY purge_at LIMIT 50) AND '+guard,now,...fa(f,now),control.generation),q(db,'DELETE FROM maintenance_runs WHERE run_id IN(SELECT run_id FROM maintenance_runs WHERE purge_at<=? ORDER BY purge_at LIMIT 50) AND '+guard,now,...fa(f,now),control.generation),q(db,"DELETE FROM maintenance_locks WHERE scope IN(SELECT scope FROM maintenance_locks WHERE scope LIKE 'owner:%' AND expires_at<=? ORDER BY expires_at LIMIT 50) AND "+guard,now-30*DAY,...fa(f,now),control.generation),q(db,"UPDATE maintenance_locks SET cursor='' WHERE scope='global' AND NOT EXISTS(SELECT 1 FROM deletion_tasks WHERE state<>'COMPLETE') AND NOT EXISTS(SELECT 1 FROM assets WHERE ready=-1) AND "+guard,...fa(f,now),control.generation),q(db,'INSERT INTO maintenance_control(id,paused,generation) SELECT -1,1,1 WHERE NOT('+guard+')',...fa(f,now),control.generation)]);
 return {reviewDue:review?.n||0,purged:due.length,deferred:due.length===50};
 }finally{await q(db,'UPDATE maintenance_locks SET expires_at=? WHERE scope=? AND holder=? AND fence=?',now,f.scope,f.holder,f.fence).run();}
}

export async function finalizeDeletion(db:D1Database,owner:string,global:Fence,local:Fence,now:number,generation:number){
 const guard=fenceSQL+' AND '+fenceSQL+' AND EXISTS(SELECT 1 FROM maintenance_control WHERE id=1 AND paused=0 AND generation=?)';
 const args=[...fa(global,now),...fa(local,now),generation];
 if(!await q(db,'SELECT 1 WHERE '+guard,...args).first())throw new AppError('FENCE',409);
 if(await q(db,'SELECT 1 FROM assets WHERE owner=? AND ready>=0 LIMIT 1',owner).first())throw new AppError('BUDGET',409);
 const result=await db.batch(['leases','states','connections','jobs','drafts','profiles'].map(t=>q(db,'DELETE FROM '+t+' WHERE owner=? AND '+guard,owner,...args)).concat([q(db,"UPDATE delete_requests SET state='COMPLETE',completed_at=?,purge_at=? WHERE owner_key=(SELECT owner_key FROM deletion_tasks WHERE owner=?) AND "+guard,now,now+DAY,owner,...args),q(db,"UPDATE deletion_tasks SET state='COMPLETE',completed_at=?,purge_at=?,cursor='',last_error=NULL WHERE owner=? AND "+guard,now,now+DAY,owner,...args)]));
 if(result[result.length-1].meta.changes!==1)throw new AppError('FENCE',409);
}

export async function commitAssetCleanup(db:D1Database,owner:string,id:string,global:Fence,local:Fence,now:number,generation:number){
 const guard=fenceSQL+' AND '+fenceSQL+' AND EXISTS(SELECT 1 FROM maintenance_control WHERE id=1 AND paused=0 AND generation=?)';const args=[...fa(global,now),...fa(local,now),generation];
 const row=await q(db,"UPDATE assets SET ready=-1,size=0,type='cleanup',created=? WHERE id=? AND owner=? AND "+guard+' RETURNING id',now,id,owner,...args).first();if(!row)throw new AppError('FENCE',409);
 await q(db,'UPDATE deletion_tasks SET cursor=? WHERE owner=? AND '+guard,id,owner,...args).run();
}

export async function setMaintenancePaused(db:D1Database,paused:boolean){
 await db.batch([q(db,'UPDATE maintenance_control SET paused=?,generation=generation+1 WHERE id=1',paused?1:0),q(db,'UPDATE send_control SET halted=1')]);return {paused};
}

export async function maintenanceStatus(db:D1Database,now:number){
 const stale=await q(db,"SELECT COUNT(*) n FROM maintenance_runs WHERE status='RUNNING' AND heartbeat_at<?",now-120).first<{n:number}>();
 const overdue=await q(db,"SELECT COUNT(*) n FROM deletion_tasks WHERE state<>'COMPLETE' AND requested_at<=?",now-DAY).first<{n:number}>();
 const failed=await q(db,"SELECT COUNT(*) n FROM maintenance_runs WHERE status IN('FAILED','PARTIAL') AND started_at>=?",now-DAY).first<{n:number}>();
 return {staleRuns:stale?.n||0,overdueDeletions:overdue?.n||0,failedRuns:failed?.n||0};
}
