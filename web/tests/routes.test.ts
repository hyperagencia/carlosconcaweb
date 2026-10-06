import { describe, expect, it } from 'vitest'
import { routing } from '@/lib/i18n/routing'

/**
 * Contrato con el SEO existente (invariante 1 de CLAUDE.md): las 12 URLs
 * indexadas responden 200 sin redirect intermedio. Se prueba contra un
 * servidor real (`next start`), con redirects en modo manual.
 */

// Lista literal: si alguien cambia un slug en routing.ts, esto falla.
const ES = [
  '/',
  '/publicaciones/',
  '/investigacion/',
  '/docencia/',
  '/biografia/',
  '/contacto/',
]
const EN = [
  '/en/',
  '/en/publications/',
  '/en/research/',
  '/en/teaching/',
  '/en/biography/',
  '/en/contact/',
]
const URLS = [
  ...ES.map((path) => ({ path, lang: 'es' })),
  ...EN.map((path) => ({ path, lang: 'en' })),
]

const base = () => process.env.ROUTES_BASE_URL!
const get = (path: string) =>
  fetch(base() + path, { redirect: 'manual' })

describe('las 12 URLs', () => {
  it('son exactamente las que define routing.ts', () => {
    const fromRouting = Object.values(routing.pathnames).flatMap((p) => {
      const { es, en } = p as { es: string; en: string }
      const slash = (s: string) => (s === '/' ? s : s + '/')
      return [slash(es), '/en' + slash(en)]
    })
    expect(new Set(fromRouting)).toEqual(new Set(URLS.map((u) => u.path)))
  })

  it.each(URLS)('$path → 200 sin redirect, lang=$lang', async ({ path, lang }) => {
    const res = await get(path)
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
    const html = await res.text()
    expect(html).toContain(`<html lang="${lang}"`)
    expect(html).toMatch(/<h1[^>]*>/)
  })

  it.each(URLS.filter((u) => u.path !== '/' && u.path !== '/en/'))(
    '$path sin slash final → un solo salto a la versión con slash',
    async ({ path }) => {
      const res = await get(path.slice(0, -1))
      expect([301, 308]).toContain(res.status)
      expect(new URL(res.headers.get('location')!, base()).pathname).toBe(path)
    },
  )
})

describe('redirects de URLs antiguas', () => {
  it('/en/inicio-english/ → 301 a /en/', async () => {
    const res = await get('/en/inicio-english/')
    expect(res.status).toBe(301)
    expect(new URL(res.headers.get('location')!, base()).pathname).toBe('/en/')
  })

  it('/en/publicaciones/ (slug ES bajo /en) no es indexable: redirige al slug traducido', async () => {
    const res = await get('/en/publicaciones/')
    expect(res.status).not.toBe(200)
    expect(new URL(res.headers.get('location')!, base()).pathname).toBe(
      '/en/publications/',
    )
  })
})
