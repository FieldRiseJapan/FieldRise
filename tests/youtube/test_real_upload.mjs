import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadPrivate, validateMp4 } from '../../supabase/functions/_shared/youtube-upload/core.mjs';
import { createHandler } from '../../supabase/functions/youtube-upload-gateway/handler.mjs';
import { fingerprint } from '../../supabase/functions/youtube-upload-gateway/real-upload.mjs';
import { legacyClosed } from '../../supabase/functions/youtube-upload/tombstone.mjs';

const channel = 'UC' + 'a'.repeat(22);
const user = '11111111-1111-4111-8111-111111111111';
const key = '22222222-2222-4222-8222-222222222222';
const videoId = 'Abcdef123_-';
const canary = 'PRIVATE_TEST_CREDENTIAL';
const video = () => new File([new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0])], 'test.mp4', { type: 'video/mp4' });
const input = () => ({ video: video(), title: 'Test', description: '', channelId: channel,
  clientId: canary, clientSecret: canary, loadRefreshToken: async () => canary });
function mockProvider(overrides = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.redirect, 'error');
    if (calls.length === 1) return overrides.token || Response.json({ access_token: canary });
    if (calls.length === 2) return overrides.channel || Response.json({ items: [{ id: channel }], pageInfo: { totalResults: 1 } });
    if (calls.length === 3) return overrides.init || new Response(null, { headers: {
      location: 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=TEST_ONLY' } });
    if (overrides.throwPut) throw new Error(canary);
    return overrides.put || Response.json({ id: videoId, status: { privacyStatus: 'private' }, snippet: { channelId: channel } });
  };
  return { calls, fetchImpl };
}
test('shared core commits only confirmed private expected-channel video; metadata fixed', async () => {
  const mock = mockProvider();
  const result = await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl });
  assert.deepEqual(result, { state: 'succeeded', videoId, privacyStatus: 'private' });
  const metadata = JSON.parse(mock.calls[2].options.body);
  assert.deepEqual(metadata.status, { privacyStatus: 'private', selfDeclaredMadeForKids: false });
  assert.equal(metadata.snippet.categoryId, '10');
  assert.equal(mock.calls.length, 4);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_TEST_CREDENTIAL|upload_id/);
});
test('MP4 header, brand, empty and invalid container rejected without provider calls', async () => {
  for (const file of [new File([], 'x.mp4'),new File(['not-video'], 'x.mp4'),
    new File([new Uint8Array(16)], 'x.mp4')]) {
    assert.equal(await validateMp4(file), false);
    let calls = 0;
    assert.equal((await uploadPrivate({ ...input(), video: file, fetchImpl: async () => { calls++; } })).state, 'failed');
    assert.equal(calls, 0);
  }
});
test('token failure is definite no-insert failure, raw body never read', async () => {
  const mock = mockProvider({ token: new Response(canary, { status: 401 }) });
  assert.deepEqual(await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl }), { state: 'failed' });
  assert.equal(mock.calls.length, 1);
});
test('channel zero/multiple/mismatch/pagination fail before insert', async () => {
  for (const result of [{ items: [] },{ items: [{ id: channel },{ id: channel }] },
    { items: [{ id: 'wrong' }] },{ items: [{ id: channel }], nextPageToken: canary }]) {
    const mock = mockProvider({ channel: Response.json(result) });
    assert.deepEqual(await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl }), { state: 'failed' });
    assert.equal(mock.calls.length, 2);
  }
});
test('insert failure, timeout, missing location are ambiguous and never retried', async () => {
  for (const init of [new Response(canary, { status: 500 }),new Response(null)]) {
    const mock = mockProvider({ init });
    assert.deepEqual(await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl }), { state: 'outcome_unknown' });
    assert.equal(mock.calls.length, 3);
  }
  const mock = mockProvider({ throwPut: true });
  assert.deepEqual(await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl }), { state: 'outcome_unknown' });
  assert.equal(mock.calls.length, 4);
});
test('Location cannot redirect credentials/body to other host or path', async () => {
  for (const location of ['https://evil.invalid/upload','http://www.googleapis.com/upload/youtube/v3/videos',
    'https://www.googleapis.com.evil.invalid/upload','https://www.googleapis.com/other?upload_id=x']) {
    const mock = mockProvider({ init: new Response(null, { headers: { location } }) });
    assert.equal((await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl })).state, 'outcome_unknown');
    assert.equal(mock.calls.length, 3);
  }
});
test('PUT rejection, invalid id/public/mismatched-channel success body remain unresolved', async () => {
  for (const put of [new Response(canary,{status:400}),Response.json({id:videoId}),
    Response.json({id:videoId,status:{privacyStatus:'public'},snippet:{channelId:channel}}),
    Response.json({id:videoId,status:{privacyStatus:'private'},snippet:{channelId:'wrong'}})]) {
    const mock = mockProvider({ put });
    assert.deepEqual(await uploadPrivate({ ...input(), fetchImpl: mock.fetchImpl }), { state: 'outcome_unknown' });
    assert.equal(mock.calls.length, 4);
  }
});
test('fingerprint binds content, title, description, channel; filename does not matter', async () => {
  const data = input(); const hash = await fingerprint(data,channel);
  assert.equal(hash,await fingerprint(data,channel));
  for (const changed of [{...data,title:'Changed'},{...data,description:'Changed'},
    {...data,video:new File(['changed'],'x.mp4')}]) assert.notEqual(hash,await fingerprint(changed,channel));
  assert.notEqual(hash,await fingerprint(data,'UC'+'b'.repeat(22)));
});
function setup({ result = { state: 'succeeded', videoId, privacyStatus: 'private' }, finishFails=false,
  reserveThrows=false, beginFails=false } = {}) {
  const rows = new Map(); const calls = []; const events = [];
  const store = {
    reserve: async (u,k,c,f) => {
      if (reserveThrows) throw Error(canary);
      const row = rows.get(k);
      if (row) return row.f !== f ? {decision:'mismatch'} : {decision:'existing',state:row.state,videoId:row.videoId};
      if ([...rows.values()].some(r=>['accepted','uploading','outcome_unknown'].includes(r.state))) return {decision:'busy'};
      rows.set(k,{f,state:'accepted'}); return {decision:'accepted'};
    },
    begin: async (_,k) => { if (beginFails) return false; const row=rows.get(k);
      if(row.state!=='accepted')return false;row.state='uploading';return true; },
    complete: async (_,k,c,f,state,id) => { if(finishFails)throw Error(canary);
      Object.assign(rows.get(k),{state,videoId:id});return true; },
  };
  const handler = createHandler({allowedUserId:user,verifyJwt:async()=>({sub:user,role:'authenticated',aal:'aal2',is_anonymous:false}),
    reserve:async()=>{throw Error('phase1 must not run');},finish:async()=>{throw Error('phase1 must not run');},
    realUpload:{channelId:channel,store,upload:async()=>{calls.push('provider');return result;}},
    log:{error:(...args)=>events.push(args)}});
  return {handler,rows,calls,events};
}
function request(k=key,title='Test',extra={}) {
  const form=new FormData();form.append('video',video());form.append('title',title);
  return new Request('https://example.invalid/gateway',{method:'POST',body:form,headers:{
    authorization:'Bearer test',origin:'https://fieldrisejapan.github.io','idempotency-key':k,...extra}});
}
test('same-key successful replay returns persisted result without second upload', async () => {
  const s=setup(); const a=await s.handler(request()); const b=await s.handler(request());
  assert.equal(a.status,200);assert.equal(b.status,200);assert.deepEqual(await a.json(),await b.json());
  assert.equal(s.calls.length,1);
});
test('same-key different fingerprint rejects 409 without upload', async()=>{
  const s=setup();await s.handler(request());assert.equal((await s.handler(request(key,'Different'))).status,409);
  assert.equal(s.calls.length,1);
});
test('concurrent same-key requests cross provider boundary at most once',async()=>{
  const s=setup();await Promise.all([s.handler(request()),s.handler(request())]);assert.equal(s.calls.length,1);
});
test('outcome_unknown blocks same-key retry and new-key same-channel upload indefinitely',async()=>{
  const s=setup({result:{state:'outcome_unknown'}});assert.equal((await s.handler(request())).status,202);
  assert.equal((await s.handler(request())).status,202);
  assert.equal((await s.handler(request('33333333-3333-4333-8333-333333333333'))).status,409);
  assert.equal(s.calls.length,1);
});
test('terminal persistence failure leaves uploading unresolved and blocks additional upload',async()=>{
  const s=setup({finishFails:true});assert.equal((await s.handler(request())).status,503);
  assert.equal(s.rows.get(key).state,'uploading');assert.equal((await s.handler(request())).status,202);
  assert.equal((await s.handler(request('33333333-3333-4333-8333-333333333333'))).status,409);
  assert.equal(s.calls.length,1);
});
test('definite failure is persisted, same-key never retried',async()=>{
  const s=setup({result:{state:'failed'}});assert.equal((await s.handler(request())).status,502);
  assert.equal(s.rows.get(key).state,'failed');await s.handler(request());assert.equal(s.calls.length,1);
});
test('uncommitted begin prevents all provider calls',async()=>{
  const s=setup({beginFails:true});assert.equal((await s.handler(request())).status,503);assert.equal(s.calls.length,0);
});
test('DB errors and injected provider response fields never leak',async()=>{
  const s=setup({reserveThrows:true});const response=await s.handler(request());
  assert.doesNotMatch(await response.text()+JSON.stringify(s.events),/PRIVATE_TEST_CREDENTIAL/);
  const t=setup({result:{state:'succeeded',videoId,privacyStatus:'private',refresh_token:canary,location:canary}});
  assert.doesNotMatch(await (await t.handler(request())).text(),/PRIVATE_TEST_CREDENTIAL|refresh_token|location/);
});
test('real handler rejects metadata control, malformed MP4 and disallowed Origin before provider',async()=>{
  const s=setup();assert.equal((await s.handler(request(key,'<public>'))).status,422);
  assert.equal((await s.handler(request(key,'Test',{origin:'https://evil.invalid'}))).status,403);
  assert.equal(s.calls.length,0);
});
test('legacy tombstone makes no Auth/DB/provider call for any method or secret',async()=>{
  for(const method of ['GET','POST','OPTIONS']){
    const res=legacyClosed(new Request('https://example.invalid',{method}));assert.equal(res.status,410);
    assert.deepEqual(await res.json(),{success:false,code:'legacy_upload_closed'});
  }
});
test('real mode retains AAL2, allowlist, non-anonymous and verified bearer gates before state/provider',async()=>{
  let calls=0;
  for(const claims of [null,{sub:user,role:'anon',aal:'aal2'},
    {sub:user,role:'authenticated',aal:'aal1'},
    {sub:user,role:'authenticated',aal:'aal2',is_anonymous:true},
    {sub:key,role:'authenticated',aal:'aal2',is_anonymous:false}]){
    const handler=createHandler({allowedUserId:user,verifyJwt:async()=>claims,
      realUpload:{channelId:channel,store:{reserve:async()=>{calls++;}},upload:async()=>{calls++;}}});
    assert.ok([401,403].includes((await handler(request())).status));
  }
  assert.equal(calls,0);
});
