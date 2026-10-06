'use client'

import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { routing, type Locale } from '@/lib/i18n/routing'
import { cn } from '@/lib/cn'

export function LocaleSwitch() {
  const t = useTranslations('Nav')
  const active = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex h-10 items-center rounded-full border border-current/70 p-0.5"
    >
      {routing.locales.map((locale) => {
        const selected = locale === active
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={selected}
            onClick={() => !selected && router.replace(pathname, { locale })}
            className={cn(
              'relative h-full rounded-full px-3.5 text-sm uppercase transition-opacity',
              selected ? 'text-ink-900' : 'opacity-70 hover:opacity-100',
            )}
          >
            {selected && (
              <motion.span
                layoutId="locale-indicator"
                className="absolute inset-0 rounded-full bg-paper-50"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{locale}</span>
          </button>
        )
      })}
    </div>
  )
}
