import { describe, expect, it } from 'vitest'
import { CACHE_TAGS, isCacheTag } from './tags'

describe('tags', () => {
  it('cubre publicaciones, las 6 páginas y siteSettings', () => {
    expect(CACHE_TAGS).toHaveLength(8)
  })
  it('acepta tipos conocidos y rechaza el resto', () => {
    expect(isCacheTag('publication')).toBe(true)
    expect(isCacheTag('post')).toBe(false)
    expect(isCacheTag(undefined)).toBe(false)
  })
})
