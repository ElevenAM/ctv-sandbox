/**
 * OKLCH → sRGB, and WCAG contrast.
 *
 * The design tokens are authored in OKLCH because it keeps perceived lightness
 * steady as hue moves — the reason the five accents feel like one family. But
 * WCAG is defined on sRGB relative luminance, so scoring a pairing means
 * actually converting. ~40 lines, no dependency (ponytail rung 6).
 *
 * Conversion matrices: Björn Ottosson's OKLab reference.
 */

export type Oklch = { l: number; c: number; h: number }

type LinearRgb = { r: number; g: number; b: number }

function oklchToLinearRgb({ l, c, h }: Oklch): LinearRgb {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const bb = c * Math.sin(hRad)

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * bb) ** 3
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * bb) ** 3
  const sCone = (l - 0.0894841775 * a - 1.291485548 * bb) ** 3

  return {
    r: 4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    g: -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    b: -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** sRGB gamma encode, then to a `#rrggbb` string. */
export function oklchToHex(color: Oklch): string {
  const linear = oklchToLinearRgb(color)
  const encode = (channel: number) => {
    const v = clamp01(channel)
    const gamma = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
    return Math.round(clamp01(gamma) * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${encode(linear.r)}${encode(linear.g)}${encode(linear.b)}`
}

/** WCAG 2.1 relative luminance. Out-of-gamut channels are clamped first. */
function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToLinearRgb(color)
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b)
}

/** WCAG contrast ratio, 1–21. Order of arguments does not matter. */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export type ContrastGrade = 'AAA' | 'AA' | 'AA Large' | 'Fail'

/** Grade a ratio for body text. `AA Large` only clears 18pt+ or 14pt bold. */
export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

export const formatOklch = ({ l, c, h }: Oklch) =>
  `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(0)})`
