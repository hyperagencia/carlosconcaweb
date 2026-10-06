import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { encodeSignatureHeader } from '@sanity/webhook'

const revalidateTag = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidateTag }))

const SECRET = 'secreto-de-prueba'
process.env.SANITY_REVALIDATE_SECRET = SECRET

async function post(payload: unknown, secret: string | null = SECRET) {
  const { POST } = await import('./route')
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret) {
    headers['sanity-webhook-signature'] = await encodeSignatureHeader(body, Date.now(), secret)
  }
  return POST(new NextRequest('http://localhost/api/revalidate', { method: 'POST', body, headers }))
}

describe('POST /api/revalidate', () => {
  beforeEach(() => revalidateTag.mockClear())

  it('firma válida + tipo conocido → revalida con perfil max', async () => {
    const res = await post({ _type: 'publication' })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('publication', 'max')
  })

  it('sin firma → 401', async () => {
    const res = await post({ _type: 'publication' }, null)
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('firma de otro secreto → 401', async () => {
    const res = await post({ _type: 'publication' }, 'otro-secreto')
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('tipo desconocido → 400', async () => {
    const res = await post({ _type: 'post' })
    expect(res.status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
