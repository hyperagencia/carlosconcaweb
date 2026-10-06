import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { revalidateSecret } from '@/lib/sanity/env'
import { isCacheTag } from '@/lib/sanity/tags'

// Webhook de Sanity. Configurar con proyección `{_type}` y filtro por `_type`.
export async function POST(req: NextRequest) {
  const { isValidSignature, body } = await parseBody<{ _type?: string }>(
    req,
    revalidateSecret(),
  )

  if (!isValidSignature) {
    return NextResponse.json({ message: 'Firma inválida' }, { status: 401 })
  }
  if (!isCacheTag(body?._type)) {
    return NextResponse.json({ message: 'Tipo desconocido' }, { status: 400 })
  }

  revalidateTag(body._type, 'max')
  return NextResponse.json({ revalidated: body._type })
}
