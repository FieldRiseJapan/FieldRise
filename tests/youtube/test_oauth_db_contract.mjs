import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = new URL('../../supabase/migrations/20260927084829_youtube_oauth_transactions.sql', import.meta.url);
const migration = readFileSync(migrationPath, 'utf8');
const compact = migration.toLowerCase().replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ');

function bodyOf(name) {
  const definition = definitionOf(name);
  const match = definition.match(/as \$\$([\s\S]*?)\$\$;/i);
  assert.ok(match, `body for ${name} exists`);
  return match[1].toLowerCase();
}

function definitionOf(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = migration.match(new RegExp(`create function public\\.${escaped}\\([\\s\\S]*?\\$\\$;`, 'i'));
  assert.ok(match, `function ${name} exists`);
  return match[0].toLowerCase();
}

test('migration is forward-only and does not modify or delete existing data at apply time', () => {
  assert.match(compact, /^\s*begin;/);
  assert.match(compact, /commit;\s*$/);
  assert.doesNotMatch(compact, /\bdrop\s+(?:schema|table|function|policy)\b/);
  assert.doesNotMatch(compact, /\bdelete\s+from\b|\btruncate\b/);
  assert.doesNotMatch(compact, /\bupdate\s+public\.youtube_oauth_tokens\b/);
  assert.deepEqual([...migration.matchAll(/create table\s+([\w.]+)/gi)].map((m) => m[1]), [
    'youtube_oauth_private.transactions',
  ]);
});

test('transaction table stores only binding and lifecycle metadata with RLS enabled', () => {
  assert.match(compact, /create schema youtube_oauth_private/);
  assert.match(compact, /create table youtube_oauth_private\.transactions/);
  const tableDefinition = compact.match(/create table youtube_oauth_private\.transactions\s*\(([\s\S]*?)\);/)?.[1] ?? '';
  for (const column of ['transaction_id uuid', 'state_hash bytea', 'user_id uuid', 'session_id uuid',
    'created_at timestamptz', 'expires_at timestamptz', 'consumed_at timestamptz', 'finished_at timestamptz', 'result_code text']) {
    assert.ok(tableDefinition.includes(column), `contains ${column}`);
  }
  assert.doesNotMatch(tableDefinition, /\b(?:email|access_token|refresh_token|jwt|raw_state|authorization_code)\b/);
  assert.match(compact, /alter table youtube_oauth_private\.transactions enable row level security/);
  assert.match(compact, /revoke all on table youtube_oauth_private\.transactions from public, anon, authenticated, service_role/);
  assert.match(compact, /grant select, insert, update on table youtube_oauth_private\.transactions to service_role/);
});

test('hash and TTL constraints enforce fixed state digest and short transaction lifetime', () => {
  assert.match(compact, /octet_length\(state_hash\) = 32/);
  assert.match(compact, /expires_at > created_at and expires_at <= created_at \+ interval '10 minutes'/);
  assert.match(compact, /p_ttl_seconds < 60 or p_ttl_seconds > 600/);
});

test('all current OAuth RPCs are invoker functions with fixed empty search_path and server-only execute', () => {
  const names = [
    'youtube_oauth_reserve', 'youtube_oauth_get_pending_state', 'youtube_oauth_consume_state',
    'youtube_oauth_finish', 'youtube_oauth_cutover_token',
  ];
  assert.doesNotMatch(compact, /security definer/);
  for (const name of names) {
    const definition = definitionOf(name);
    assert.match(definition, /security invoker/);
    assert.match(definition, /set search_path = ''/);
    assert.match(compact, new RegExp(`revoke all on function public\\.${name}\\([\\s\\S]*?from public, anon, authenticated`));
    assert.match(compact, new RegExp(`grant execute on function public\\.${name}\\([\\s\\S]*?to service_role`));
  }
});

test('state consume is one conditional UPDATE with expiry and one-time predicates', () => {
  const body = bodyOf('youtube_oauth_consume_state');
  assert.doesNotMatch(body, /\bselect\b/);
  assert.equal((body.match(/\bupdate\b/g) ?? []).length, 1);
  assert.match(body, /where t\.state_hash = p_state_hash/);
  assert.match(body, /t\.expires_at > pg_catalog\.clock_timestamp\(\)/);
  assert.match(body, /t\.consumed_at is null/);
  assert.match(body, /t\.finished_at is null/);
  assert.match(body, /returning t\.transaction_id, t\.user_id, t\.session_id, t\.expires_at/);
  assert.doesNotMatch(body, /raw.?state/);
});

test('token cutover validates nonempty input and atomically finishes then upserts without clearing old token', () => {
  const body = bodyOf('youtube_oauth_cutover_token');
  assert.match(body, /p_refresh_token is null/);
  assert.match(body, /btrim\(p_refresh_token\) = ''/);
  assert.match(body, /length\(p_refresh_token\) > 8192/);
  assert.match(body, /update youtube_oauth_private\.transactions/);
  assert.match(body, /finished_at = pg_catalog\.clock_timestamp\(\), result_code = 'token_stored'/);
  assert.ok(body.indexOf('update youtube_oauth_private.transactions') < body.indexOf('insert into public.youtube_oauth_tokens'));
  assert.match(body, /insert into public\.youtube_oauth_tokens \(id, refresh_token, updated_at\)/);
  assert.match(body, /on conflict \(id\) do update\s+set refresh_token = excluded\.refresh_token/);
  assert.doesNotMatch(body, /delete\s+from|refresh_token\s*=\s*null|refresh_token\s*=\s*''/);
  // No EXCEPTION handler swallows an upsert error; PostgreSQL rolls back the call statement.
  assert.doesNotMatch(body, /exception\s+when/);
});

test('callback session verifier remains absent from the B4 migration and must fail closed until separately validated', () => {
  assert.doesNotMatch(compact, /create function public\.youtube_oauth_verify_session/);
  const callback = readFileSync(new URL('../../supabase/functions/youtube-oauth-callback/index.ts', import.meta.url), 'utf8');
  assert.match(callback, /youtube_oauth_verify_session/);
  assert.match(callback, /return !error && data === true/);
  assert.match(callback, /intentionally not implemented/i);
});
