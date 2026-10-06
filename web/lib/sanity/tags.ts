/** Tipos de documento que se leen del sitio. El tag de caché es siempre el `_type`. */
export const PAGE_TYPES = [
  'homePage',
  'biografiaPage',
  'investigacionPage',
  'docenciaPage',
  'publicacionesPage',
  'contactoPage',
] as const

export const CACHE_TAGS = ['publication', ...PAGE_TYPES, 'siteSettings'] as const

export type PageType = (typeof PAGE_TYPES)[number]
export type CacheTag = (typeof CACHE_TAGS)[number]

export const isCacheTag = (value: unknown): value is CacheTag =>
  typeof value === 'string' && (CACHE_TAGS as readonly string[]).includes(value)
