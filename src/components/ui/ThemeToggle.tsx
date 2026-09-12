'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const NEXT: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' }
const LABEL: Record<Theme, string> = { system: 'Auto', dark: 'Dark', light: 'Light' }

/*
  The DOM is the source of truth for the theme, not React state.

  The pre-paint script in layout.tsx sets `data-theme` before first paint, so
  by the time React hydrates the answer is already on the element. Reading it
  into state inside an effect would mean rendering the wrong label first and
  then correcting it — a cascading render, and the React Compiler lint rules in
  Next 16 flag exactly that. `useSyncExternalStore` subscribes to the attribute
  instead, which is what it is for.
*/

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  // Another tab changing the theme should move this one too.
  window.addEventListener('storage', onChange)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onChange)
  }
}

const readTheme = (): Theme =>
  (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'system'

// The server has no DOM and cannot know the stored choice, so it renders the
// neutral default. The pre-paint script means the pixels are never wrong.
const serverTheme = (): Theme => 'system'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme)

  function cycle() {
    const next = NEXT[theme]

    // Writing the attribute is what re-renders this component, via subscribe().
    if (next === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', next)

    try {
      if (next === 'system') localStorage.removeItem('ctv-theme')
      else localStorage.setItem('ctv-theme', next)
    } catch {
      // Storage blocked (private mode). Non-fatal — the theme still applies
      // for this page view, it just will not survive a reload.
    }
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Activate for ${LABEL[NEXT[theme]]}.`}
      className="type-index min-h-11 rounded-[--radius-control] px-3 text-ink-muted transition-colors hover:text-ink"
    >
      {LABEL[theme]}
    </button>
  )
}
