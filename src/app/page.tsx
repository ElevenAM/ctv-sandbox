import { listPrototypes, tagCounts } from '@/prototypes/registry'
import { Gallery } from '@/components/Gallery'
import { env } from '@/lib/env'

export default function LibraryPage() {
  const entries = listPrototypes()
  const tags = tagCounts(entries)

  return (
    <>
      {/* Header. The grid is decorative and carries no meaning. */}
      <div className="relative">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 -top-14 h-72" />

        <section className="relative pb-10 pt-16 sm:pt-24">
          <p className="type-index text-ink-muted">{env.NEXT_PUBLIC_SITE_NAME} / library</p>
          <h1 className="type-display mt-4 max-w-3xl text-balance text-ink">
            Working prototypes, hosted the moment they exist.
          </h1>
          <p className="type-body mt-5 max-w-xl text-ink-soft">
            Every entry is a self-contained exercise with its own brief and its own URL. Drop a folder in{' '}
            <code className="font-mono text-ink">src/prototypes/</code>, add one registry line, and it is
            live on the next push.
          </p>
        </section>
      </div>

      <Gallery entries={entries.map(({ load: _load, ...meta }) => meta)} tags={tags} />
    </>
  )
}
