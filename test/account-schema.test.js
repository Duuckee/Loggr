import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('account schema includes diagram roles, groups and public leaderboard RPC', async () => {
  const source = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
  for (const expected of ['public_user', 'scout_user', 'local_admin', 'leaderboard_admin', 'group_memberships', 'get_leaderboard', 'show_on_leaderboard']) {
    assert.match(source, new RegExp(expected))
  }
  assert.match(source, /enable row level security/g)
  assert.match(source, /security definer\s+set search_path = ''/g)
})
