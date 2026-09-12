'use client'

import { useId, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { Button, EmptyState, FailedState, FilteredEmptyState, Tag } from '@/components/ui/primitives'
import { SAMPLE, type ClaimLine } from './sample'
import {
  evaluate,
  FIELDS,
  OPERATORS,
  operatorsFor,
  PRESETS,
  toSpec,
  type Action,
  type Condition,
  type Field,
  type Rule,
} from './rules'

/*
  Claim Edit Lab. Client state only: the sample is a seeded module, the rule
  lives in the page and is not saved (said on screen). Nothing is fetched, so
  there is no loading or network-failed state; the failure surface is a rule
  that cannot be evaluated, rendered in place on the offending row.
*/

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const percent = (n: number, of: number) => (of === 0 ? '0%' : `${Math.round((100 * n) / of)}%`)

/** Above this share of the sample, a rule is more likely wrong than lucrative. */
const BROAD_RULE_SHARE = 0.25

const CONTROL =
  'type-body min-h-11 rounded-[--radius-control] border border-line bg-ground px-3 text-ink focus:border-line-strong focus:outline-none'

const EMPTY_RULE: Rule = { conditions: [], action: { kind: 'deny' } }

function firstValue(field: Field): string {
  const def = FIELDS[field]
  return def.kind === 'enum' ? def.options[0]! : ''
}

function newCondition(): Condition {
  return {
    id: crypto.randomUUID(),
    field: 'service',
    operator: 'is',
    value: firstValue('service'),
  }
}

export default function ClaimEditLab() {
  const [rule, setRule] = useState<Rule>(EMPTY_RULE)
  const [showUnflagged, setShowUnflagged] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const result = useMemo(() => evaluate(rule, SAMPLE), [rule])
  const usable = rule.conditions.length - result.invalid.length
  const share = result.flags.length / result.linesTotal
  const spec = toSpec(rule)

  const update = (id: string, patch: Partial<Condition>) =>
    setRule((r) => ({
      ...r,
      conditions: r.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  const remove = (id: string) =>
    setRule((r) => ({
      ...r,
      conditions: r.conditions.filter((c) => c.id !== id),
    }))
  const setAction = (action: Action) => setRule((r) => ({ ...r, action }))
  const load = (next: Rule) => {
    setRule(structuredClone(next))
    setCopyState('idle')
  }

  async function copySpec() {
    try {
      await navigator.clipboard.writeText(spec)
      setCopyState('copied')
    } catch (err) {
      console.error('clipboard write refused', err)
      setCopyState('failed')
    }
  }

  const flaggedIds = new Set(result.flags.map((f) => f.line.id))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* The rule ---------------------------------------------------------- */}
      <section className="flex min-w-0 flex-col gap-5 rounded-[--radius-card] border border-line bg-surface p-4 sm:p-5">
        <div>
          <h2 className="type-index mb-3 text-ink-muted">Start from an example</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.name} size="sm" onClick={() => load(p.rule)}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="type-index text-ink-muted">Flag a line when all of these are true</h2>
            {rule.conditions.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => load(EMPTY_RULE)}>
                Clear
              </Button>
            ) : null}
          </div>
          <ul className="flex flex-col gap-2">
            {rule.conditions.map((c) => (
              <ConditionRow
                key={c.id}
                condition={c}
                invalid={result.invalid.includes(c.id)}
                onChange={(patch) => update(c.id, patch)}
                onRemove={() => remove(c.id)}
              />
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              setRule((r) => ({
                ...r,
                conditions: [...r.conditions, newCondition()],
              }))
            }
          >
            + Add condition
          </Button>
        </div>

        <fieldset>
          <legend className="type-index mb-3 text-ink-muted">Then</legend>
          <div className="flex flex-col gap-2">
            <label className="type-body flex min-h-11 items-center gap-3 text-ink">
              <input
                type="radio"
                name="action"
                checked={rule.action.kind === 'deny'}
                onChange={() => setAction({ kind: 'deny' })}
                className="accent-[var(--ctv-brand)]"
              />
              Deny the line
            </label>
            <label className="type-body flex min-h-11 flex-wrap items-center gap-3 text-ink">
              <input
                type="radio"
                name="action"
                checked={rule.action.kind === 'cap'}
                onChange={() => setAction({ kind: 'cap', maxUnits: 4 })}
                className="accent-[var(--ctv-brand)]"
              />
              Pay at most
              <input
                type="number"
                inputMode="numeric"
                min={0}
                aria-label="Maximum units"
                disabled={rule.action.kind !== 'cap'}
                value={rule.action.kind === 'cap' ? rule.action.maxUnits : 4}
                onChange={(e) =>
                  setAction({
                    kind: 'cap',
                    maxUnits: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className={cn(CONTROL, 'w-20 disabled:opacity-45')}
              />
              units
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          {/* The one primary action: this is what replaces the emailed spreadsheet. */}
          <Button variant="primary" disabled={rule.conditions.length === 0} onClick={() => void copySpec()}>
            {copyState === 'copied' ? 'Copied' : 'Copy as spec'}
          </Button>
          {copyState === 'failed' ? (
            <p role="alert" className="type-small text-danger">
              The browser refused the clipboard. Nothing was lost — the spec is below, select and copy it.
            </p>
          ) : null}
          <details className="type-small text-ink-muted">
            <summary className="cursor-pointer py-1">What engineering receives</summary>
            <pre className="mt-2 overflow-x-auto rounded-[--radius-control] bg-raised p-3 text-ink-soft">
              {spec}
            </pre>
          </details>
          <p className="type-small text-ink-muted">This rule is not saved. Refreshing the page clears it.</p>
        </div>
      </section>

      {/* The consequence --------------------------------------------------- */}
      <section className="flex min-w-0 flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Lines flagged" value={`${result.flags.length} / ${result.linesTotal}`} />
          <Stat label="Would have saved" value={money.format(result.savingsTotal)} />
          <Stat label="Of dollars paid" value={percent(result.savingsTotal, result.paidTotal)} />
        </div>
        <p className="type-small text-ink-muted">
          Estimated gross savings on this synthetic sample of {result.linesTotal} lines. Before appeals, not
          annualised.
          {rule.action.kind === 'cap' ? ' Capping assumes every unit was paid the same.' : ''}
        </p>

        {usable > 0 && share > BROAD_RULE_SHARE ? (
          <p
            role="status"
            className="type-small rounded-[--radius-control] border border-line bg-raised px-4 py-3 text-ink"
          >
            This rule flags {percent(result.flags.length, result.linesTotal)} of the sample. Broad rules cause
            provider disputes; consider tightening it.
          </p>
        ) : null}

        {rule.conditions.length === 0 ? (
          <EmptyState
            title="Add a condition to see what this rule would flag"
            body="Or start from an example on the left. The table answers on every change."
          />
        ) : usable === 0 ? (
          <FailedState
            title="This rule cannot be evaluated yet"
            body="A number condition is blank. Fill it in and the sample will answer. Nothing was lost."
          />
        ) : result.flags.length === 0 ? (
          <FilteredEmptyState
            title="No line in the sample matches"
            body="The rule is valid, it just would not have fired on this sample. Loosen a condition or try another example."
            clearLabel="Clear rule"
            onClear={() => load(EMPTY_RULE)}
          />
        ) : (
          <>
            <label className="type-small flex items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                checked={showUnflagged}
                onChange={(e) => setShowUnflagged(e.target.checked)}
                className="accent-[var(--ctv-brand)]"
              />
              Show the {result.linesTotal - result.flags.length} lines this rule leaves alone
            </label>
            <ClaimTable
              lines={showUnflagged ? SAMPLE : result.flags.map((f) => f.line)}
              flaggedIds={flaggedIds}
              savingsById={new Map(result.flags.map((f) => [f.line.id, f.savings]))}
              because={result.flags[0]?.because ?? []}
            />
          </>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[--radius-card] border border-line bg-surface px-4 py-3">
      <div className="type-index text-ink-muted">{label}</div>
      <div className="type-heading mt-1 text-ink" aria-live="polite">
        {value}
      </div>
    </div>
  )
}

function ConditionRow({
  condition,
  invalid,
  onChange,
  onRemove,
}: {
  condition: Condition
  invalid: boolean
  onChange: (patch: Partial<Condition>) => void
  onRemove: () => void
}) {
  const id = useId()
  const def = FIELDS[condition.field]
  return (
    <li className="flex flex-col gap-1">
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          aria-label="Field"
          value={condition.field}
          onChange={(e) => {
            const field = e.target.value as Field
            onChange({
              field,
              operator: operatorsFor(field)[0],
              value: firstValue(field),
            })
          }}
          className={CONTROL}
        >
          {(Object.keys(FIELDS) as Field[]).map((f) => (
            <option key={f} value={f}>
              {FIELDS[f].label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove condition"
          onClick={onRemove}
          className="sm:order-last"
        >
          ×
        </Button>
        <select
          aria-label="Comparison"
          value={condition.operator}
          onChange={(e) => onChange({ operator: e.target.value as Condition['operator'] })}
          className={cn(CONTROL, 'col-span-2 sm:col-span-1')}
        >
          {operatorsFor(condition.field).map((op) => (
            <option key={op} value={op}>
              {OPERATORS[op]}
            </option>
          ))}
        </select>
        {def.kind === 'enum' ? (
          <select
            aria-label="Value"
            value={condition.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className={cn(CONTROL, 'col-span-2 sm:col-span-1')}
          >
            {def.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            aria-label="Value"
            aria-invalid={invalid}
            aria-describedby={invalid ? id : undefined}
            value={condition.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="number"
            className={cn(
              CONTROL,
              'col-span-2 min-w-0 placeholder:text-ink-muted sm:col-span-1',
              invalid && 'border-danger',
            )}
          />
        )}
      </div>
      {invalid ? (
        <p id={id} className="type-small text-danger">
          Needs a number. This condition is skipped until it has one.
        </p>
      ) : null}
    </li>
  )
}

function ClaimTable({
  lines,
  flaggedIds,
  savingsById,
  because,
}: {
  lines: readonly ClaimLine[]
  flaggedIds: Set<string>
  savingsById: Map<string, number>
  because: string[]
}) {
  return (
    <div className="overflow-x-auto rounded-[--radius-card] border border-line">
      <table className="type-small w-full min-w-[52rem] border-collapse text-left">
        <thead className="type-index text-ink-muted">
          <tr className="border-b border-line">
            {[
              'Claim',
              'Service',
              'Modifier',
              'Place',
              'Diagnosis',
              'Units',
              'Age',
              'Paid',
              'Saves',
              'Why',
            ].map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const flagged = flaggedIds.has(l.id)
            return (
              <tr
                key={l.id}
                className={cn(
                  'border-b border-line last:border-0',
                  flagged ? 'bg-raised text-ink' : 'text-ink-soft',
                )}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    {flagged ? <span aria-hidden className="size-1.5 rounded-full bg-jade" /> : null}
                    <span className="type-index whitespace-nowrap">{l.id}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{l.service}</td>
                <td className="px-3 py-2.5">{l.modifier}</td>
                <td className="px-3 py-2.5">{l.placeOfService}</td>
                <td className="px-3 py-2.5">{l.diagnosis}</td>
                <td className="px-3 py-2.5 tabular-nums">{l.units}</td>
                <td className="px-3 py-2.5 tabular-nums">
                  {l.memberAge}
                  {l.memberSex}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{money.format(l.paid)}</td>
                <td className="px-3 py-2.5 tabular-nums">
                  {flagged ? money.format(savingsById.get(l.id) ?? 0) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  {flagged ? (
                    <span className="flex gap-1">
                      {because.map((b) => (
                        <Tag key={b} className="whitespace-nowrap">
                          {b}
                        </Tag>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
