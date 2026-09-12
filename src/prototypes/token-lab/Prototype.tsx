'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { contrastRatio, formatOklch, gradeContrast, oklchToHex, type Oklch } from '@/lib/color'
import { cn } from '@/lib/cn'
import { Button, Tag } from '@/components/ui/primitives'

/*
  Token Lab has no database and no network. It exists to prove one claim from
  DESIGN.md: nothing in this library hard-codes a colour. Every control below
  writes a CSS custom property onto ONE wrapper element, and the components
  inside it re-theme because that is the only place they ever read from.
*/

type Knob = { key: string; label: string; min: number; max: number; step: number }

const BRAND_KNOBS: readonly Knob[] = [
  { key: 'l', label: 'Lightness', min: 0.2, max: 0.95, step: 0.01 },
  { key: 'c', label: 'Chroma', min: 0, max: 0.32, step: 0.005 },
  { key: 'h', label: 'Hue', min: 0, max: 360, step: 1 },
]

const PRESETS: readonly { name: string; brand: Oklch; ground: Oklch }[] = [
  { name: 'Sandbox', brand: { l: 0.7, c: 0.15, h: 282 }, ground: { l: 0.15, c: 0.008, h: 265 } },
  { name: 'Paper', brand: { l: 0.5, c: 0.14, h: 262 }, ground: { l: 0.975, c: 0.005, h: 90 } },
  { name: 'Terminal', brand: { l: 0.82, c: 0.19, h: 145 }, ground: { l: 0.14, c: 0.02, h: 150 } },
  { name: 'Ember', brand: { l: 0.72, c: 0.19, h: 38 }, ground: { l: 0.17, c: 0.02, h: 40 } },
]

const DEFAULT = PRESETS[0]!

