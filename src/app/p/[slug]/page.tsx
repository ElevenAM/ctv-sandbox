import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findPrototype, PROTOTYPES } from '@/prototypes/registry'
import { Tag, toneText } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

type Params = { params: Promise<{ slug: string }> }

/** Every prototype is a static route — the library is prerendered at build. */
export function generateStaticParams() {
  return PROTOTYPES.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const entry = findPrototype(slug)
  if (!entry) return { title: 'Not found' }
  return { title: entry.title, description: entry.tagline }
}

export default async function PrototypePage({ params }: Params) {
  const { slug } = await params
  const entry = findPrototype(slug)
  if (!entry) notFound()

  // Awaited dynamic import: Next code-splits each prototype into its own chunk,
  // so opening one never downloads the rest of the library.
  const { default: Prototype } = await entry.load()

  return (
    <article className="pt-10 sm:pt-14">
      <Link
        href="/"
        className="type-index inline-flex items-center gap-2 text-ink-muted transition-colors hover:text-ink"
      >
        ← Library
      </Link>

      <header className="mt-8 border-b border-line pb-8">
        <div className="flex items-center gap-3">
          <span className={cn('type-index', toneText(entry.tone))}>{entry.index}</span>
          {entry.status !== 'live' ? <span className="type-index text-ink-muted">{entry.status}</span> : null}
          <span className="type-index text-ink-muted">updated {entry.updated}</span>
        </div>

        <h1 className="type-display mt-4 max-w-3xl text-balance text-ink">{entry.title}</h1>
        <p className="type-body mt-5 max-w-2xl text-ink-soft">{entry.summary}</p>

        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          {entry.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {entry.brief ? (
            <a
              href={`https://github.com/ElevenAM/ctv-sandbox/blob/main/${entry.brief}`}
              target="_blank"
              rel="noreferrer noopener"
              className="type-index ml-2 text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Read the brief ↗
            </a>
          ) : null}
        </div>
      </header>

      <section className="pt-10">
        <Prototype />
      </section>
    </article>
  )
}
