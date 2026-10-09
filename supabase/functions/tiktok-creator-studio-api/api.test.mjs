import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=stripTypeScriptTypes(readFileSync(new URL('./index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,''));
async function run(action,{consent=true,privacy='SELF_ONLY',brand=false,session=true,origin='https://fieldrisejapan.github.io',owner=true}={}){
 let handler;const calls=[];
 const sb={from(table){const q={select(){return q},eq(){return q},update(){return q},upsert(){return Promise.resolve({error:null})},then(resolve){resolve({error:null})},async maybeSingle(){return {data:table==='tiktok_creator_studio_sessions'?{open_id:'test',expires_at:'2099-01-01'}:table==='tiktok_oauth_tokens'?{access_token:'test-only',expires_at:'2099-01-01'}:owner?{publish_id:'test-job'}:null}}};return q;}};
 const mockFetch=async(url,options)=>{calls.push({url,options});if(url.includes('creator_info'))return Response.json({error:{code:'ok'},data:{privacy_level_options:['SELF_ONLY','PUBLIC_TO_EVERYONE'],comment_disabled:true}});if(url.includes('/init/'))return Response.json({error:{code:'ok'},data:{publish_id:'test-job',upload_url:'https://upload.example.test'}});if(url.includes('/status/'))return Response.json({error:{code:'ok'},data:{status:'SEND_TO_USER_INBOX'}});return new Response(null,{status:201});};
 vm.runInNewContext(source,{Deno:{env:{get:()=> 'dummy'},serve:fn=>handler=fn},createClient:()=>sb,crypto,TextEncoder,Uint8Array,Response,Request,File,URL,URLSearchParams,fetch:mockFetch});
 const headers={origin,...(session?{'x-fieldrise-session':'dummy-session'}:{})};
 const fd=new FormData();fd.append('video',new File(['test bytes'],'test.mp4',{type:'video/mp4'}));fd.append('consent',String(consent));fd.append('privacy_level',privacy);fd.append('brand_content_toggle',String(brand));
 const request=new Request('https://test.invalid/?action='+action,{method:'POST',headers:action==='status'?{...headers,'content-type':'application/json'}:headers,body:action==='status'?JSON.stringify({publish_id:'test-job'}):fd});
 const result=await handler(request);return {status:result.status,body:await result.json(),calls};
}
let n=0;async function test(name,fn){await fn();console.log('PASS',name);n++;}
await test('draft uses inbox endpoint with source_info only',async()=>{const r=await run('upload',{privacy:''});assert.equal(r.status,200);assert.equal(r.calls.filter(c=>c.url.includes('creator_info')).length,0);const init=r.calls.find(c=>c.url.includes('/init/'));assert.ok(init.url.includes('/inbox/video/init/'));assert.deepEqual(Object.keys(JSON.parse(init.options.body)),['source_info']);});
await test('direct uses Direct Post and creator interaction restrictions',async()=>{const r=await run('publish');assert.equal(r.status,200);const init=r.calls.find(c=>c.url.includes('/init/'));assert.ok(init.url.endsWith('/publish/video/init/'));assert.equal(JSON.parse(init.options.body).post_info.disable_comment,true);});
await test('draft requires explicit consent',async()=>{const r=await run('upload',{consent:false});assert.equal(r.status,400);assert.equal(r.calls.length,0);});
await test('missing session cannot upload',async()=>{const r=await run('upload',{session:false});assert.equal(r.status,401);assert.equal(r.calls.length,0);});
await test('foreign origin cannot upload',async()=>{const r=await run('upload',{origin:'https://foreign.invalid'});assert.equal(r.status,403);assert.equal(r.calls.length,0);});
await test('direct privacy must match creator options',async()=>{const r=await run('publish',{privacy:'INVALID'});assert.equal(r.status,400);assert.equal(r.calls.length,1);});
await test('private paid partnership is rejected',async()=>{const r=await run('publish',{brand:true});assert.equal(r.status,400);assert.equal(r.body.error,'branded_content_cannot_be_private');});
await test('status cannot access another owner job',async()=>{const r=await run('status',{owner:false});assert.equal(r.status,404);assert.equal(r.calls.length,0);});
await test('inbox delivery status is preserved',async()=>{const r=await run('status');assert.equal(r.body.status,'SEND_TO_USER_INBOX');});
console.log(`${n} tests passed; mocked services, no real TikTok calls.`);
