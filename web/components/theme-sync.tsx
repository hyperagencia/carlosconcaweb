'use client'

import { useLayoutEffect } from 'react'

/** Aplica la elección guardada del visitante (si la hay) sobre la preferencia del sistema. */
export function ThemeSync() {
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.classList.add(saved)
      }
    } catch {}
  }, [])
  return null
}
