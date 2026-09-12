import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { env } from '@/lib/env'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import './globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: `${env.NEXT_PUBLIC_SITE_NAME} — prototype library`, template: `%s · ${env.NEXT_PUBLIC_SITE_NAME}` },
  description: 'A hosted library of working prototypes. Each one is a self-contained exercise.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#111318' },
  ],
}

/**
 * Applies the stored theme BEFORE first paint. Without this the page flashes
 * the system theme and then snaps — the classic dark-mode flicker.
 * `try/catch` because storage throws outright in some privacy modes.
 */
const THEME_BOOTSTRAP = `
try {
  var t = localStorage.getItem('ctv-theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${sans.variable} ${mono.variable} min-h-dvh antialiased`}>
        {/* Keyboard users should not tab the whole nav to reach the content. */}
        <a
          href="#main"
          className="type-small sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[--radius-control] focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link href="/" className="type-index flex items-center gap-2.5 text-ink transition-opacity hover:opacity-70">
              <span aria-hidden className="size-2 rounded-full bg-brand" />
              {env.NEXT_PUBLIC_SITE_NAME}
            </Link>

            <div className="flex items-center gap-1">
              <a
                href="https://github.com/ElevenAM/ctv-sandbox"
                target="_blank"
                rel="noreferrer noopener"
                className="type-index rounded-[--radius-control] px-3 py-2 text-ink-muted transition-colors hover:text-ink"
              >
                Source
              </a>
              <ThemeToggle />
            </div>
          </nav>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          {children}
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
            <p className="type-index text-ink-muted">
              {env.NEXT_PUBLIC_SITE_NAME} · Next.js · Supabase · Vercel
            </p>
            <p className="type-index text-ink-muted">Built to be cloned, not admired</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
