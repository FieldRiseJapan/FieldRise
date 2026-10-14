const {test,beforeEach,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');const {webcrypto}=require('node:crypto');
const syntheticBytes=Buffer.alloc(100);syntheticBytes.write('ftyp',4);const syntheticSha=require('node:crypto').createHash('sha256').update(syntheticBytes).digest('hex');
let sqlite,owner,env,calls,apiResponse,trackPulls;
class Query{constructor(q,v=[]){this.q=q;this.v=v;}bind(...v){return new Query(this.q,v)}async first(){return sqlite.prepare(this.q).get(...this.v)||null}async all(){return {results:sqlite.prepare(this.q).all(...this.v)}}async run(){const s=sqlite.prepare(this.q);if(/RETURNING/i.test(this.q)){const results=s.all(...this.v);return {results,meta:{changes:Number(sqlite.prepare('SELECT changes() n').get().n)}}}const r=s.run(...this.v);return {results:[],meta:{changes:Number(r.changes)}}}}
function compile(path,mocks){let raw=fs.readFileSync(path,'utf8');if(path.includes('server'))raw=raw.replaceAll('2971884','100').replace('2e200e8634de51bf1ae2116dce07d39e4914351596b4b22e9b615cf6bf1a98ee',syntheticSha);const source=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};vm.runInNewContext(source,{exports,require:n=>mocks[n]||require(n),crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,URL,URLSearchParams,Response,Request,AbortSignal,Date,JSON,atob,btoa,setTimeout,clearTimeout,FixedLengthStream:class{constructor(){const s=new TransformStream();this.readable=s.readable;this.writable=s.writable}},fetch:async(url,options)=>{if(url.startsWith('https://studio.example/api/media/pull/')&&!trackPulls)return new Response(syntheticBytes);calls.push({url,options});return apiResponse(url,options)},console});return exports;}
let handle,security,policy,safety;
beforeEach(async()=>{if(sqlite)sqlite.close();sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_clammy_captain_america.sql','utf8'));sqlite.exec(fs.readFileSync('drizzle/0001_send_safety.sql','utf8'));sqlite.exec(fs.readFileSync('drizzle/0002_maintenance_safety.sql','utf8')); owner='alice';calls=[];trackPulls=false;apiResponse=()=>Response.json({data:{publish_id:'publish-test',status:'SEND_TO_USER_INBOX'},error:{code:'ok'}});const bucket=new Map();env={DB:{prepare:q=>new Query(q),batch:async qs=>{sqlite.exec('BEGIN');try{const results=[];for(const q of qs)results.push(await q.run());sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}},BUCKET:{get:async k=>bucket.has(k)?{body:bucket.get(k),size:bucket.get(k).length}:null,put:async(k,b)=>bucket.set(k,b),delete:async k=>bucket.delete(k)},SITE_ORIGIN:'https://studio.example',TIKTOK_MODE:'sandbox',TIKTOK_CLIENT_KEY:'synthetic',TOKEN_ENCRYPTION_KEY:'11'.repeat(32)};policy=await import('../lib/policy.mjs');security=compile('lib/security.ts',{'./policy.mjs':policy});safety=compile('lib/send-safety.ts',{'./policy.mjs':policy,'./maintenance':compile('lib/maintenance.ts',{'./policy.mjs':policy}),'./migration-executor':compile('lib/migration-executor.ts',{'./policy.mjs':policy})});handle=compile('lib/server.ts',{'cloudflare:workers':{env},'../app/chatgpt-auth':{getChatGPTUser:async()=>owner?{userId:owner,displayName:owner}:null},'./policy.mjs':policy,'./security':security,'./send-safety':safety,'./maintenance':compile('lib/maintenance.ts',{'./policy.mjs':policy}),'./migration-executor':compile('lib/migration-executor.ts',{'./policy.mjs':policy})}).handle;});
after(()=>sqlite?.close());
async function req(path,method='GET',value,headers={}){if(path==='jobs'&&method==='POST'&&value)value={confirmSend:true,transferKey:'aa'.repeat(32),...value};const r=new Request('https://studio.example/api/'+path,{method,headers:{Origin:'https://studio.example',...(value?{'Content-Type':'application/json'}:{}),...headers},body:value?JSON.stringify(value):undefined});return handle(r,path.split('/'));}
const register=()=>req('register','POST',{consent:true});
const draft={kind:'PHOTO',title:'Test',description:'#test',assets:[],cover:0,aigc:false};
async function create(){return (await (await req('drafts','POST',draft)).json()).id;}
async function enable(){
 env.TIKTOK_ENABLED='true';env.TIKTOK_CLIENT_KEY='test-client';env.TIKTOK_CLIENT_SECRET='test-secret';env.TOKEN_ENCRYPTION_KEY='11'.repeat(32);env.MEDIA_DOMAIN_VERIFIED='true';env.TIKTOK_MODE='sandbox';await register();
 sqlite.prepare('INSERT INTO connections(owner,open_id,secret,name,avatar,scopes,expires) VALUES(?,?,?,?,?,?,?)').run(owner,'open-'+owner,await security.crypt(JSON.stringify({access_token:'test-access',refresh_token:'test-refresh'}),env.TOKEN_ENCRYPTION_KEY,owner),'Runa-Girl8215','','user.info.basic,video.upload',security.now()+3600);
 sqlite.prepare('INSERT INTO assets(id,owner,size,type,ready,created) VALUES(?,?,?,?,?,?)').run('asset-a',owner,100,'video/mp4',1,security.now());
 env.BUCKET.get=async()=>({body:syntheticBytes,size:100,arrayBuffer:async()=>syntheticBytes.buffer.slice(syntheticBytes.byteOffset,syntheticBytes.byteOffset+syntheticBytes.byteLength)});
 const id=(await(await req('drafts','POST',{...draft,kind:'VIDEO',assets:['asset-a']})).json()).id;
 sqlite.prepare('INSERT INTO leases VALUES(?,?,?,?,?)').run(await security.hash('aa'.repeat(32)),owner,'asset-a','ready:'+JSON.stringify([id,1,'open-'+owner]),security.now()+7200);
 const c=await safety.safetyContext(env,owner,'open-'+owner);
 sqlite.prepare('INSERT OR REPLACE INTO send_control VALUES(?,?,0,1)').run('sandbox',c.appScope);
 sqlite.prepare('INSERT INTO send_grants(grant_id,environment,app_scope,owner_key,account_key,key_version,media_sha256,approval_ref,state,issued_at,expires_at) VALUES(?,?,?,?,?,1,?,?,?, ?,?)').run(crypto.randomUUID(),'sandbox',c.appScope,c.ownerKey,c.accountKey,syntheticSha,'synthetic-approval','AVAILABLE',security.now()-1,security.now()+86400);
 return id;
}

test('anonymous cannot read private records',async()=>{owner=null;assert.equal((await req('drafts')).status,401)});
test('cross-origin mutation rejected',async()=>assert.equal((await req('register','POST',{consent:true},{Origin:'https://evil.example'})).status,403));
test('registration requires actual consent',async()=>assert.equal((await req('register','POST',{consent:false})).status,400));
test('users must register before saving',async()=>assert.equal((await req('drafts','POST',draft)).status,403));
test('draft create and optimistic revision save',async()=>{await register();const id=await create();assert.equal((await req('drafts/'+id,'PUT',{...draft,revision:1,title:'Changed'})).status,200);assert.equal((await req('drafts/'+id,'PUT',{...draft,revision:1})).status,409)});
test('other user cannot list edit delete drafts',async()=>{await register();const id=await create();owner='bob';await register();assert.deepEqual(await (await req('drafts')).json(),[]);assert.equal((await req('drafts/'+id,'PUT',{...draft,revision:1})).status,404);assert.equal((await req('drafts/'+id,'DELETE')).status,404)});
test('owner cannot be reassigned by request',async()=>{await register();await req('drafts','POST',{...draft,owner:'bob'});assert.equal(sqlite.prepare('SELECT owner FROM drafts').get().owner,'alice')});
test('foreign asset rejected',async()=>{await register();sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('foreign','bob',1,'image/jpeg',1,0);assert.equal((await req('drafts','POST',{...draft,assets:['foreign']})).status,404);assert.equal((await req('assets/foreign')).status,404);assert.equal((await req('assets/foreign','DELETE')).status,404)});
test('draft cap enforced at insert',async()=>{await register();for(let i=0;i<30;i++)assert.equal((await req('drafts','POST',draft)).status,200);assert.equal((await req('drafts','POST',draft)).status,429)});
test('disabled integration makes no external calls',async()=>{await register();assert.equal((await req('tiktok/connect','POST',{})).status,503);assert.equal((await req('jobs','POST',{})).status,503);assert.equal(calls.length,0)});
test('public responses do not expose encrypted credentials',async()=>{await enable();const text=await (await req('me')).text();assert(!text.includes('secret'));assert(!text.includes('test-access'));assert(!text.includes('open-alice'))});
test('OAuth is bound to authenticated owner and secure cookie',async()=>{await enable();const r=await req('tiktok/connect','POST',{});assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);const {url}=await r.json();assert.equal(new URL(url).searchParams.get('scope'),'user.info.basic,video.upload');const state=new URL(url).searchParams.get('state');owner='bob';await register();const response=await handle(new Request('https://studio.example/api/tiktok/callback?state='+state+'&code=fake',{headers:{Cookie:'fr_oauth='+state}}),['tiktok','callback']);assert.equal(response.status,403);assert.equal(calls.length,0)});
test('OAuth replay/unknown state rejected before exchange',async()=>{await enable();const r=await handle(new Request('https://studio.example/api/tiktok/callback?state='+'a'.repeat(64)+'&code=fake',{headers:{Cookie:'fr_oauth='+'a'.repeat(64)}}),['tiktok','callback']);assert.equal(r.status,403);assert.equal(calls.length,0)});
test('AES credentials are owner-bound and tamper-resistant',async()=>{const key='22'.repeat(32),s=await security.crypt('sensitive',key,'alice');assert(!s.includes('sensitive'));assert.equal(await security.crypt(s,key,'alice',true),'sensitive');await assert.rejects(()=>security.crypt(s,key,'bob',true))});
test('photo payload remains MEDIA_UPLOAD but unapproved photo API is blocked',async()=>{const p=policy.inboxPayload({...draft,assets:['x']},['https://studio.example/x']);assert.equal(p.post_mode,'MEDIA_UPLOAD');const id=await enable();sqlite.prepare('UPDATE drafts SET body=? WHERE id=?').run(JSON.stringify({...draft,assets:['asset-a']}),id);assert.equal((await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true})).status,403);assert.equal(calls.length,0)});
test('duplicate send returns same job without second call',async()=>{const id=await enable();const b={draftId:id,revision:1,requestKey:'once',consent:true};const a=await(await req('jobs','POST',b)).json(),c=await(await req('jobs','POST',b)).json();assert.equal(a.id,c.id);assert.equal(calls.length,1)});
test('send consent and latest revision are required',async()=>{const id=await enable();assert.equal((await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:false})).status,400);assert.equal((await req('jobs','POST',{draftId:id,revision:0,requestKey:'once',consent:true})).status,409);assert.equal(calls.length,0)});
test('foreign transfer status is inaccessible',async()=>{const id=await enable();const job=await(await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true})).json();owner='bob';await register();assert.equal((await req('jobs/'+job.id,'POST',{})).status,404)});
test('Inbox arrival is never represented as publication',async()=>{const id=await enable();const job=await(await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true})).json();const r=await(await req('jobs/'+job.id,'POST',{})).json();assert.equal(r.state,'INBOX_SENT')});
test('expired public media capability does not reveal asset',async()=>{await register();sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('asset-a','alice',1,'image/jpeg',1,0);sqlite.prepare('INSERT INTO leases VALUES(?,?,?,?,?)').run(await security.hash('test'),'alice','asset-a','job',0);owner=null;assert.equal((await req('media/pull/test')).status,404)});
test('account delete isolates other users',async()=>{await register();await create();owner='bob';await register();await create();owner='alice';assert.equal((await req('account','DELETE')).status,202);sqlite.prepare('UPDATE maintenance_control SET paused=0').run();await safety.runMaintenance(env,()=>security.now());assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get('alice').n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get('bob').n,1)});
test('video Inbox payload does not falsely include caption',()=>{const p=policy.inboxPayload({...draft,kind:'VIDEO',assets:['x']},['https://studio.example/a']);assert.deepEqual(p,{source_info:{source:'PULL_FROM_URL',video_url:'https://studio.example/a'}})});
test('crop reuses correct existing calculation without music seed',()=>{assert.deepEqual(policy.crop(2000,1000,1),{sx:500,sy:0,sw:1000,sh:1000})});

