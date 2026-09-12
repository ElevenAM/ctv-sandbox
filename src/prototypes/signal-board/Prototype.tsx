'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel, User } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { ANON_DISABLED, ensureVisitor, visitorLabel } from '@/lib/visitor'
import { cn } from '@/lib/cn'
import { Button, FailedState, LoadingState, EmptyState, toneBg, toneText } from '@/components/ui/primitives'
import type { Tone } from '@/prototypes/types'
import type { Tables } from '@/lib/supabase/database.types'

type Note = Tables<'board_note'>
type Phase = { kind: 'loading' } | { kind: 'ready' } | { kind: 'failed'; reason: string }

const TONES: readonly Tone[] = ['amber', 'iris', 'jade', 'rose', 'slate']
const MAX_BODY = 280

/** A note we have sent but the server has not confirmed. Rolled back on refusal. */
type Pending = Note & { optimistic: true }

export default function SignalBoard() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [notes, setNotes] = useState<(Note | Pending)[]>([])
  const [visitor, setVisitor] = useState<User | null>(null)
  const [draft, setDraft] = useState('')
  const [tone, setTone] = useState<Tone>('iris')
  const [postError, setPostError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Mirrors `visitor` for the realtime callback, which closes over its first
  // render. Set synchronously beside the state, never from an effect — the
  // frame of delay is exactly the race this ref exists to close.
  const visitorRef = useRef<User | null>(null)

  // `isCurrent` is the unmount/re-run guard: every await is a chance for this
  // component to have gone away, and setting state afterwards is a leak. The
  // caller owns the flag so both the mount effect and Retry can share one path.
  const load = useCallback(async (isCurrent: () => boolean) => {
    const session = await ensureVisitor()
    if (!isCurrent()) return
    if (!session.ok) {
      setPhase({ kind: 'failed', reason: session.reason })
      return
    }
    visitorRef.current = session.value
    setVisitor(session.value)

    const client = getBrowserClient()
    if (!client.ok) {
      setPhase({ kind: 'failed', reason: client.reason })
      return
    }

    const { data, error } = await client.value
      .from('board_note')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)

    if (!isCurrent()) return
    if (error) {
      console.error(`[signal-board] load failed: ${error.message}`, error)
      setPhase({ kind: 'failed', reason: `board/load: ${error.message}` })
      return
    }

    setNotes(data ?? [])
    setPhase({ kind: 'ready' })
  }, [])

  useEffect(() => {
    let active = true
    // The lint rule traces `load` statically and cannot see that every
    // setState in it sits behind an await, so it reads this as a cascading
    // render. It is not one — and "fetch on mount, guarded by a cancellation
    // flag" is the pattern the React docs prescribe for exactly this case:
    // anonymous auth has to happen in the browser, so the first read cannot
    // move to the server. This is the ONE sanctioned waiver (CLAUDE.md §Known
    // exceptions); a new one needs the same paragraph of justification.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(() => active)
    return () => {
      // Reads no state — an unmount-only cleanup, per CLAUDE.md rule 6.
      active = false
    }
  }, [load])

  const retry = useCallback(() => {
    setPhase({ kind: 'loading' })
    void load(() => true)
  }, [load])

  // Realtime: every open tab sees every change. Subscribed once the board is
  // readable, torn down on unmount — the cleanup reads no state (rule 5).
  useEffect(() => {
    if (phase.kind !== 'ready') return

    const client = getBrowserClient()
    if (!client.ok) return

    const channel: RealtimeChannel = client.value
      .channel('board_note:stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_note' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Note
            setNotes((current) => {
              // Our own optimistic copy is already on screen — swap, don't add.
              const withoutOptimistic = current.filter(
                (n) => !('optimistic' in n && n.author_id === row.author_id && n.body === row.body),
              )
              if (withoutOptimistic.some((n) => n.id === row.id)) return withoutOptimistic
              return [row, ...withoutOptimistic]
            })
          }
          if (payload.eventType === 'DELETE') {
            const gone = payload.old as Partial<Note>
            setNotes((current) => current.filter((n) => n.id !== gone.id))
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new as Note
            setNotes((current) => current.map((n) => (n.id === row.id ? row : n)))
          }
        },
      )
      .subscribe()

    return () => {
      void client.value.removeChannel(channel)
    }
  }, [phase.kind])

  async function post() {
    const body = draft.trim()
    const author = visitorRef.current
    if (!body || !author || sending) return

    setSending(true)
    setPostError(null)

    const optimistic: Pending = {
      id: `optimistic-${crypto.randomUUID()}`,
      author_id: author.id,
      author_label: visitorLabel(author.id),
      body,
      tone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      optimistic: true,
    }
    setNotes((current) => [optimistic, ...current])
    setDraft('')

    const client = getBrowserClient()
    if (!client.ok) {
      setNotes((current) => current.filter((n) => n.id !== optimistic.id))
      setDraft(body)
      setPostError('Lost the connection to the database. Your note is back in the box.')
      setSending(false)
      return
    }

    const { error } = await client.value.from('board_note').insert({
      author_id: author.id,
      author_label: optimistic.author_label,
      body,
      tone,
    })

    if (error) {
      // The honesty contract: put the note back in the box so the work is not
      // lost, and say so. Never leave the optimistic row looking committed.
      console.error(`[signal-board] insert refused: ${error.message}`, error)
      setNotes((current) => current.filter((n) => n.id !== optimistic.id))
      setDraft(body)
      setPostError('That note did not save. Nothing was lost — press Post to try again.')
    }
    setSending(false)
  }

  async function remove(id: string) {
    const previous = notes
    setNotes((current) => current.filter((n) => n.id !== id))

    const client = getBrowserClient()
    if (!client.ok) {
      setNotes(previous)
      return
    }

    const { error } = await client.value.from('board_note').delete().eq('id', id)
    if (error) {
      console.error(`[signal-board] delete refused: ${error.message}`, error)
      setNotes(previous)
      setPostError('That note could not be removed. It is back on the board.')
    }
  }

  /* ------------------------------------------------------------- render -- */

  if (phase.kind === 'loading') {
    return <LoadingState rows={4} label="Loading the board" />
  }

  if (phase.kind === 'failed') {
    // The `reason` never reaches the user — it is mapped to copy here and
    // logged raw above. The operator hint IS shown, because the two failures
    // this prototype actually hits are both one-line fixes.
    const isAnonDisabled = phase.reason === ANON_DISABLED
    return (
      <FailedState
        title={isAnonDisabled ? 'The board needs anonymous sign-in' : 'The board did not load'}
        body={
          isAnonDisabled
            ? 'Every visitor needs a real user id for the row-level security on this table to mean anything. This project has anonymous sign-in switched off, so nobody can post.'
            : 'The database did not answer. This is usually the environment, not the code.'
        }
        hint={
          isAnonDisabled ? (
            <>
              Fix: Supabase dashboard → <strong>Authentication → Sign In / Providers</strong> → enable{' '}
              <strong>Anonymous sign-ins</strong>. It is already set in{' '}
              <code className="font-mono">supabase/config.toml</code>, so{' '}
              <code className="font-mono">supabase config push</code> does it too.
            </>
          ) : (
            <>
              Check <code className="font-mono">.env.local</code> against{' '}
              <code className="font-mono">.env.example</code>.
            </>
          )
        }
        onRetry={retry}
      />
    )
  }

  const mine = (note: Note | Pending) => note.author_id === visitor?.id
  const remaining = MAX_BODY - draft.trim().length

  return (
    <div className="flex flex-col gap-8">
      {/* Composer ------------------------------------------------------- */}
      <section className="rounded-[--radius-card] border border-line bg-surface p-4 sm:p-5">
        <label htmlFor="note-body" className="type-index mb-3 block text-ink-muted">
          Post to the board
        </label>
        <textarea
          id="note-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY))}
          rows={3}
          placeholder="Say something the other tab should see…"
          className={cn(
            'type-body w-full resize-none rounded-[--radius-control] border border-line bg-ground px-3 py-2.5',
            'text-ink placeholder:text-ink-muted focus:border-line-strong focus:outline-none',
          )}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Note colour</legend>
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                aria-label={t}
                aria-pressed={tone === t}
                className={cn(
                  'size-7 rounded-full transition-transform duration-(--duration-fast) ease-(--ease-out-soft)',
                  'active:scale-90',
                  toneBg(t),
                  tone === t ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'opacity-55 hover:opacity-100',
                )}
              />
            ))}
          </fieldset>

          <div className="flex items-center gap-3">
            <span
              className={cn('type-index', remaining < 24 ? 'text-danger' : 'text-ink-muted')}
              aria-live="polite"
            >
              {remaining} left
            </span>
            <Button variant="primary" onClick={() => void post()} disabled={!draft.trim() || sending}>
              {sending ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>

        {/* In place, never a blocking alert. */}
        {postError ? (
          <p role="alert" className="type-small mt-3 text-danger">
            {postError}
          </p>
        ) : null}
      </section>

      {/* Board ---------------------------------------------------------- */}
      {notes.length === 0 ? (
        <EmptyState
          title="Nobody has posted yet"
          body="Be the first. Then open this page in a second window — the note appears there without a refresh, because Postgres is pushing the change rather than the page polling for it."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const pending = 'optimistic' in note
            return (
              <li
                key={note.id}
                className={cn(
                  'group relative flex flex-col gap-3 rounded-[--radius-card] border border-line bg-surface p-4',
                  'transition-opacity duration-(--duration-base) ease-(--ease-out-soft)',
                  pending && 'opacity-60',
                )}
              >
                <span aria-hidden className={cn('h-0.5 w-8 rounded-full', toneBg(note.tone as Tone))} />
                <p className="type-body whitespace-pre-wrap break-words text-ink">{note.body}</p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className={cn('type-index', toneText(note.tone as Tone))}>
                    {note.author_label}
                    {mine(note) ? ' · you' : ''}
                  </span>

                  {mine(note) && !pending ? (
                    <Button
                      variant="danger"
                      size="sm"
                      className="min-h-8 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                      onClick={() => void remove(note.id)}
                    >
                      Delete
                    </Button>
                  ) : null}

                  {pending ? <span className="type-index text-ink-muted">saving…</span> : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="type-small text-ink-muted">
        You are{' '}
        <span className="text-ink">{visitor ? visitorLabel(visitor.id) : 'anonymous'}</span> — an anonymous
        Supabase user. Row-level security is what stops you deleting anyone else&rsquo;s note; try it in the
        console if you like, the database will refuse.
      </p>
    </div>
  )
}
