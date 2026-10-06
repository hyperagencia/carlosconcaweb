'use client'

import { useEffect, useState } from 'react'

export type NavTone = 'light' | 'dark'

/**
 * Tono de la sección que queda bajo la navbar. Cada sección declara
 * `data-nav-tone="light|dark"`; si ninguna cubre la navbar, devuelve null
 * y la navbar usa el tema activo.
 */
export function useNavTone(): NavTone | null {
  const [tone, setTone] = useState<NavTone | null>(null)

  useEffect(() => {
    let frame = 0

    function measure() {
      frame = 0
      const navH = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      const probe = navH / 2
      let found: NavTone | null = null
      for (const el of document.querySelectorAll<HTMLElement>('[data-nav-tone]')) {
        const r = el.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) {
          found = el.dataset.navTone === 'dark' ? 'dark' : 'light'
        }
      }
      setTone(found)
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return tone
}