test('ambiguous network failure locks retry and is not success',async()=>{const id=await enable();apiResponse=()=>{throw Error('network timeout')};const b={draftId:id,revision:1,requestKey:'once',consent:true};const r=await req('jobs','POST',b);assert.equal(r.status,502);assert.equal((await r.json()).state,'STATUS_UNKNOWN');assert.equal((await req('jobs','POST',{...b,requestKey:'twice'})).status,409);assert.equal(calls.length,1)});
test('expired token is refreshed and replacement token stays encrypted',async()=>{const id=await enable();sqlite.prepare('UPDATE connections SET expires=0').run();apiResponse=url=>url.includes('/oauth/token/')?Response.json({access_token:'new-access',refresh_token:'new-refresh',open_id:'open-alice',expires_in:3600,scope:'user.info.basic,video.upload'}):Response.json({data:{publish_id:'p'},error:{code:'ok'}});assert.equal((await req('jobs','POST',{draftId:id,revision:1,requestKey:'one',consent:true})).status,200);assert.equal(calls.length,2);const c=sqlite.prepare('SELECT secret,lock FROM connections').get();assert(!c.secret.includes('new-access'));assert.equal(c.lock,0);assert.equal(JSON.parse(await security.crypt(c.secret,env.TOKEN_ENCRYPTION_KEY,'alice',true)).refresh_token,'new-refresh')});
test('verification gate prevents sending unverified media URLs',async()=>{const id=await enable();env.MEDIA_DOMAIN_VERIFIED='false';assert.equal((await req('jobs','POST',{draftId:id,revision:1,requestKey:'one',consent:true})).status,503);assert.equal(calls.length,0)});

