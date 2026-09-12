/**
 * Conditional class joiner.
 *
 * ponytail: eight lines instead of `clsx` + `tailwind-merge`. This codebase
 * composes classes, it does not fight conflicting Tailwind utilities at
 * runtime — if that day comes, swap in `tailwind-merge` here and nothing else
 * changes.
 */
export type ClassValue = string | false | null | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
