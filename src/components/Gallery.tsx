'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { FilteredEmptyState, Tag, toneBg, toneText } from '@/components/ui/primitives'
import type { PrototypeMeta } from '@/prototypes/types'

/**
 * The catalogue grid plus its tag rail.
 *
 * A Client Component only because filtering is instant and local — the list is
 * rendered on the server and passed in whole. Do not turn this into a fetch.
 */
export function Gallery({
  entries,
  tags,
}: {
  entries: readonly PrototypeMeta[]
  tags: readonly { tag: string; count: number }[]
}) {
  const [active, setActive] = useState<string | null>(null)

  const shown = useMemo(
    () => (active ? entries.filter((e) => e.tags.includes(active)) : entries),
    [entries, active],
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
      {/* Tag rail ---------------------------------------------------------- */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="type-index mb-3 text-ink-muted">Tags</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 lg:flex-col lg:gap-y-0.5">
          <FilterButton label="All" count={entries.length} active={active === null} onClick={() => setActive(null)} />
          {tags.map(({ tag, count }) => (
            <FilterButton
              key={tag}
              label={tag}
              count={count}
              active={active === tag}
              onClick={() => setActive(active === tag ? null : tag)}
            />
          ))}
        </div>
      </aside>

      {/* Grid -------------------------------------------------------------- */}
      <div>
        {shown.length === 0 ? (
          <FilteredEmptyState onClear={() => setActive(null)} />
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-[--radius-card] border border-line bg-line sm:grid-cols-2">
            {shown.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/p/${entry.slug}`}
                  className={cn(
                    'group flex h-full flex-col gap-4 bg-ground p-5 sm:p-6',
                    'transition-colors duration-(--duration-base) ease-(--ease-out-soft) hover:bg-surface',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn('type-index', toneText(entry.tone))}>{entry.index}</span>
                    {entry.status !== 'live' ? (
                      <span className="type-index text-ink-muted">{entry.status}</span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="type-title text-ink">{entry.title}</h3>
                    <p className="type-body mt-2 text-ink-soft">{entry.tagline}</p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <span
                      aria-hidden
                      className={cn(
                        'ml-auto h-px w-6 transition-[width] duration-(--duration-base) ease-(--ease-out-soft) group-hover:w-10',
                        toneBg(entry.tone),
                      )}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'type-index flex items-center gap-2 py-1 text-left transition-colors duration-(--duration-fast)',
        active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
      )}
    >
      <span aria-hidden className={cn('size-1 rounded-full', active ? 'bg-brand' : 'bg-transparent')} />
      {label}
      <span className="opacity-50">{count}</span>
    </button>
  )
}
