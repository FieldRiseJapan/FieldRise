import {test} from 'node:test';import assert from 'node:assert/strict';import {crop,generate,safeUrl,csv,seed} from '../automation/sns_auto_posting/tiktok/photo/core.mjs';
test('portrait crop remains within image at edges',()=>{for(const x of [0,.5,1]){const a=crop(1600,900,.75,x,1);assert.equal(a.sh,900);assert.ok(a.sx>=0);assert.ok(a.sx+a.sw<=1600);assert.equal(a.sw/a.sh,.75);}});
test('landscape crop and composition',()=>{const a=crop(900,1200,16/9,.5,1);assert.equal(a.sw,900);assert.equal(a.sy+a.sh,1200);});
test('relevant templates and unverified seed',()=>{const a=generate('Cafe','窓辺のコーヒー','楽曲を紹介',seed);assert.match(a.description,/cafe/);assert.equal(a.tags,'#カフェ #カフェ時間');assert.equal(seed.isrc,'');assert.match(seed.distribution,/未検証/);});
test('URLs reject executable and credential URLs',()=>{assert.throws(()=>safeUrl('javascript:alert(1)'));assert.throws(()=>safeUrl('https://user:pass@example.com'));assert.equal(safeUrl(''),'');});
test('CSV guards formula injection and escapes quotes',()=>{const s=csv([{description:'=HYPERLINK("x")'}]);assert.match(s,/'=HYPERLINK/);assert.match(s,/""x""/);});
