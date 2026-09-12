import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 pt-24">
      <p className="type-index text-ink-muted">404</p>
      <h1 className="type-title text-ink">No prototype at that address</h1>
      <p className="type-body max-w-prose text-ink-soft">
        It may have been renamed, or never registered. Everything that exists is listed in the library.
      </p>
      <Link
        href="/"
        className="type-small mt-2 inline-flex min-h-11 items-center rounded-[--radius-control] bg-brand px-4 font-medium text-brand-ink transition-opacity hover:opacity-90"
      >
        Back to the library
      </Link>
    </div>
  )
}
