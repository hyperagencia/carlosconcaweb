/**
 * Carga los documentos de página (data/contenido/*.json) en Sanity.
 *
 *   pnpm load:pages -- --dry-run   valida y muestra el plan, no escribe
 *   pnpm load:pages                crea los que faltan (createIfNotExists)
 *   pnpm load:pages -- --force     sobrescribe también los existentes
 *
 * Por defecto NO pisa documentos existentes: lo que el profesor edite en el
 * Studio no se pierde al re-ejecutar. IDs fijos `{tipo}-{locale}`.
 * Los campos `_review`, `_unmapped` y `_cvSource` son notas y no se cargan.
 */
import { createClient } from '@sanity/client'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DIR = resolve(process.cwd(), 'data/contenido')
const SCHEMA = resolve(process.cwd(), 'studio/schema.json')
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const NOTES = ['_review', '_unmapped', '_cvSource']

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

type Doc = Record<string, unknown> & { _id: string; _type: string }

/** Campos válidos por tipo, según el schema extraído de studio/ (pnpm typegen). */
async function schemaFields(): Promise<Map<string, Set<string>> | null> {
  try {
    const schema = JSON.parse(await readFile(SCHEMA, 'utf8')) as {
      name: string
      type: string
      attributes?: Record<string, unknown>
    }[]
    return new Map(
      schema
        .filter((t) => t.type === 'document' && t.attributes)
        .map((t) => [t.name, new Set(Object.keys(t.attributes!))]),
    )
  } catch {
    return null
  }
}

async function main() {
  console.log(DRY_RUN ? '\n▸ SIMULACIÓN (no se escribe nada)\n' : '\n▸ CARGA DE PÁGINAS\n')

  const files = (await readdir(DIR)).filter((f) => f.endsWith('.json')).sort()
  const raw = await Promise.all(files.map(async (f) => JSON.parse(await readFile(resolve(DIR, f), 'utf8')) as Doc))
  const fields = await schemaFields()
  if (!fields) console.warn('  ⚠ studio/schema.json no existe: se omite la validación de campos (corre pnpm typegen).')

  // 1 · Validar todo antes de escribir
  const errors: string[] = []
  for (const d of raw) {
    if (d._id !== `${d._type}-${d.language}`) errors.push(`${d._id}: el _id no es {tipo}-{locale}`)
    const allowed = fields?.get(d._type)
    if (fields && !allowed) errors.push(`${d._id}: tipo desconocido "${d._type}"`)
    for (const k of Object.keys(d)) {
      if (NOTES.includes(k) || k.startsWith('_')) continue
      if (allowed && !allowed.has(k)) errors.push(`${d._id}: campo "${k}" no existe en el schema`)
    }
    for (const area of (d.areas as { title: string; summary?: string }[] | undefined) ?? []) {
      if (!area.summary || area.summary.length > 320) errors.push(`${d._id}: "${area.title}" necesita summary de 1–320 caracteres`)
    }
  }
  if (errors.length) {
    console.error(`  ✗ ${errors.length} error(es). No se escribió nada:\n`)
    errors.forEach((e) => console.error(`    ${e}`))
    process.exit(1)
  }
  console.log(`  ✓ ${raw.length} documentos validados`)

  const existing = new Set<string>(
    await client.fetch(`*[_id in $ids]._id`, { ids: raw.map((d) => d._id) }),
  )
  const plan = raw.map((d) => ({ d, exists: existing.has(d._id) }))
  for (const { d, exists } of plan) {
    const action = exists ? (FORCE ? 'sobrescribir' : 'ya existe, se deja') : 'crear'
    console.log(`    ${d._id.padEnd(26)} ${action}`)
  }
  if (DRY_RUN) {
    console.log('\n▸ Simulación completa. Sin cambios en el dataset.\n')
    return
  }

  // 2 · Escribir
  let created = 0
  let replaced = 0
  for (const { d, exists } of plan) {
    if (exists && !FORCE) continue
    const doc: Doc = Object.fromEntries(Object.entries(d).filter(([k]) => !NOTES.includes(k)))

    if (d._type === 'siteSettings' && typeof d._cvSource === 'string') {
      const res = await fetch(d._cvSource)
      if (!res.ok) throw new Error(`No se pudo descargar el CV (${res.status}): ${d._cvSource}`)
      const asset = await client.assets.upload('file', Buffer.from(await res.arrayBuffer()), {
        filename: d._cvSource.split('/').pop(),
        contentType: 'application/pdf',
      })
      doc.cv = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
    }

    if (exists) {
      await client.createOrReplace(doc)
      replaced++
    } else {
      await client.createIfNotExists(doc)
      created++
    }
  }
  console.log(`\n  Creados: ${created} · Sobrescritos: ${replaced} · Intactos: ${plan.length - created - replaced}`)

  // 3 · Verificación
  const found: string[] = await client.fetch(`*[_id in $ids]._id`, { ids: raw.map((d) => d._id) })
  const missing = raw.filter((d) => !found.includes(d._id)).map((d) => d._id)
  console.log(
    missing.length
      ? `\n✗ Faltan en el dataset: ${missing.join(', ')}\n`
      : `\n▸ Verificado: ${found.length}/${raw.length} documentos presentes.\n`,
  )
  if (missing.length) process.exit(1)
}

main().catch((err) => {
  console.error('\n✗ Fallo en la carga:', err)
  process.exit(1)
})
