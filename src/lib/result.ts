/**
 * Result<T> — the honesty contract (CLAUDE.md rule 4).
 *
 * Any async operation that can fail returns this instead of throwing or
 * returning `null`. Callers branch on `.ok`; a failure can never be mistaken
 * for an empty success. `reason` is a machine string for logs — map it to
 * human copy at the UI boundary, never render it raw.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; reason: string }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const err = <T = never>(reason: string): Result<T> => ({ ok: false, reason })

/** Wrap a throwing async call so the failure becomes data instead of an exception. */
export async function attempt<T>(fn: () => Promise<T>, context: string): Promise<Result<T>> {
  try {
    return ok(await fn())
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    console.error(`[${context}] ${detail}`, cause)
    return err(`${context}: ${detail}`)
  }
}
