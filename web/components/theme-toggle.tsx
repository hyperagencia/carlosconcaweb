'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'

/**
 * Botón de tema (variante 5 de Skiper UI, adaptada: estado real en <html>
 * y localStorage). Basado en https://toggles.dev/ (Alfie Jones).
 * Atribución: Skiper UI — https://skiper-ui.com (@gurvinder-singh02).
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

const isDarkNow = () => document.documentElement.classList.contains('dark')

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('Nav')
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => false)

  function toggle() {
    const next = !isDarkNow()
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('themeToLight') : t('themeToDark')}
      className={cn(
        'size-10 rounded-full bg-surface p-2.5 text-fg transition-all duration-300 active:scale-95',
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 32 32"
      >
        <clipPath id="theme-toggle-clip">
          <motion.path
            initial={false}
            animate={{ y: isDark ? 5 : 0, x: isDark ? -20 : 0 }}
            transition={{ ease: 'easeInOut', duration: 0.35 }}
            d="M0-5h55v37h-55zm32 12a1 1 0 0025 0 1 1 0 00-25 0"
          />
        </clipPath>
        <g clipPath="url(#theme-toggle-clip)">
          <circle cx="16" cy="16" r="15" />
        </g>
      </svg>
    </button>
  )
}
