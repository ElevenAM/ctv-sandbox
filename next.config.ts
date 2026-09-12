import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // A prototype demo is judged on what renders, but a type error must still
  // fail the build rather than ship silently. Next 16 runs ESLint as its own
  // step (`pnpm lint`), not during `next build` — the gate script runs both.
  typescript: { ignoreBuildErrors: false },
}

export default config
