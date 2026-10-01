import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrapPath = new URL('../../supabase/migrations/20260927080000_youtube_oauth_token_store_bootstrap.sql', import.meta.url);
const b8Path = new URL('../../supabase/migrations/20260927084829_youtube_oauth_transactions.sql', import.meta.url);
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const b8 = readFileSync(b8Path, 'utf8');
const sql = bootstrap.toLowerCase().replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ');

test('token-store bootstrap is versioned before B8 and guarded for absent or existing relations', () => {
  const bootstrapVersion = bootstrapPath.pathname.match(/\/(\d{14})_/)?.[1];
  const b8Version = b8Path.pathname.match(/\/(\d{14})_/)?.[1];
  assert.ok(bootstrapVersion && b8Version);
  assert.ok(bootstrapVersion < b8Version, 'bootstrap sorts before B8');
  assert.match(sql, /^\s*begin;/);
  assert.match(sql, /commit;\s*$/);
  assert.match(sql, /to_regclass\('public\.youtube_oauth_tokens'\)/);
  assert.match(sql, /if v_relation is null then create table public\.youtube_oauth_tokens/);
  assert.doesNotMatch(sql, /create table if not exists/);
  assert.match(sql, /raise exception 'youtube token store columns do not match the required contract'/);
  assert.match(sql, /raise exception 'youtube token store owner must be the migration executor'/);
});

test('new token-store relation has the minimum column, default, primary-key, and RLS contract', () => {
  const tableDefinition = sql.match(/create table public\.youtube_oauth_tokens\s*\(([^;]*?)\);/)?.[1] ?? '';
  assert.match(tableDefinition, /id bigint not null/);
  assert.match(tableDefinition, /refresh_token text not null/);
  assert.match(tableDefinition, /updated_at timestamptz not null default pg_catalog\.now\(\)/);
  assert.match(tableDefinition, /primary key \(id\)/);
  assert.match(sql, /alter table public\.youtube_oauth_tokens enable row level security/);
  assert.match(sql, /if not v_rls_enabled then raise exception/);
  assert.match(sql, /if v_policy_count <> 0 then raise exception/);
});

test('browser roles receive no token-table privileges and service_role receives only required table grants', () => {
  assert.match(sql, /revoke all on table public\.youtube_oauth_tokens from public, anon, authenticated, service_role/);
  assert.match(sql, /grant select, insert, update on table public\.youtube_oauth_tokens to service_role/);
  assert.match(sql, /acl\.grantee not in \(c\.relowner, v_service_role\)/);
  assert.match(sql, /v_service_privileges is distinct from array\['insert', 'select', 'update'\]::text\[\]/);
  for (const role of ['anon', 'authenticated']) {
    for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
      assert.match(sql, new RegExp(`has_table_privilege\\('${role}', v_relation, '${privilege.toLowerCase()}'\\)`));
    }
  }
  for (const privilege of ['DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
    assert.match(sql, new RegExp(`has_table_privilege\\('service_role', v_relation, '${privilege.toLowerCase()}'\\)`));
  }
});

test('bootstrap never writes or clears token rows and introduces no Auth or privilege-escalation objects', () => {
  assert.doesNotMatch(sql, /\binsert\s+into\s+public\.youtube_oauth_tokens\b/);
  assert.doesNotMatch(sql, /\bupdate\s+public\.youtube_oauth_tokens\b/);
  assert.doesNotMatch(sql, /\bdelete\s+from\s+public\.youtube_oauth_tokens\b|\btruncate\s+public\.youtube_oauth_tokens\b/);
  assert.doesNotMatch(sql, /\bauth\.sessions\b|\bsupabase_auth_admin\b|\bauth\./);
  assert.doesNotMatch(sql, /\balter\s+role\b|\bset\s+role\b|\bowner\s+to\b|\bsecurity\s+definer\b|\bbypassrls\b/);
  assert.doesNotMatch(sql, /\bcreate\s+(?:role|policy|function|schema)\b/);
  assert.match(b8.toLowerCase(), /insert into public\.youtube_oauth_tokens \(id, refresh_token, updated_at\)/);
});