export default function TokenLab() {
  const [brand, setBrand] = useState<Oklch>(DEFAULT.brand)
  const [ground, setGround] = useState<Oklch>(DEFAULT.ground)
  const [radius, setRadius] = useState(14)

  // Ink is derived, not chosen: pick whichever end of the scale actually reads
  // on this ground. A theme editor that lets you ship 2:1 body text is a toy.
  const ink: Oklch = useMemo(
    () => (ground.l > 0.55 ? { l: 0.21, c: 0.012, h: ground.h } : { l: 0.96, c: 0.004, h: ground.h }),
    [ground],
  )

  const inkOnGround = contrastRatio(ink, ground)
  const brandOnGround = contrastRatio(brand, ground)
  const brandInk: Oklch = brand.l > 0.6 ? { l: 0.16, c: 0.01, h: brand.h } : { l: 0.99, c: 0, h: brand.h }
  const inkOnBrand = contrastRatio(brandInk, brand)

  // The single wrapper every preview component reads from.
  const themeStyle = {
    '--ctv-brand': formatOklch(brand),
    '--ctv-brand-ink': formatOklch(brandInk),
    '--ctv-ground': formatOklch(ground),
    '--ctv-surface': formatOklch({ ...ground, l: ground.l > 0.55 ? ground.l + 0.025 : ground.l + 0.035 }),
    '--ctv-raised': formatOklch({ ...ground, l: ground.l > 0.55 ? ground.l + 0.015 : ground.l + 0.07 }),
    '--ctv-line': formatOklch({ ...ground, l: ground.l > 0.55 ? ground.l - 0.075 : ground.l + 0.12 }),
    '--ctv-line-strong': formatOklch({ ...ground, l: ground.l > 0.55 ? ground.l - 0.18 : ground.l + 0.23 }),
    '--ctv-ink': formatOklch(ink),
    '--ctv-ink-soft': formatOklch({ ...ink, l: ground.l > 0.55 ? 0.44 : 0.76 }),
    '--ctv-ink-muted': formatOklch({ ...ink, l: ground.l > 0.55 ? 0.57 : 0.62 }),
    '--radius-card': `${radius}px`,
    '--radius-control': `${Math.max(4, radius - 4)}px`,
  } as CSSProperties

  const reset = () => {
    setBrand(DEFAULT.brand)
    setGround(DEFAULT.ground)
    setRadius(14)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      {/* Controls --------------------------------------------------------- */}
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="type-index mb-3 text-ink-muted">Presets</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                size="sm"
                onClick={() => {
                  setBrand(preset.brand)
                  setGround(preset.ground)
                }}
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: oklchToHex(preset.brand) }}
                />
                {preset.name}
              </Button>
            ))}
          </div>
        </section>

        <Sliders title="Brand" value={brand} onChange={setBrand} knobs={BRAND_KNOBS} />
        <Sliders title="Ground" value={ground} onChange={setGround} knobs={BRAND_KNOBS} />

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="type-index text-ink-muted">Corner radius</h3>
            <span className="type-index text-ink">{radius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-label="Corner radius"
            className="w-full accent-[var(--ctv-brand)]"
          />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="type-index text-ink-muted">Contrast</h3>
          <ContrastRow label="Body text on ground" ratio={inkOnGround} />
          <ContrastRow label="Brand on ground" ratio={brandOnGround} />
          <ContrastRow label="Label on brand fill" ratio={inkOnBrand} />
        </section>

        <Button onClick={reset}>Reset to Sandbox</Button>
      </div>

      {/* Live preview ------------------------------------------------------ */}
      <div
        style={themeStyle}
        className="flex flex-col gap-5 rounded-[--radius-card] border border-line bg-ground p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-index text-ink-muted">Live preview</p>
            <h3 className="type-title mt-1 text-ink">Every component, retuned</h3>
          </div>
          <Button variant="primary">Primary action</Button>
        </div>

        <p className="type-body max-w-prose text-ink-soft">
          Nothing in this panel changed. The three sliders rewrote custom properties on the wrapper, and
          each component picked the new values up because a token is the only place any of them looks.
        </p>

        <div className="flex flex-wrap gap-2">
          {['design-system', 'tokens', 'oklch', 'wcag'].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[--radius-card] border border-line bg-surface p-4">
            <p className="type-index text-ink-muted">Surface</p>
            <p className="type-body mt-2 text-ink">Cards sit here.</p>
          </div>
          <div className="rounded-[--radius-card] border border-line bg-raised p-4">
            <p className="type-index text-ink-muted">Raised</p>
            <p className="type-body mt-2 text-ink">Failed states and inputs sit here.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>

        <div className="rounded-[--radius-control] border border-line bg-surface p-3">
          <p className="type-index text-ink-muted">Current tokens</p>
          <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-soft">
{`--ctv-brand:  ${formatOklch(brand)}   ${oklchToHex(brand)}
--ctv-ground: ${formatOklch(ground)}   ${oklchToHex(ground)}
--ctv-ink:    ${formatOklch(ink)}   ${oklchToHex(ink)}
--radius-card: ${radius}px`}
          </pre>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- sub-parts -- */

function Sliders({
  title,
  value,
  onChange,
  knobs,
}: {
  title: string
  value: Oklch
  onChange: (next: Oklch) => void
  knobs: readonly Knob[]
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="size-4 rounded-full border border-line"
          style={{ background: oklchToHex(value) }}
        />
        <h3 className="type-index text-ink-muted">{title}</h3>
        <span className="type-index ml-auto font-mono text-ink-muted">{oklchToHex(value)}</span>
      </div>

      <div className="flex flex-col gap-3">
        {knobs.map((knob) => (
          <label key={knob.key} className="block">
            <span className="type-small flex justify-between text-ink-soft">
              {knob.label}
              <span className="font-mono text-ink-muted">
                {value[knob.key as keyof Oklch].toFixed(knob.step < 1 ? 3 : 0)}
              </span>
            </span>
            <input
              type="range"
              min={knob.min}
              max={knob.max}
              step={knob.step}
              value={value[knob.key as keyof Oklch]}
              onChange={(e) => onChange({ ...value, [knob.key]: Number(e.target.value) })}
              aria-label={`${title} ${knob.label}`}
              className="mt-1 w-full accent-[var(--ctv-brand)]"
            />
          </label>
        ))}
      </div>
    </section>
  )
}

function ContrastRow({ label, ratio }: { label: string; ratio: number }) {
  const grade = gradeContrast(ratio)
  const failing = grade === 'Fail'

  return (
    <div className="flex items-center justify-between gap-3 rounded-[--radius-control] border border-line px-3 py-2">
      <span className="type-small text-ink-soft">{label}</span>
      <span className="flex items-center gap-2">
        <span className="type-index font-mono text-ink-muted">{ratio.toFixed(2)}:1</span>
        <span
          className={cn(
            'type-index rounded-full px-2 py-0.5',
            failing ? 'bg-danger text-ground' : 'border border-line text-ink',
          )}
        >
          {grade}
        </span>
      </span>
    </div>
  )
}
