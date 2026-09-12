#!/usr/bin/env node
/**
 * RLS negatives against the live project.
 *
 *   pnpm check:rls
 *
 * Signs in two separate anonymous visitors and proves the database REFUSES
 * what the UI merely declines to offer. Hiding a delete button is not security;
 * this is the test that tells them apart.
 *
 * Not part of `pnpm gate` on purpose — it needs the network and a real project,
 * and a gate that fails on a plane is a gate people learn to skip. Run it after
 * any migration that touches a policy (CLAUDE.md rule 9).
 *
 * Reads NEXT_PUBLIC_SUPABASE_* from .env.local. It only ever uses the
 * publishable key: a service-role key would bypass RLS and pass every check
 * here while proving nothing.
 */
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env.local'), 'utf8').catch(() => ''))
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!URL_ || !KEY) {
  console.error('\n  ✗ NEXT_PUBLIC_SUPABASE_* not found. Copy .env.example to .env.local.\n')
  process.exit(1)
}
if (KEY.startsWith('sb_secret_') || KEY.includes('service_role')) {
  console.error('\n  ✗ That looks like a secret key. It bypasses RLS and would pass every check below.\n')
  process.exit(1)
}

const results = []
const check = (name, pass, detail) => {
  results.push({ name, pass })
  console.log(`${pass ? '  \x1b[32m✓\x1b[0m' : '  \x1b[31m✗\x1b[0m'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function signUpAnon(label) {
  const r = await fetch(`${URL_}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: '{}',
  })
  const d = await r.json()
  if (!d.access_token) {
    if (d.error_code === 'anonymous_provider_disabled') {
      console.error(
        `\n  ✗ ${label}: anonymous sign-ins are disabled on this project.` +
          '\n    Dashboard → Authentication → Sign In / Providers → enable Anonymous sign-ins.\n',
      )
      process.exit(1)
    }
    throw new Error(`${label}: ${JSON.stringify(d)}`)
  }
  return { token: d.access_token, id: d.user.id }
}

const rest = (path, { token, method = 'GET', body, prefer } = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

const rows = async (res) => {
  const d = await res.json().catch(() => [])
  return Array.isArray(d) ? d : []
}

console.log('\n\x1b[1mRLS negatives — two anonymous visitors\x1b[0m\n')

const A = await signUpAnon('visitor A')
const B = await signUpAnon('visitor B')

/* ------------------------------------------------------------ board_note -- */
// Public read, owner write.

const insertRes = await rest('board_note', {
  token: A.token,
  method: 'POST',
  prefer: 'return=representation',
  body: { author_id: A.id, author_label: 'Visitor A', body: 'RLS probe', tone: 'iris' },
})
const note = (await rows(insertRes))[0]
check('A can post their own note', insertRes.ok && !!note?.id)
if (!note?.id) process.exit(1)

// The clause that matters: `with check` on insert. Without it a client can
// post under someone else's id simply by sending it.
const forge = await rest('board_note', {
  token: B.token,
  method: 'POST',
  body: { author_id: A.id, author_label: 'Not A', body: 'forged', tone: 'rose' },
})
check("B cannot post a note attributed to A", !forge.ok, `${forge.status}`)

// A refused DELETE is not an error — PostgREST reports 0 rows affected. Asking
// for the representation is the only way to see that nothing happened.
const del = await rest(`board_note?id=eq.${note.id}`, {
  token: B.token,
  method: 'DELETE',
  prefer: 'return=representation',
})
check("B cannot delete A's note", (await rows(del)).length === 0)

const upd = await rest(`board_note?id=eq.${note.id}`, {
  token: B.token,
  method: 'PATCH',
  prefer: 'return=representation',
  body: { body: 'defaced' },
})
check("B cannot edit A's note", (await rows(upd)).length === 0)

const after = await rows(await rest(`board_note?id=eq.${note.id}&select=body`, { token: B.token }))
check("A's note survived unchanged", after[0]?.body === 'RLS probe')

const anonRead = await rest(`board_note?id=eq.${note.id}&select=id`)
check('a signed-out visitor can read the board', anonRead.ok && (await rows(anonRead)).length === 1)

/* ------------------------------------------------------ prototype_signal -- */
// Insert-only: writable by anyone, readable by nobody through the API.

const sigIns = await rest('prototype_signal', {
  token: A.token,
  method: 'POST',
  body: { prototype_slug: 'rls-check', name: 'probe' },
})
check('anyone can append to prototype_signal', sigIns.ok, String(sigIns.status))
check(
  'nobody can read prototype_signal through the API',
  (await rows(await rest('prototype_signal?select=id&limit=1', { token: A.token }))).length === 0,
)

/* ------------------------------------------------------- prototype_state -- */
// Owner-scoped scratch.

await rest('prototype_state', {
  token: A.token,
  method: 'POST',
  body: { prototype_slug: 'rls-check', owner_id: A.id, key: 'probe', value: { secret: true } },
})
check(
  "B cannot see A's prototype_state row",
  (await rows(await rest('prototype_state?select=id&key=eq.probe', { token: B.token }))).length === 0,
)

/* --------------------------------------------------------------- cleanup -- */

const ownDel = await rest(`board_note?id=eq.${note.id}`, {
  token: A.token,
  method: 'DELETE',
  prefer: 'return=representation',
})
check('A can delete their own note', (await rows(ownDel)).length === 1)

const failed = results.filter((r) => !r.pass)
console.log(
  failed.length
    ? `\n\x1b[31m━━ ${failed.length} of ${results.length} FAILED — the database is not enforcing what you think ━━\x1b[0m\n`
    : `\n\x1b[32m━━ ${results.length}/${results.length} passed ━━\x1b[0m\n`,
)
process.exit(failed.length ? 1 : 0)
