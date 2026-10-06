/**
 * MIGRACIÓN — publicaciones.json → Sanity Content Lake
 *
 *   pnpm dlx tsx scripts/migrate-publications.ts --dry-run
 *   pnpm dlx tsx scripts/migrate-publications.ts
 *
 * Requiere en .env.local:
 *   SANITY_PROJECT_ID
 *   SANITY_DATASET=production
 *   SANITY_WRITE_TOKEN     (token con permisos de escritura, NO commitear)
 *
 * Propiedades:
 *  · Idempotente. El vínculo con el origen es el campo `legacyId`, no el `_id`.
 *    Se puede re-ejecutar N veces: actualiza lo existente, crea lo faltante,
 *    nunca duplica. Un fallo a mitad de camino se corrige repitiendo el comando.
 *  · Transaccional por lotes de 50, muy por debajo del límite de mutaciones
 *    de Sanity (25 req/s), con pausa entre lotes.
 *  · Valida ANTES de escribir. Si un registro no pasa, aborta el lote completo
 *    y reporta — no deja el dataset a medio migrar.
 *  · Reporte de integridad al final: conteos por categoría y por década
 *    contrastados contra el origen.
 */

import { createClient } from '@sanity/client'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/* ── Configuración ────────────────────────────────────────────────────── */

const SOURCE_FILE = resolve(process.cwd(), 'data/publicaciones.json')
const BATCH_SIZE = 50
const BATCH_PAUSE_MS = 400
const DRY_RUN = process.argv.includes('--dry-run')

const VALID_CATEGORIES = new Set([
  'articulo-wos',
  'actas-capitulos',
  'articulo-indexado',
  'revista-nacional',
  'otras',
  'libro',
])

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false, // nunca CDN en escritura ni en lectura de control
})

/* ── Tipos ────────────────────────────────────────────────────────────── */

type SourceRecord = {
  id: number
  titulo: string
  revista: string
  autores: string
  anio: number
  categoria: string
  categoria_label: string // se descarta: la etiqueta se resuelve en next-intl
  doi: string | null // en el origen es la URL completa, no el identificador
  pdf: null // null en los 197 registros: campo muerto, no se migra
}

type PublicationDoc = {
  _type: 'publication'
  legacyId: string
  title: string
  citation: string
  collaborators?: string
  year: number
  category: string
  link?: string
  featured: boolean
}

/* ── Normalización ────────────────────────────────────────────────────── */

/**
 * Colapsa espacios, normaliza a NFC y limpia bordes. Importante: el JSON trae
 * caracteres acentuados y guiones tipográficos (– vs -) que deben preservarse
 * tal cual — solo se unifica la forma de composición Unicode para que la
 * búsqueda del sitio compare de forma consistente.
 */
