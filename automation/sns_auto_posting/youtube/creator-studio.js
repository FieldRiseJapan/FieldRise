(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.YouTubeCreatorStudio = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  function validateDraft(draft) {
    if (!draft || !draft.file || !draft.file.size) {
      return { ok: false, error: '投稿する動画を選択してください。' };
    }
    if (draft.file.type && draft.file.type !== 'video/mp4') {
      return { ok: false, error: 'MP4形式の動画を選択してください。' };
    }
    const title = String(draft.title || '').trim();
    if (!title) return { ok: false, error: 'タイトルを入力してください。' };
    if (!draft.confirmed) return { ok: false, error: '投稿前の最終確認にチェックしてください。' };
    return {
      ok: true,
      value: {
        title,
        description: String(draft.description || '').trim(),
        privacyStatus: 'private',
      },
    };
  }

  function createSubmissionGuard(action) {
    let inFlight = false;
    return async function guardedAction() {
      if (inFlight) return false;
      inFlight = true;
      try {
        return await action();
      } finally {
        inFlight = false;
      }
    };
  }

  function safeErrorMessage() {
    return '投稿できませんでした。認証ゲートウェイの状態を確認してください。';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  const helpers = { validateDraft, createSubmissionGuard, safeErrorMessage, formatBytes };
  if (typeof document === 'undefined') return helpers;

  const $ = (id) => document.getElementById(id);
  const videoInput = $('videoInput');
  const titleInput = $('titleInput');
  const descriptionInput = $('descriptionInput');
  let previewUrl = '';

  function setResult(message, type) {
    const result = $('result');
    if (!result) return;
    result.textContent = message;
    result.className = `result ${type || 'error'}`;
  }

  function updateReview() {
    const file = videoInput.files && videoInput.files[0];
    $('reviewFile').textContent = file ? `${file.name} · ${formatBytes(file.size)}` : '未選択';
    $('reviewTitle').textContent = titleInput.value.trim() || '未入力';
    $('reviewDescription').textContent = descriptionInput.value.trim() || '未入力';
    $('titleCount').textContent = `${titleInput.value.length}文字`;
    $('descriptionCount').textContent = `${descriptionInput.value.length}文字`;
    // Posting remains disabled until a server-side authenticated gateway exists.
    $('postButton').disabled = true;
  }

  videoInput.addEventListener('change', function () {
    const file = videoInput.files && videoInput.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    if (!file) {
      $('fileMeta').textContent = '動画が選択されていません';
      $('videoPreview').classList.add('hidden');
      $('previewEmpty').classList.remove('hidden');
      updateReview();
      return;
    }
    if (file.type !== 'video/mp4') {
      videoInput.value = '';
      $('fileMeta').textContent = 'MP4形式の動画を選択してください。';
      $('videoPreview').classList.add('hidden');
      $('previewEmpty').classList.remove('hidden');
      setResult('選択したファイルはMP4形式ではありません。別の動画を選択してください。', 'error');
      updateReview();
      return;
    }
    $('result').className = 'result hidden';
    $('fileMeta').textContent = `${file.name} · ${formatBytes(file.size)}`;
    previewUrl = URL.createObjectURL(file);
    $('videoPreview').src = previewUrl;
    $('videoPreview').classList.remove('hidden');
    $('previewEmpty').classList.add('hidden');
    updateReview();
  });

  titleInput.addEventListener('input', updateReview);
  descriptionInput.addEventListener('input', updateReview);
  $('finalConfirm').addEventListener('change', updateReview);

  const disabledPost = createSubmissionGuard(async function () {
    setResult(safeErrorMessage(), 'error');
    return false;
  });
  $('postButton').addEventListener('click', function () {
    void disabledPost();
  });

  window.addEventListener('beforeunload', function () {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });

  updateReview();
  return helpers;
});