async function callbackAttempt(){
 await enable();sqlite.prepare('DELETE FROM connections').run();
 const started=await req('tiktok/connect','POST',{});const u=new URL((await started.json()).url);const state=u.searchParams.get('state');
 return handle(new Request('https://studio.example/api/tiktok/callback?state='+state+'&code=synthetic-code',{headers:{Cookie:'fr_oauth='+state}}),['tiktok','callback']);
}
test('callback reports token exchange stage without leaking exception details',async()=>{
 apiResponse=()=>{throw new Error('synthetic-secret-code-token')};
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_TOKEN_TRANSPORT_ERROR'});
});
test('callback successful flow stores owner-bound encrypted credentials',async()=>{
 apiResponse=url=>url.includes('/oauth/token/')?Response.json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',open_id:'synthetic-open',expires_in:3600,scope:'user.info.basic,video.upload'}):Response.json({data:{user:{open_id:'synthetic-open',display_name:'Tester',avatar_url:''}},error:{code:'ok'}});
 const r=await callbackAttempt();assert.equal(r.status,303);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,1);
 const c=sqlite.prepare('SELECT secret FROM connections').get();assert(!c.secret.includes('synthetic-access'));assert.equal(JSON.parse(await security.crypt(c.secret,env.TOKEN_ENCRYPTION_KEY,'alice',true)).access_token,'synthetic-access');
});
test('callback non-JSON token response reports only HTTP status and fixed category',async()=>{
 apiResponse=()=>new Response('synthetic-sensitive-response',{status:403});
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_TOKEN_NON_JSON_403'});
});
test('callback token transport failure hides raw exception',async()=>{
 apiResponse=()=>{throw new TypeError('synthetic-sensitive-network-detail')};
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_TOKEN_TRANSPORT_ERROR'});
});
test('callback token API error uses allowlisted error only',async()=>{
 apiResponse=()=>Response.json({error:'invalid_client',error_description:'synthetic-secret'}, {status:400});
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_TOKEN_INVALID_CLIENT_400'});
});
function tokenSuccess(){return Response.json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',open_id:'synthetic-open',expires_in:3600,scope:'user.info.basic,video.upload'});}
test('callback user info non-JSON distinguishes HTTP failure without response content',async()=>{
 apiResponse=url=>url.includes('/oauth/token/')?tokenSuccess():new Response('synthetic-sensitive-body',{status:403});
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_USER_INFO_NON_JSON_403'});assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,0);
});
test('callback user info transport failure is distinct from persistence',async()=>{
 apiResponse=url=>{if(url.includes('/oauth/token/'))return tokenSuccess();throw new TypeError('synthetic-token-secret')};
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_USER_INFO_TRANSPORT_ERROR'});
});
test('callback user info malformed success rejected before database bind',async()=>{
 apiResponse=url=>url.includes('/oauth/token/')?tokenSuccess():Response.json({data:{user:{open_id:'synthetic-open'}},error:{code:'ok'}});
 const r=await callbackAttempt();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'TIKTOK_USER_INFO_INVALID_RESPONSE_200'});
});
test('preflight anonymous cannot issue URL',async()=>{owner=null;assert.equal((await req('media/preflight','POST',{assetId:'asset-a',consent:true})).status,401);assert.equal(calls.length,0)});
test('preflight foreign asset cannot issue URL',async()=>{await register();env.TIKTOK_MODE='sandbox';sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('foreign','bob',2971884,'video/mp4',1,0);assert.equal((await req('media/preflight','POST',{assetId:'foreign',consent:true})).status,404);assert.equal(calls.length,0)});
test('preflight requires consent before exposing media',async()=>{await register();env.TIKTOK_MODE='sandbox';assert.equal((await req('media/preflight','POST',{assetId:'x',consent:false})).status,400)});
test('preflight authentic signed full media and expiration without TikTok', {skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 await register();env.TIKTOK_MODE='sandbox';env.TOKEN_ENCRYPTION_KEY='11'.repeat(32);
 const bytes=fs.readFileSync(process.env.FIELD_RISE_PREFLIGHT_FIXTURE);assert.equal(bytes.length,100);
 sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('target',owner,bytes.length,'video/mp4',1,0);
 env.BUCKET.get=async()=>({body:bytes,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
 const r=await req('media/preflight','POST',{assetId:'target',consent:true});assert.equal(r.status,200);const p=await r.json();const u=new URL(p.url);owner=null;
 const get=()=>handle(new Request(u),u.pathname.slice(5).split('/'));
 assert.equal((await get()).status,200);assert.deepEqual(Buffer.from(await(await get()).arrayBuffer()),bytes);
 const altered=new URL(u);altered.pathname=altered.pathname.slice(0,-1)+(altered.pathname.endsWith('a')?'b':'a');assert.equal((await handle(new Request(altered),altered.pathname.slice(5).split('/'))).status,404);
 sqlite.prepare("UPDATE leases SET expires=0 WHERE job_id='preflight'").run();assert.equal((await get()).status,404);
 assert.equal(calls.length,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,0);
});
async function transferFixture(){trackPulls=true;
 await enable();sqlite.prepare('UPDATE connections SET name=?').run('Runa-Girl8215');
 const bytes=fs.readFileSync(process.env.FIELD_RISE_PREFLIGHT_FIXTURE);
 sqlite.prepare('UPDATE assets SET size=?,type=?').run(bytes.length,'video/mp4');
 env.BUCKET.get=async()=>({body:bytes,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
 const id=(await(await req('drafts','POST',{...draft,kind:'VIDEO',assets:['asset-a']})).json()).id;
 apiResponse=(url)=>{assert(url.startsWith('https://studio.example/api/media/pull/'));return Promise.resolve(new Response(bytes,{headers:{'Content-Length':String(bytes.length)}}));};
 return {id,bytes,request:{draftId:id,revision:1,consent:true}};
}
test('transfer prepare validates full actual URL without TikTok or job', {skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();const r=await req('tiktok/prepare-inbox','POST',x.request);assert.equal(r.status,200);const p=await r.json();assert.equal(p.verified,true);assert.equal(calls.length,1);assert.equal(calls[0].options.headers,undefined);assert.equal(calls[0].options.redirect,'manual');assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);
});
test('transfer prepare rejects redirect and never calls TikTok',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(null,{status:302,headers:{Location:'https://evil.example'}});assert.equal((await req('tiktok/prepare-inbox','POST',x.request)).status,502);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);assert(calls.every(x=>x.url.startsWith('https://studio.example/')));
});
test('transfer prepare rejects wrong full hash and no automatic send',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(new Uint8Array(x.bytes.length));assert.equal((await req('tiktok/prepare-inbox','POST',x.request)).status,502);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);
});
test('transfer prepare stops timeout without retry',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>{throw Error('synthetic sensitive timeout')};assert.equal((await req('tiktok/prepare-inbox','POST',x.request)).status,502);assert.equal(calls.length,1);
});
test('transfer send uses exact verified URL only after explicit action',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();const p=await(await req('tiktok/prepare-inbox','POST',x.request)).json();const verifiedUrl=calls[0].url;
 const b={...x.request,requestKey:'approved-once',transferKey:p.transferKey,confirmSend:false};assert.equal((await req('jobs','POST',b)).status,403);assert.equal(calls.length,1);
 apiResponse=url=>url.startsWith('https://studio.example/')?new Response(x.bytes,{headers:{'Content-Length':String(x.bytes.length)}}):Response.json({data:{publish_id:'synthetic-p'},error:{code:'ok'}});
 assert.equal((await req('jobs','POST',{...b,confirmSend:true})).status,200);assert.equal(calls[1].url,verifiedUrl);assert.equal(JSON.parse(calls[2].options.body).source_info.video_url,verifiedUrl);
 assert.equal((await req('jobs','POST',{...b,confirmSend:true,requestKey:'second'})).status,409);assert.equal(calls.length,3);
});
test('transfer prepared URL expiry blocks before any TikTok call',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();const p=await(await req('tiktok/prepare-inbox','POST',x.request)).json();sqlite.prepare("UPDATE leases SET expires=0 WHERE job_id LIKE 'ready:%'").run();
 assert.equal((await req('jobs','POST',{...x.request,requestKey:'one',transferKey:p.transferKey,confirmSend:true})).status,403);assert.equal(calls.length,1);
});
test('transfer partial response stops before TikTok init',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(x.bytes.subarray(0,50),{headers:{'Content-Length':String(x.bytes.length)}});assert.equal((await req('tiktok/prepare-inbox','POST',x.request)).status,502);assert.equal(calls.length,1);
});
test('transfer complete body with absent length header remains fully verified',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(x.bytes);
 const r=await req('tiktok/prepare-inbox','POST',x.request);assert.equal(r.status,200);assert.equal((await r.json()).size,x.bytes.length);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);
});

