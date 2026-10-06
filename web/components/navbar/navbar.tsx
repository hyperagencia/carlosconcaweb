'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { cn } from '@/lib/cn'
import { useDark } from '@/lib/use-dark'
import { ThemeToggle } from '../theme-toggle'
import { LocaleSwitch } from './locale-switch'
import { useNavTone } from './use-nav-tone'

const ITEMS = [
  { href: '/', key: 'home' },
  { href: '/publicaciones', key: 'publications' },
  { href: '/investigacion', key: 'research' },
  { href: '/docencia', key: 'teaching' },
  { href: '/biografia', key: 'biography' },
  { href: '/contacto', key: 'contact' },
] as const

export function Navbar() {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const sectionTone = useNavTone()
  const siteDark = useDark()

  // En modo oscuro del sitio la navbar siempre es oscura; en claro sigue a la sección.
  const dark = siteDark || sectionTone === 'dark'

  return (
    <header
      data-tone={dark ? 'dark' : 'light'}
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] backdrop-blur-[var(--glass-blur)] transition-colors duration-300',
        dark ? 'bg-glass-dark text-paper-50' : 'bg-glass-light text-ink-900',
      )}
    >
      <div className="flex h-full items-center justify-between px-[var(--gutter)]">
        <Link href="/" aria-label={t('logo')} className="shrink-0">
          <Image
            src={dark ? '/logos/logo-carlos-conca-light.svg' : '/logos/logo-carlos-conca.svg'}
            alt=""
            width={40}
            height={40}
            priority
          />
        </Link>

        <nav aria-label={t('primary')} className="hidden items-center gap-2 md:flex">
          <ul className="flex items-center gap-1">
            {ITEMS.map(({ href, key }) => {
              const current = pathname === href
              const outline = key === 'contact'
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'relative flex h-10 items-center rounded-full px-4 text-base',
                      outline && 'border border-current/70',
                      current && 'text-ink-900',
                    )}
                  >
                    {current && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-paper-50"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative">{t(key)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <LocaleSwitch />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
