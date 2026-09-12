#!/usr/bin/env node
/**
 * Scaffolds a prototype and registers it.
 *
 *   pnpm new <slug> [--title "Title"] [--tone iris] [--tags a,b,c]
 *
 * Creates src/prototypes/<slug>/{meta.ts,Prototype.tsx}, inserts the import and
 * the registry row in the right places, and writes a brief stub. The point is
 * that adding a prototype is never a thing you hand-edit under time pressure —
 * every registry line this writes is correct, alphabetised, and typechecks.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TONES = ['amber', 'iris', 'jade', 'rose', 'slate']

/* ------------------------------------------------------------------ args -- */

const argv = process.argv.slice(2)
const slug = argv.find((a) => !a.startsWith('--'))

function flag(name) {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}

function fail(message) {
  console.error(`\n  ✗ ${message}\n`)
  process.exit(1)
}

if (!slug) {
  fail('Usage: pnpm new <slug> [--title "Title"] [--tone iris] [--tags a,b,c]')
}
if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) {
  fail(`"${slug}" is not a valid slug. Lowercase letters, digits and hyphens; 2–49 characters.`)
}

const dir = join(ROOT, 'src/prototypes', slug)
if (await access(dir).then(() => true, () => false)) {
  fail(`src/prototypes/${slug}/ already exists. Pick another slug, or edit it directly.`)
}

const title =
  flag('title') ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
const tone = flag('tone') ?? TONES[Math.floor(Math.random() * TONES.length)]
if (!TONES.includes(tone)) fail(`--tone must be one of: ${TONES.join(', ')}`)

const tags = (flag('tags') ?? 'prototype').split(',').map((t) => t.trim()).filter(Boolean)
const today = new Date().toISOString().slice(0, 10)

/* -------------------------------------------------------------- next code -- */

const registryPath = join(ROOT, 'src/prototypes/registry.ts')
const registry = await readFile(registryPath, 'utf8')

if (registry.includes(`'./${slug}/meta'`)) {
  fail(`${slug} is already in registry.ts. Delete the entry first, or pick another slug.`)
}

// Index codes are EX-NN in registration order. Continue from the highest.
const used = [...registry.matchAll(/EX-(\d+)/g)].map((m) => Number(m[1]))
const existingMetas = await Promise.all(
  [...registry.matchAll(/from '\.\/([^/]+)\/meta'/g)].map(async (m) => {
    try {
      return await readFile(join(ROOT, 'src/prototypes', m[1], 'meta.ts'), 'utf8')
    } catch {
      return ''
    }
  }),
)
for (const text of existingMetas) {
  const found = text.match(/index:\s*'EX-(\d+)'/)
  if (found) used.push(Number(found[1]))
}
const index = `EX-${String(Math.max(0, ...used) + 1).padStart(2, '0')}`

// `signal-board` -> `signalBoard`, the local name for the meta import.
const camel = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

/* ----------------------------------------------------------------- write -- */

await mkdir(dir, { recursive: true })

await writeFile(
  join(dir, 'meta.ts'),
  `import type { PrototypeMeta } from '@/prototypes/types'

export const meta: PrototypeMeta = {
  slug: '${slug}',
  index: '${index}',
  title: '${title.replace(/'/g, "\\'")}',
  // One line, sentence case, no trailing period. This is the gallery copy.
  tagline: 'TODO: what this does, in one line',
  // Two or three sentences. What it proves, and why it is worth opening.
  summary: 'TODO: what this proves, and why someone should open it.',
  status: 'draft',
  tone: '${tone}',
  tags: [${tags.map((t) => `'${t}'`).join(', ')}],
  updated: '${today}',
  // Add 'supabase' | 'anon-auth' | 'realtime' if this needs the database.
  capabilities: [],
  brief: 'docs/prototypes/${slug}.md',
}
`,
)

await writeFile(
  join(dir, 'Prototype.tsx'),
  `'use client'

/*
  ${title}

  Rules that bind this file (CLAUDE.md):
  - Failed operations return Result<T> and set visible state. Never silent.
  - All four data states, and they are distinct. Import them; do not re-roll.
  - Tokens and .type-* roles only. No raw hex, no bare font-size.
  - One primary action. It is the only \`brand\` fill on the screen.

  Delete this comment once the prototype is real.
*/

import { Button, EmptyState } from '@/components/ui/primitives'

export default function ${camel[0].toUpperCase() + camel.slice(1)}() {
  return (
    <div className="flex flex-col gap-6">
      <EmptyState
        title="Nothing here yet"
        body="This prototype was scaffolded but not built. Replace this component with the real thing."
        action={<Button variant="primary">Primary action</Button>}
      />
    </div>
  )
}
`,
)

// Registry: the import goes after the last existing one, the row before the
// closing bracket. Both are single, unambiguous anchors.
const imports = [...registry.matchAll(/^import \{ meta as \w+ \} from '\.\/[^']+'$/gm)]
const lastImport = imports.at(-1)
if (!lastImport) fail('Could not find the meta imports in registry.ts — add the entry by hand.')

const importLine = `import { meta as ${camel} } from './${slug}/meta'`
const rowLine = `  { ...${camel}, load: () => import('./${slug}/Prototype') },`

let next = registry.replace(lastImport[0], `${lastImport[0]}\n${importLine}`)
next = next.replace(/(\n\] as const|\n\])(?=\s*\n\s*export function findPrototype)/, `\n${rowLine}$1`)

if (!next.includes(rowLine)) {
  // Fallback anchor: the close of the PROTOTYPES array.
  next = next.replace(/^\]$/m, `${rowLine}\n]`)
}
if (!next.includes(rowLine)) fail('Could not insert the registry row — add it by hand.')

await writeFile(registryPath, next)

// Brief stub, so `docs/prototypes/` never falls out of sync with the registry.
await writeFile(
  join(ROOT, 'docs/prototypes', `${slug}.md`),
  `# ${title} (${index})

**Status:** draft · **Updated:** ${today} · **Route:** \`/p/${slug}\`

## What it is
TODO — one paragraph. What does someone see, and what can they do?

## Why it exists
TODO — what does this prove? If it is a reference pattern, say what to copy.

## How it works
TODO — the two or three decisions worth knowing. Data flow, and where state lives.

## Known ceilings
TODO — what it deliberately does not do, and what would break first at scale.
`,
)

console.log(`
  ✓ ${index}  ${title}

    src/prototypes/${slug}/meta.ts
    src/prototypes/${slug}/Prototype.tsx
    docs/prototypes/${slug}.md
    registered in src/prototypes/registry.ts

    → pnpm dev, then http://localhost:3000/p/${slug}
`)
