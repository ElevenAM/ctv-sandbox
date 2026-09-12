'use client'

/*
  Claim Edit Lab

  Rules that bind this file (CLAUDE.md):
  - Failed operations return Result<T> and set visible state. Never silent.
  - All four data states, and they are distinct. Import them; do not re-roll.
  - Tokens and .type-* roles only. No raw hex, no bare font-size.
  - One primary action. It is the only `brand` fill on the screen.

  Delete this comment once the prototype is real.
*/

import { Button, EmptyState } from '@/components/ui/primitives'

export default function ClaimEditLab() {
  return (
    <div className="flex flex-col gap-6">
      <EmptyState
        title="Nothing here yet"
        body="This prototype was scaffolded but not built. Replace this component with the real thing."
        action={<Button variant="primary">Primary action</Button>}
      />
    </div>
  )
}
