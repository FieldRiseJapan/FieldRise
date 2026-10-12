const {test,beforeEach,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');const {webcrypto}=require('node:crypto');
let sqlite,owner,env,calls,apiResponse;
class Query{constructor(q,v=[]){this.q=q;this.v=v;}bind(...v){return new Query(this.q,v)}async first(){return sqlite.prepare(this.q).get(...this.v)||null}async all(){return {results:sqlite.prepare(this.q).all(...this.v)}}async run(){const r=sqlite.prepare(this.q).run(...this.v);return {meta:{changes:Number(r.changes)}}}}
function compile(path,mocks){const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};vm.runInNewContext(source,{exports,require:n=>mocks[n]||require(n),crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,URL,URLSearchParams,Response,Request,AbortSignal,Date,JSON,atob,btoa,fetch:async(url,options)=>{calls.push({url,options});return apiResponse(url,options)},console});return exports;}
let handle,security,policy;
beforeEach(async()=>{if(sqlite)sqlite.close();sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_clammy_captain_america.sql','utf8'));owner='alice';calls=[];apiResponse=()=>Response.json({data:{publish_id:'publish-test',status:'SEND_TO_USER_INBOX'},error:{code:'ok'}});const bucket=new Map();env={DB:{prepare:q=>new Query(q),batch:async qs=>{sqlite.exec('BEGIN');try{const results=[];for(const q of qs)results.push(await q.run());sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}},BUCKET:{get:async k=>bucket.has(k)?{body:bucket.get(k),size:bucket.get(k).length}:null,put:async(k,b)=>bucket.set(k,b),delete:async k=>bucket.delete(k)},SITE_ORIGIN:'https://studio.example'};policy=await import('../lib/policy.mjs');security=compile('lib/security.ts',{'./policy.mjs':policy});handle=compile('lib/server.ts',{'cloudflare:workers':{env},'../app/chatgpt-auth':{getChatGPTUser:async()=>owner?{userId:owner,displayName:owner}:null},'./policy.mjs':policy,'./security':security}).handle;});
after(()=>sqlite?.close());
async function req(path,method='GET',value,headers={}){const r=new Request('https://studio.example/api/'+path,{method,headers:{Origin:'https://studio.example',...(value?{'Content-Type':'application/json'}:{}),...headers},body:value?JSON.stringify(value):undefined});return handle(r,path.split('/'));}
const register=()=>req('register','POST',{consent:true});
const draft={kind:'PHOTO',title:'Test',description:'#test',assets:[],cover:0,aigc:false};
async function create(){return (await (await req('drafts','POST',draft)).json()).id;}
async function enable(){env.TIKTOK_ENABLED='true';env.TIKTOK_CLIENT_KEY='test-client';env.TIKTOK_CLIENT_SECRET='test-secret';env.TOKEN_ENCRYPTION_KEY='11'.repeat(32);env.MEDIA_DOMAIN_VERIFIED='true';env.TIKTOK_MODE='sandbox';await register();sqlite.prepare('INSERT INTO connections(owner,open_id,secret,name,avatar,scopes,expires) VALUES(?,?,?,?,?,?,?)').run(owner,'open-'+owner,await security.crypt(JSON.stringify({access_token:'test-access',refresh_token:'test-refresh'}),env.TOKEN_ENCRYPTION_KEY,owner),'Tester','','user.info.basic,video.upload',security.now()+3600);sqlite.prepare('INSERT INTO assets(id,owner,size,type,ready,created) VALUES(?,?,?,?,?,?)').run('asset-a',owner,100,'image/jpeg',1,security.now());return (await (await req('drafts','POST',{...draft,assets:['asset-a']})).json()).id;}
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
test('inbox photo payload uses MEDIA_UPLOAD and not Direct Post',async()=>{const id=await enable();const r=await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true});assert.equal(r.status,200);const payload=JSON.parse(calls[0].options.body);assert.equal(payload.post_mode,'MEDIA_UPLOAD');assert.equal(payload.source_info.photo_images.length,1);assert(!('privacy_level' in payload.post_info));assert(!('auto_add_music' in payload.post_info))});
test('duplicate send returns same job without second call',async()=>{const id=await enable();const b={draftId:id,revision:1,requestKey:'once',consent:true};const a=await(await req('jobs','POST',b)).json(),c=await(await req('jobs','POST',b)).json();assert.equal(a.id,c.id);assert.equal(calls.length,1)});
test('send consent and latest revision are required',async()=>{const id=await enable();assert.equal((await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:false})).status,400);assert.equal((await req('jobs','POST',{draftId:id,revision:0,requestKey:'once',consent:true})).status,409);assert.equal(calls.length,0)});
test('foreign transfer status is inaccessible',async()=>{const id=await enable();const job=await(await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true})).json();owner='bob';await register();assert.equal((await req('jobs/'+job.id,'POST',{})).status,404)});
test('Inbox arrival is never represented as publication',async()=>{const id=await enable();const job=await(await req('jobs','POST',{draftId:id,revision:1,requestKey:'once',consent:true})).json();const r=await(await req('jobs/'+job.id,'POST',{})).json();assert.equal(r.state,'INBOX_SENT')});
test('expired public media capability does not reveal asset',async()=>{await register();sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('asset-a','alice',1,'image/jpeg',1,0);sqlite.prepare('INSERT INTO leases VALUES(?,?,?,?,?)').run(await security.hash('test'),'alice','asset-a','job',0);owner=null;assert.equal((await req('media/pull/test')).status,404)});
test('account delete isolates other users',async()=>{await register();await create();owner='bob';await register();await create();owner='alice';assert.equal((await req('account','DELETE')).status,200);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get('alice').n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM drafts WHERE owner=?').get('bob').n,1)});
test('video Inbox payload does not falsely include caption',()=>{const p=policy.inboxPayload({...draft,kind:'VIDEO',assets:['x']},['https://studio.example/a']);assert.deepEqual(p,{source_info:{source:'PULL_FROM_URL',video_url:'https://studio.example/a'}})});
test('crop reuses correct existing calculation without music seed',()=>{assert.deepEqual(policy.crop(2000,1000,1),{sx:500,sy:0,sw:1000,sh:1000})});

test('ambiguous network failure locks retry and is not success',async()=>{const id=await enable();apiResponse=()=>{throw Error('network timeout')};const b={draftId:id,revision:1,requestKey:'once',consent:true};const r=await req('jobs','POST',b);assert.equal(r.status,502);assert.equal((await r.json()).state,'STATUS_UNKNOWN');assert.equal((await req('jobs','POST',{...b,requestKey:'twice'})).status,429);assert.equal(calls.length,1)});
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
 const bytes=fs.readFileSync(process.env.FIELD_RISE_PREFLIGHT_FIXTURE);assert.equal(bytes.length,2971884);
 sqlite.prepare('INSERT INTO assets VALUES(?,?,?,?,?,?)').run('target',owner,bytes.length,'video/mp4',1,0);
 env.BUCKET.get=async()=>({body:bytes,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
 const r=await req('media/preflight','POST',{assetId:'target',consent:true});assert.equal(r.status,200);const p=await r.json();const u=new URL(p.url);owner=null;
 const get=()=>handle(new Request(u),u.pathname.slice(5).split('/'));
 assert.equal((await get()).status,200);assert.deepEqual(Buffer.from(await(await get()).arrayBuffer()),bytes);
 const altered=new URL(u);altered.pathname=altered.pathname.slice(0,-1)+(altered.pathname.endsWith('a')?'b':'a');assert.equal((await handle(new Request(altered),altered.pathname.slice(5).split('/'))).status,404);
 sqlite.prepare("UPDATE leases SET expires=0 WHERE job_id='preflight'").run();assert.equal((await get()).status,404);
 assert.equal(calls.length,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM connections').get().n,0);
});
async function transferFixture(){
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
 const b={...x.request,requestKey:'approved-once',transferKey:p.transferKey};assert.equal((await req('jobs','POST',b)).status,403);assert.equal(calls.length,1);
 apiResponse=url=>url.startsWith('https://studio.example/')?new Response(x.bytes,{headers:{'Content-Length':String(x.bytes.length)}}):Response.json({data:{publish_id:'synthetic-p'},error:{code:'ok'}});
 assert.equal((await req('jobs','POST',{...b,confirmSend:true})).status,200);assert.equal(calls[1].url,verifiedUrl);assert.equal(JSON.parse(calls[2].options.body).source_info.video_url,verifiedUrl);
 assert.equal((await req('jobs','POST',{...b,confirmSend:true,requestKey:'second'})).status,403);assert.equal(calls.length,3);
});
test('transfer prepared URL expiry blocks before any TikTok call',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();const p=await(await req('tiktok/prepare-inbox','POST',x.request)).json();sqlite.prepare("UPDATE leases SET expires=0 WHERE job_id LIKE 'ready:%'").run();
 assert.equal((await req('jobs','POST',{...x.request,requestKey:'one',transferKey:p.transferKey,confirmSend:true})).status,403);assert.equal(calls.length,1);
});
test('transfer partial response stops before TikTok init',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(x.bytes.subarray(0,100),{headers:{'Content-Length':String(x.bytes.length)}});assert.equal((await req('tiktok/prepare-inbox','POST',x.request)).status,502);assert.equal(calls.length,1);
});
test('transfer complete body with absent length header remains fully verified',{skip:!process.env.FIELD_RISE_PREFLIGHT_FIXTURE},async()=>{
 const x=await transferFixture();apiResponse=()=>new Response(x.bytes);
 const r=await req('tiktok/prepare-inbox','POST',x.request);assert.equal(r.status,200);assert.equal((await r.json()).size,x.bytes.length);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,0);
});

async function diagnosedAttempt(response){
 const id=await enable();apiResponse=response;const logs=[];const original=console.info;console.info=value=>logs.push(JSON.parse(value));
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
 Query.prototype.run=async function(){if(this.q.startsWith('UPDATE jobs SET state=?,publish_id=')&&!failed){failed=true;throw Error('private-db-detail')}return original.call(this)};
 try{const {response,logs}=await diagnosedAttempt(()=>Response.json({data:{publish_id:'private-id'},error:{code:'ok'}}));assert.equal(response.status,502);assert(logs.some(x=>x.stage==='D1_SAVE'&&x.outcome==='FAILED'));assert.equal((await(await req('jobs')).json())[0].state,'STATUS_UNKNOWN');assert.equal(calls.length,1);assert(!JSON.stringify(logs).includes('private-db-detail'));}finally{Query.prototype.run=original;}
});
