import { describe, expect, it } from 'vitest'
import { routing } from './routing'

describe('routing', () => {
  it('define las 6 rutas con slug traducido', () => {
    expect(Object.keys(routing.pathnames)).toHaveLength(6)
    expect(routing.pathnames['/publicaciones']).toEqual({
      es: '/publicaciones',
      en: '/publications',
    })
  })
})
