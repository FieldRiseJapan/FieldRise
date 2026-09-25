const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appDir = path.join(__dirname, '..', 'automation', 'sns_auto_posting', 'youtube');
const htmlPath = path.join(appDir, 'index.html');
const scriptPath = path.join(appDir, 'creator-studio.js');
let api;
try {
  api = require(scriptPath);
} catch {
  api = null;
}

const validDraft = () => ({
  file: { name: 'test-video.mp4', size: 1024, type: 'video/mp4' },
  title: '  Test title  ',
  description: 'Test description',
  confirmed: true,
});

function requireApi(t) {
  assert.ok(api, 'creator-studio.js must export the frontend validation helpers');
}

test('submission requires a selected video', (t) => {
  requireApi(t);
  assert.equal(api.validateDraft({ ...validDraft(), file: null }).ok, false);
});

test('submission requires a non-empty title', (t) => {
  requireApi(t);
  assert.equal(api.validateDraft({ ...validDraft(), title: '   ' }).ok, false);
});

test('submission requires explicit final confirmation', (t) => {
  requireApi(t);
  assert.equal(api.validateDraft({ ...validDraft(), confirmed: false }).ok, false);
});

test('valid draft trims title and remains private', (t) => {
  requireApi(t);
  assert.deepEqual(api.validateDraft(validDraft()), {
    ok: true,
    value: { title: 'Test title', description: 'Test description', privacyStatus: 'private' },
  });
});

test('submission guard rejects a second concurrent action', (t) => {
  requireApi(t);
  let finish;
  let calls = 0;
  const guarded = api.createSubmissionGuard(() => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  });
  const first = guarded();
  return guarded().then((second) => {
    assert.equal(second, false);
    assert.equal(calls, 1);
    finish(true);
    return first.then((result) => assert.equal(result, true));
  });
});

test('error messages never echo potentially sensitive backend details', (t) => {
  requireApi(t);
  assert.equal(api.safeErrorMessage(new Error('refresh token: hidden')), '投稿できませんでした。認証ゲートウェイの状態を確認してください。');
});

test('page exposes private-only, human-confirmed posting and starts disabled', () => {
  assert.equal(fs.existsSync(htmlPath), true, 'YouTube Creator Studio page must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /id="videoInput"[^>]*required/);
  assert.match(html, /id="titleInput"[^>]*required/);
  assert.match(html, /id="descriptionInput"/);
  assert.match(html, /id="finalConfirm"/);
  assert.match(html, /id="postButton"[^>]*disabled/);
  assert.match(html, /privacyStatus[^<]*private|private[^<]*privacyStatus/i);
  assert.doesNotMatch(html, /value="(?:public|unlisted)"/i);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /認証ゲートウェイ/);
});

test('frontend contains no upload endpoint, fetch call, or embedded credential', () => {
  assert.equal(fs.existsSync(htmlPath), true, 'YouTube Creator Studio page must exist');
  assert.equal(fs.existsSync(scriptPath), true, 'YouTube Creator Studio script must exist');
  const source = `${fs.readFileSync(htmlPath, 'utf8')}\n${fs.readFileSync(scriptPath, 'utf8')}`;
  assert.doesNotMatch(source, /youtube-upload|x-fieldrise-upload-secret/i);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /(?:AIza[0-9A-Za-z_-]{30,}|ya29\.[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/);
});