async function diagnosedAttempt(response,inbox=false){
 const id=await enable();if(inbox){env.TIKTOK_MODE='sandbox';sqlite.prepare('UPDATE assets SET type=?').run('video/mp4');}apiResponse=response;const logs=[];const original=console.info;console.info=value=>logs.push(JSON.parse(value));
 try{return {response:await req('jobs','POST',{draftId:id,revision:1,requestKey:'diagnostic-once',consent:true}),logs};}finally{console.info=original;}
}
test('diagnostic success records stages only and saved history',async()=>{
 const {response,logs}=await diagnosedAttempt(()=>Response.json({data:{publish_id:'private-id'},error:{code:'ok'}}));
 assert.equal(response.status,200);assert.deepEqual(logs.map(x=>x.stage),['BEFORE_API','COMMUNICATION_START','HTTP_RESPONSE','JSON_PARSE','D1_SAVE','D1_SAVED']);
 for(const log of logs)assert(Object.keys(log).every(k=>['event','stage','httpStatus','outcome'].includes(k)));
 assert(!JSON.stringify(logs).includes('private-id'));assert.equal((await(await req('jobs')).json()).length,1);
});
test('diagnostic transport failure preserves unknown and never retries',async()=>{
 const {response,logs}=await diagnosedAttempt(()=>{throw Error('private-response-token-url')});
 assert.equal(response.status,502);assert.equal((await response.json()).state,'STATUS_UNKNOWN');
 assert(logs.some(x=>x.stage==='COMMUNICATION_START'&&x.outcome==='FAILED'));assert(!logs.some(x=>x.stage==='HTTP_RESPONSE'));
 assert(!JSON.stringify(logs).includes('private-response'));assert.equal(calls.length,1);
 const rows=await(await req('jobs')).json();assert.equal(rows.length,1);assert.equal(rows[0].state,'STATUS_UNKNOWN');
});
test('diagnostic JSON failure distinguishes received HTTP response',async()=>{
 const {response,logs}=await diagnosedAttempt(()=>new Response('private-response',{status:200}));
 assert.equal(response.status,502);assert(logs.some(x=>x.stage==='HTTP_RESPONSE'&&x.httpStatus===200));
 assert(logs.some(x=>x.stage==='JSON_PARSE'&&x.outcome==='FAILED'));assert(!JSON.stringify(logs).includes('private-response'));
});
test('diagnostic HTTP error records status without response body',async()=>{
 const {response,logs}=await diagnosedAttempt(()=>Response.json({error:{code:'invalid_param',message:'private-content'}},{status:400}));
 assert.equal(response.status,502);assert.equal((await response.json()).state,'FAILED');assert(logs.some(x=>x.stage==='HTTP_RESPONSE'&&x.httpStatus===400));assert(!JSON.stringify(logs).includes('private-content'));
});
test('diagnostic D1 result failure is distinct and preserves unknown record',async()=>{
 const original=Query.prototype.run;let failed=false;
 Query.prototype.run=async function(){if(this.q.startsWith('UPDATE jobs SET state=?,error=?,publish_id=')&&!failed){failed=true;throw Error('private-db-detail')}return original.call(this)};
 try{const {response,logs}=await diagnosedAttempt(()=>Response.json({data:{publish_id:'private-id'},error:{code:'ok'}}));assert.equal(response.status,502);assert(logs.some(x=>x.stage==='D1_SAVE'&&x.outcome==='FAILED'));assert.equal((await(await req('jobs')).json())[0].state,'STATUS_UNKNOWN');assert.equal(calls.length,1);assert(!JSON.stringify(logs).includes('private-db-detail'));}finally{Query.prototype.run=original;}
});
test('Inbox phase1 manual redirect rejects 302 and preserves UNKNOWN',async()=>{
 const {response}=await diagnosedAttempt((url,options)=>{assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://synthetic.invalid/'}})},true);
 assert.equal(response.status,502);assert.equal((await response.json()).error,'TIKTOK_UNEXPECTED_REDIRECT');assert.equal(calls.length,1);assert.equal(sqlite.prepare('SELECT state FROM jobs').get().state,'STATUS_UNKNOWN');
});
test('Inbox phase1 fixed categories hide raw exceptions',async()=>{
 for(const name of ['TimeoutError','AbortError','TypeError','Error']){
 const id=await enable();env.TIKTOK_MODE='sandbox';sqlite.prepare('UPDATE assets SET type=?').run('video/mp4');;const logs=[];const old=console.info;console.info=x=>logs.push(JSON.parse(x));apiResponse=()=>{const e=new Error('synthetic-secret-url');e.name=name;throw e};
 try{const r=await req('jobs','POST',{draftId:id,revision:1,requestKey:'phase1-'+name,consent:true});assert.equal((await r.json()).state,'STATUS_UNKNOWN');assert(logs.some(x=>x.category===({TimeoutError:'TIMEOUT',AbortError:'ABORT',TypeError:'TYPE_ERROR',Error:'OTHER'}[name])));assert(!JSON.stringify(logs).includes('synthetic-secret-url'));}finally{console.info=old}
 sqlite.prepare('DELETE FROM send_attempts').run();sqlite.prepare('DELETE FROM send_grants').run();sqlite.prepare('DELETE FROM leases').run();sqlite.prepare('DELETE FROM jobs').run();sqlite.prepare('DELETE FROM connections').run();sqlite.prepare('DELETE FROM assets').run();sqlite.prepare('DELETE FROM drafts').run();
 }
});


test('T07b direct upload and preparation remain blocked during UNKNOWN deletion',async()=>{await diagnosedAttempt(()=>{throw new TypeError('canary')});assert.equal((await req('account','DELETE')).status,202);assert.equal((await req('assets','POST',{})).status,403);assert.equal((await req('tiktok/prepare-inbox','POST',{consent:true})).status,403);assert.equal((await(await req('me')).json()).sendGate.allowed,false);assert.equal(calls.length,1)});
test('T07b R2 failure preserves manifest and bounded retry completes without 24h delay',async()=>{await diagnosedAttempt(()=>{throw new TypeError('canary')});assert.equal((await req('account','DELETE')).status,202);sqlite.prepare('UPDATE maintenance_control SET paused=0').run();const original=env.BUCKET.delete;env.BUCKET.delete=async()=>{throw Error('canary-private-r2')};const failed=await safety.runMaintenance(env,()=>security.now());assert.equal(failed.failed,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM assets').get().n,1);env.BUCKET.delete=original;const completed=await safety.runMaintenance(env,()=>security.now());assert.equal(completed.processed,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,0);assert.equal(sqlite.prepare('SELECT state FROM send_grants').get().state,'CONSUMED');assert.equal(sqlite.prepare('SELECT state FROM send_attempts').get().state,'UNKNOWN');await register();assert.equal((await(await req('me')).json()).sendGate.allowed,false);assert.equal(calls.length,1)});
test('T10b maintenance runner completes queued deletion at 24h using only local R2',async()=>{await diagnosedAttempt(()=>{throw new TypeError('canary')});await req('account','DELETE');sqlite.prepare('UPDATE maintenance_control SET paused=0').run();const completed=await safety.processDeletionQueue(env,security.now()+86400);assert.equal(completed.completed,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM assets WHERE ready>=0').get().n,0);assert.equal(sqlite.prepare('SELECT state FROM send_attempts').get().state,'UNKNOWN');assert.equal(calls.length,1)});
test('T18 HKDF identity is stable, separated by owner and app, and rejects invalid keys',async()=>{const a=await safety.safetyContext({...env,TIKTOK_MODE:'sandbox'},'alice','same-open');const b=await safety.safetyContext({...env,TIKTOK_MODE:'sandbox'},'bob','same-open');assert.equal(a.accountKey,b.accountKey);assert.notEqual(a.ownerKey,b.ownerKey);const c=await safety.safetyContext({...env,TIKTOK_MODE:'sandbox',TIKTOK_CLIENT_KEY:'other-app'},'alice','same-open');assert.notEqual(a.accountKey,c.accountKey);await assert.rejects(()=>safety.safetyContext({...env,TOKEN_ENCRYPTION_KEY:'bad'},'alice','same-open'));await assert.rejects(()=>safety.safetyContext({...env,TIKTOK_MODE:'production'},'alice','same-open'));});
test('review: deletion retains a discoverable tombstone for an unfinished upload',async()=>{await register();sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('inflight',owner,100,'video/mp4',0,security.now());const r=await req('account','DELETE');assert.equal(r.status,202);sqlite.prepare('UPDATE maintenance_control SET paused=0').run();await safety.runMaintenance(env,()=>security.now());assert.equal(sqlite.prepare('SELECT ready FROM assets WHERE id=?').get('inflight').ready,-1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM profiles').get().n,0)});
test('review: callback paused during deletion cannot recreate credentials',async()=>{await register();let deleted=false;apiResponse=async url=>{if(url.includes('/oauth/token/'))return tokenSuccess();if(!deleted){deleted=true;assert.equal((await req('account','DELETE')).status,202);sqlite.prepare('UPDATE maintenance_control SET paused=0').run();await safety.runMaintenance(env,()=>security.now());await register();}return Response.json({data:{user:{open_id:'synthetic-open',display_name:'Private',avatar_url:''}},error:{code:'ok'}})};const r=await callbackAttempt();assert.notEqual(r.status,303);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,0)});

test('review: R2 upload finishing after deletion stays discoverable until swept',async()=>{await register();let start,release;const started=new Promise(r=>start=r),barrier=new Promise(r=>release=r);let late=false,failDelete=false;env.BUCKET.put=async(k,stream)=>{const reader=stream.getReader();while(!(await reader.read()).done){}start();await barrier;late=true;failDelete=true;throw Error('synthetic-worker-stop')};env.BUCKET.delete=async()=>{if(failDelete)throw Error('synthetic-stop');late=false};const pending=handle(new Request('https://studio.example/api/assets',{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'video/mp4','Content-Length':'100'},body:syntheticBytes}),['assets']);await started;assert.equal((await req('account','DELETE')).status,202);sqlite.prepare('UPDATE maintenance_control SET paused=0').run();await safety.runMaintenance(env,()=>security.now());assert.equal(sqlite.prepare('SELECT ready FROM assets').get().ready,-1);release();assert.equal((await pending).status,500);assert.equal(late,true);failDelete=false;const cleanup=await safety.processDeletionQueue(env,security.now());assert.equal(cleanup.failed,0);assert.equal(late,false);assert.equal(sqlite.prepare('SELECT ready FROM assets').get().ready,-1);});

test('T17 exact Version14 ignores new control but external OFF prevents old transport',async()=>{const id=await enable();const old=compile('tests/fixtures/version14-server.fixture.txt',{'cloudflare:workers':{env},'../app/chatgpt-auth':{getChatGPTUser:async()=>({userId:owner,displayName:owner})},'./policy.mjs':policy,'./security':security}).handle;sqlite.prepare('UPDATE send_control SET halted=1').run();const body={draftId:id,revision:1,requestKey:'old-once',consent:true,confirmSend:true,transferKey:'aa'.repeat(32)};const request=()=>new Request('https://studio.example/api/jobs',{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal((await old(request(),['jobs'])).status,200);assert.equal(calls.length,1);env.TIKTOK_ENABLED='false';assert.equal((await old(request(),['jobs'])).status,503);assert.equal(calls.length,1);});
test('B02 key-unavailable deletion retains auth and queues safe rescue',async()=>{await register();env.TOKEN_ENCRYPTION_KEY='invalid';const r=await req('account','DELETE');assert.equal(r.status,202);assert.equal((await r.json()).needsReview,true);assert.equal(sqlite.prepare('SELECT state FROM deletion_tasks').get().state,'QUEUED');assert.equal(sqlite.prepare('SELECT deleting FROM profiles').get().deleting,1);assert.equal(calls.length,0)});
test('B02 rescue refuses unauthenticated owner',async()=>{await register();env.TOKEN_ENCRYPTION_KEY='invalid';owner=null;assert.equal((await req('account','DELETE')).status,401);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM deletion_tasks').get().n,0)});
function isolatedBarrier(){let stopped=false,inflight=0,waiters=[];return {stop(){stopped=true},async route(handler,request){if(stopped)return new Response(null,{status:503});inflight++;try{return await handler(request)}finally{if(--inflight===0){for(const r of waiters)r();waiters=[]}}},async drain(){if(inflight)await new Promise(r=>waiters.push(r))},get inflight(){return inflight}}}
test('B04 modeled outer barrier blocks actual old and new handlers across version paths',async()=>{const id=await enable();const old=compile('tests/fixtures/version14-server.fixture.txt',{'cloudflare:workers':{env},'../app/chatgpt-auth':{getChatGPTUser:async()=>({userId:owner,displayName:owner})},'./policy.mjs':policy,'./security':security}).handle;const barrier=isolatedBarrier();barrier.stop();for(const handler of [old,handle])for(const origin of ['https://studio.example','https://preview.example','https://old.example']){const request=new Request(origin+'/api/jobs',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({draftId:id,revision:1,requestKey:'blocked',consent:true,confirmSend:true,transferKey:'aa'.repeat(32)})});assert.equal((await barrier.route(r=>handler(r,['jobs']),request)).status,503)}assert.equal(calls.length,0)});
test('B04 modeled drain waits for pre-stop inflight transport instead of claiming cancellation',async()=>{const id=await enable();let start,release;const begun=new Promise(r=>start=r),pending=new Promise(r=>release=r);apiResponse=async()=>{start();await pending;return Response.json({data:{publish_id:'synthetic-publish'},error:{code:'ok'}})};const barrier=isolatedBarrier();const request=new Request('https://studio.example/api/jobs',{method:'POST',headers:{Origin:'https://studio.example','Content-Type':'application/json'},body:JSON.stringify({draftId:id,revision:1,requestKey:'inflight',consent:true,confirmSend:true,transferKey:'aa'.repeat(32)})});const first=barrier.route(r=>handle(r,['jobs']),request);await begun;barrier.stop();let drained=false;const drain=barrier.drain().then(()=>drained=true);await Promise.resolve();assert.equal(drained,false);assert.equal((await barrier.route(r=>handle(r,['jobs']),request)).status,503);release();await first;await drain;assert.equal(drained,true);assert.equal(calls.length,1)});
