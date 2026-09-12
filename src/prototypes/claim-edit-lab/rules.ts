import { DIAGNOSES, MODIFIERS, PLACES, SERVICES, SEXES, type ClaimLine } from './sample'

/*
  The rule model. A rule is a flat AND list of conditions on one claim line,
  plus an action. Pure functions, no React: `evaluate` is what the page runs
  on every keystroke, and what an engineer would run in production.
*/

export const FIELDS = {
  service: { label: 'Service', kind: 'enum', options: SERVICES },
  modifier: { label: 'Modifier', kind: 'enum', options: MODIFIERS },
  placeOfService: { label: 'Place of service', kind: 'enum', options: PLACES },
  diagnosis: { label: 'Diagnosis', kind: 'enum', options: DIAGNOSES },
  memberSex: { label: 'Member sex', kind: 'enum', options: SEXES },
  units: { label: 'Units', kind: 'number' },
  memberAge: { label: 'Member age', kind: 'number' },
  paid: { label: 'Paid ($)', kind: 'number' },
} as const satisfies Record<
  keyof Omit<ClaimLine, 'id' | 'billed'>,
  { label: string; kind: 'enum'; options: readonly string[] } | { label: string; kind: 'number' }
>

export type Field = keyof typeof FIELDS
export type Operator = 'is' | 'is not' | 'gt' | 'lt'

export const OPERATORS: Record<Operator, string> = {
  is: 'is',
  'is not': 'is not',
  gt: 'more than',
  lt: 'less than',
}

export const operatorsFor = (field: Field): readonly Operator[] =>
  FIELDS[field].kind === 'enum' ? ['is', 'is not'] : ['gt', 'lt']

export type Condition = {
  id: string
  field: Field
  operator: Operator
  value: string
}
export type Action = { kind: 'deny' } | { kind: 'cap'; maxUnits: number }
export type Rule = { conditions: Condition[]; action: Action }

export type Flag = { line: ClaimLine; savings: number; because: string[] }

export type Evaluation = {
  flags: Flag[]
  /** Conditions that could not be evaluated (a blank number). Their ids. */
  invalid: string[]
  linesTotal: number
  paidTotal: number
  savingsTotal: number
}

export const describe = (c: Condition) => `${FIELDS[c.field].label} ${OPERATORS[c.operator]} ${c.value}`

function test(c: Condition, line: ClaimLine): boolean {
  const actual = line[c.field]
  switch (c.operator) {
    case 'is':
      return String(actual) === c.value
    case 'is not':
      return String(actual) !== c.value
    case 'gt':
      return Number(actual) > Number(c.value)
    case 'lt':
      return Number(actual) < Number(c.value)
  }
}

const isUsable = (c: Condition) =>
  FIELDS[c.field].kind === 'enum' || (c.value.trim() !== '' && Number.isFinite(Number(c.value)))

export function evaluate(rule: Rule, lines: readonly ClaimLine[]): Evaluation {
  const invalid = rule.conditions.filter((c) => !isUsable(c)).map((c) => c.id)
  const usable = rule.conditions.filter((c) => isUsable(c))
  const paidTotal = lines.reduce((sum, l) => sum + l.paid, 0)

  // No usable conditions means nothing is evaluated — never "everything flagged".
  if (usable.length === 0)
    return {
      flags: [],
      invalid,
      linesTotal: lines.length,
      paidTotal,
      savingsTotal: 0,
    }

  const flags: Flag[] = []
  for (const line of lines) {
    if (!usable.every((c) => test(c, line))) continue
    let savings = line.paid
    if (rule.action.kind === 'cap') {
      if (line.units <= rule.action.maxUnits) continue
      // Assumes every unit was paid the same. Stated under the number in the UI.
      savings = Math.round((line.paid * (line.units - rule.action.maxUnits)) / line.units)
    }
    flags.push({ line, savings, because: usable.map(describe) })
  }

  return {
    flags,
    invalid,
    linesTotal: lines.length,
    paidTotal,
    savingsTotal: flags.reduce((sum, f) => sum + f.savings, 0),
  }
}

/** The rule as a sentence an engineer or a reviewer can read without the UI. */
export function toSpec(rule: Rule): string {
  const when = rule.conditions.map(describe).join(' AND ') || '(no conditions)'
  const then = rule.action.kind === 'deny' ? 'deny the line' : `pay at most ${rule.action.maxUnits} units`
  return `WHEN ${when}\nTHEN ${then}\n\n${JSON.stringify(rule, null, 2)}`
}

export const PRESETS: readonly { name: string; rule: Rule }[] = [
  {
    name: 'Physical therapy over 4 units',
    rule: {
      conditions: [
        {
          id: 'p1',
          field: 'service',
          operator: 'is',
          value: 'Physical therapy (15-min unit)',
        },
        { id: 'p2', field: 'units', operator: 'gt', value: '4' },
      ],
      action: { kind: 'cap', maxUnits: 4 },
    },
  },
  {
    name: 'Telehealth visit billed at the office',
    rule: {
      conditions: [
        {
          id: 't1',
          field: 'service',
          operator: 'is',
          value: 'Telehealth check-in',
        },
        { id: 't2', field: 'placeOfService', operator: 'is', value: 'office' },
      ],
      action: { kind: 'deny' },
    },
  },
]
