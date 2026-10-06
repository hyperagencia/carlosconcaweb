import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  pathnames: {
    '/': { es: '/', en: '/' },
    '/publicaciones': { es: '/publicaciones', en: '/publications' },
    '/investigacion': { es: '/investigacion', en: '/research' },
    '/docencia': { es: '/docencia', en: '/teaching' },
    '/biografia': { es: '/biografia', en: '/biography' },
    '/contacto': { es: '/contacto', en: '/contact' },
  },
})

export type Locale = (typeof routing.locales)[number]
