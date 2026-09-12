import type { ComponentType } from 'react'

/** Accent name. Same five as `board_note.tone` in supabase/migrations/0002. */
export type Tone = 'amber' | 'iris' | 'jade' | 'rose' | 'slate'

/**
 * `live`    — demo it without warning anyone.
 * `draft`   — reachable and listed, but rough. Says so on the card.
 * `archived`— kept for reference, hidden from the default gallery view.
 */
export type PrototypeStatus = 'live' | 'draft' | 'archived'

/** What a prototype needs from the platform. Drives the pre-flight banner. */
export type Capability = 'supabase' | 'anon-auth' | 'realtime'

export type PrototypeMeta = {
  /** URL segment and directory name. Lowercase kebab; must match the folder. */
  slug: string
  /** Catalogue code shown on the card, e.g. `EX-01`. Assigned by `pnpm new`. */
  index: string
  title: string
  /** One line, sentence case, no trailing period. This is the gallery copy. */
  tagline: string
  /** Two or three sentences for the detail header. What it proves, and why. */
  summary: string
  status: PrototypeStatus
  tone: Tone
  tags: readonly string[]
  /** ISO `YYYY-MM-DD`. The gallery sorts on this. */
  updated: string
  capabilities: readonly Capability[]
  /** Path of the brief under `docs/prototypes/`, if one exists. */
  brief?: string
}

/** A registry row: the metadata plus a code-split loader for the component. */
export type PrototypeEntry = PrototypeMeta & {
  load: () => Promise<{ default: ComponentType }>
}
