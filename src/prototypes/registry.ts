import type { PrototypeEntry } from './types'
import { meta as signalBoard } from './signal-board/meta'
import { meta as tokenLab } from './token-lab/meta'

/**
 * THE catalogue. Every prototype in the library is listed here exactly once.
 *
 * `pnpm new <slug>` writes a new entry for you — the two lines it inserts are
 * the import above and the row below. Keep both alphabetical by index code so
 * a merge conflict here is a one-line resolution.
 *
 * `load` stays a dynamic import so each prototype is its own chunk: the
 * gallery must not ship the bundle for twenty prototypes nobody opened.
 */
export const PROTOTYPES: readonly PrototypeEntry[] = [
  { ...signalBoard, load: () => import('./signal-board/Prototype') },
  { ...tokenLab, load: () => import('./token-lab/Prototype') },
]

export function findPrototype(slug: string): PrototypeEntry | undefined {
  return PROTOTYPES.find((p) => p.slug === slug)
}

/** Newest first. `archived` is excluded unless explicitly asked for. */
export function listPrototypes({ includeArchived = false } = {}): readonly PrototypeEntry[] {
  return PROTOTYPES.filter((p) => includeArchived || p.status !== 'archived').toSorted((a, b) =>
    b.updated.localeCompare(a.updated),
  )
}

/** Every tag in use, with its count, most-used first. Powers the filter rail. */
export function tagCounts(entries: readonly PrototypeEntry[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
