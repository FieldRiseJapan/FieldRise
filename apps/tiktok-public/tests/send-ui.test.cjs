const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
test('UI renders a fixed stop notice without internal ledger fields',()=>{
 assert.ok(fs.existsSync('app/studio/send-safety-view.tsx'),'missing fixed safety notice');
 const out=ts.transpileModule(fs.readFileSync('app/studio/send-safety-view.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;const exports={};vm.runInNewContext(out,{exports,require});
 const React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
 for(const code of ['SANDBOX_SEND_LIMIT','SEND_SAFETY_NOT_READY','ACCOUNT_DELETION_PENDING']){const html=render(React.createElement(exports.SendSafetyNotice,{gate:{allowed:false,code,ownerKey:'canary',grant_id:'canary'}}));assert(html.includes(code));assert(!html.includes('canary'));}
 assert.equal(render(React.createElement(exports.SendSafetyNotice,{gate:{allowed:true,code:'READY'}})),'');
});
test('send button checks the server gate and treats missing data as blocked',async()=>{assert.ok(fs.existsSync('lib/send-ui.mjs'));const {sendBlocked}=await import('../lib/send-ui.mjs');assert.equal(sendBlocked({sendGate:{allowed:true}}),false);for(const me of [{},{sendGate:{allowed:false}},{deleting:true,sendGate:{allowed:true}},null])assert.equal(sendBlocked(me),true)});