function clean(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function transform(record: SourceRecord): PublicationDoc {
  const collaborators = clean(record.autores)
  const link = record.doi ? clean(record.doi) : undefined

  return {
    _type: 'publication',
    legacyId: String(record.id),
    title: clean(record.titulo),
    citation: clean(record.revista),
    // 19 de 197 registros son de autoría única: el campo se omite en vez de
    // guardarse como cadena vacía, para que el frontend no renderice "con ".
    ...(collaborators ? { collaborators } : {}),
    year: record.anio,
    category: record.categoria,
    ...(link ? { link } : {}),
    featured: false, // se marca a mano después, para las áreas de investigación
  }
}

/* ── Validación ───────────────────────────────────────────────────────── */

function validate(doc: PublicationDoc, source: SourceRecord): string[] {
  const errors: string[] = []
  const at = `#${source.id}`

  if (!doc.title) errors.push(`${at} título vacío`)
  if (!doc.citation) errors.push(`${at} referencia vacía`)
  if (!Number.isInteger(doc.year) || doc.year < 1975 || doc.year > 2030)
    errors.push(`${at} año fuera de rango: ${doc.year}`)
  if (!VALID_CATEGORIES.has(doc.category))
    errors.push(`${at} categoría desconocida: "${doc.category}"`)
  if (doc.link && !/^https?:\/\//.test(doc.link))
    errors.push(`${at} enlace mal formado: ${doc.link}`)

  return errors
}

/* ── Reporte de integridad ────────────────────────────────────────────── */

function tally<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

function compare(label: string, source: Record<string, number>, target: Record<string, number>) {
  const keys = [...new Set([...Object.keys(source), ...Object.keys(target)])].sort()
  console.log(`\n  ${label}`)
  let ok = true
  for (const k of keys) {
    const a = source[k] ?? 0
    const b = target[k] ?? 0
    const mark = a === b ? '✓' : '✗'
    if (a !== b) ok = false
    console.log(`    ${mark} ${k.padEnd(20)} origen ${String(a).padStart(3)}   destino ${String(b).padStart(3)}`)
  }
  return ok
}

/* ── Ejecución ────────────────────────────────────────────────────────── */

async function main() {
  console.log(DRY_RUN ? '\n▸ SIMULACIÓN (no se escribe nada)\n' : '\n▸ MIGRACIÓN\n')

  const raw = await readFile(SOURCE_FILE, 'utf8')
  const source: SourceRecord[] = JSON.parse(raw)
  console.log(`  Origen: ${source.length} registros`)

  // 1 · Transformar y validar todo antes de tocar el dataset
  const docs = source.map(transform)
  const errors = docs.flatMap((doc, i) => validate(doc, source[i]))

  if (errors.length) {
    console.error(`\n  ✗ ${errors.length} error(es) de validación. No se escribió nada:\n`)
    errors.forEach((e) => console.error(`    ${e}`))
    process.exit(1)
  }
  console.log(`  ✓ ${docs.length} registros validados`)

  // 2 · Mapear lo que ya existe en el dataset por legacyId
  const existing: { _id: string; legacyId: string }[] = await client.fetch(
    `*[_type == "publication" && defined(legacyId)]{_id, legacyId}`
  )
  const byLegacyId = new Map(existing.map((d) => [d.legacyId, d._id]))
  console.log(`  Dataset: ${existing.length} publicaciones con legacyId`)

  const toUpdate = docs.filter((d) => byLegacyId.has(d.legacyId))
  const toCreate = docs.filter((d) => !byLegacyId.has(d.legacyId))
  console.log(`  Plan: ${toCreate.length} crear · ${toUpdate.length} actualizar`)

  // Publicaciones en el dataset que ya no están en el origen: se reportan,
  // no se borran. Borrar automáticamente es la forma más rápida de perder
  // trabajo que el profesor hizo directo en el Studio.
  const sourceIds = new Set(docs.map((d) => d.legacyId))
  const orphans = existing.filter((d) => !sourceIds.has(d.legacyId))
  if (orphans.length) {
    console.warn(
      `\n  ⚠ ${orphans.length} publicación(es) en Sanity sin correspondencia en el JSON.`
    )
    console.warn(`    No se eliminan. Revisar manualmente: ${orphans.map((o) => o._id).join(', ')}`)
  }

  if (DRY_RUN) {
    console.log('\n  Muestra de la transformación:\n')
    console.dir(docs.slice(0, 2), { depth: null })
    console.log('\n▸ Simulación completa. Sin cambios en el dataset.\n')
    return
  }

  // 3 · Escribir por lotes transaccionales
  let written = 0
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE)
    const tx = client.transaction()

    for (const doc of batch) {
      const existingId = byLegacyId.get(doc.legacyId)
      if (existingId) {
        // `featured` se excluye del patch: es una marca curatorial que se
        // define en el Studio y no debe revertirse al re-ejecutar el script.
        const { featured, ...patchable } = doc
        tx.patch(existingId, (p) => p.set(patchable))
      } else {
        tx.create(doc) // Sanity genera el _id
      }
    }

    await tx.commit({ visibility: 'async' })
    written += batch.length
    console.log(`  … ${written}/${docs.length}`)
    if (i + BATCH_SIZE < docs.length) await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS))
  }

  // 4 · Verificación de integridad contra el dataset real
  console.log('\n▸ VERIFICACIÓN')

  const migrated: { year: number; category: string; link?: string }[] = await client.fetch(
    `*[_type == "publication" && defined(legacyId)]{year, category, link}`
  )

  console.log(`\n  Total  origen ${docs.length}   destino ${migrated.length}`)

  const okCategory = compare(
    'Por categoría',
    tally(docs, (d) => d.category),
    tally(migrated, (d) => d.category)
  )
  const okDecade = compare(
    'Por década',
    tally(docs, (d) => `${Math.floor(d.year / 10) * 10}s`),
    tally(migrated, (d) => `${Math.floor(d.year / 10) * 10}s`)
  )
  const okLinks = compare(
    'Cobertura de enlaces',
    tally(docs, (d) => (d.link ? 'con enlace' : 'sin enlace')),
    tally(migrated, (d) => (d.link ? 'con enlace' : 'sin enlace'))
  )

  const allOk = docs.length === migrated.length && okCategory && okDecade && okLinks
  console.log(
    allOk
      ? '\n▸ Integridad verificada. Migración completa.\n'
      : '\n✗ Discrepancias detectadas. Revisar antes de continuar.\n'
  )
  if (!allOk) process.exit(1)
}

main().catch((err) => {
  console.error('\n✗ Fallo en la migración:', err)
  process.exit(1)
})
