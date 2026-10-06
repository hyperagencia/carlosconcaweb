/**
 * Convierte el texto extraído del WordPress (scripts/.cache/extract/*.md) en
 * documentos listos para Sanity: data/contenido/{tipo}.{locale}.json.
 * No toca la red ni el dataset. Es un paso de revisión: los JSON se leen y
 * corrigen a mano antes de cargarlos con `pnpm load:pages`.
 *
 * Campos especiales (los ignora el cargador):
 *   _review    notas para quien revisa (cosas que hay que mirar)
 *   _unmapped  contenido del WP que el schema actual no tiene dónde guardar
 *
 *   pnpm build:content
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const IN = resolve(process.cwd(), 'scripts/.cache/extract')
const OUT = resolve(process.cwd(), 'data/contenido')
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

/* ── Portable Text ────────────────────────────────────────────────────── */

const key = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 10)

type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type MarkDef = { _type: 'link'; _key: string; href: string }
type Block = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: MarkDef[]
  children: Span[]
}

/** Markdown en línea (**negrita**, _cursiva_, [texto](url)) → bloque Portable Text. */
function block(md: string): Block {
  const markDefs: MarkDef[] = []
  const children: Span[] = []
  const re = /\*\*(.+?)\*\*|_(.+?)_|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  const push = (text: string, marks: string[] = []) => {
    if (text) children.push({ _type: 'span', _key: key(`${md}${children.length}`), text, marks })
  }
  while ((m = re.exec(md))) {
    push(md.slice(last, m.index))
    if (m[1] !== undefined) push(m[1], ['strong'])
    else if (m[2] !== undefined) push(m[2], ['em'])
    else {
      const def: MarkDef = { _type: 'link', _key: key(m[4]), href: m[4] }
      if (!markDefs.some((d) => d._key === def._key)) markDefs.push(def)
      push(m[3], [def._key])
    }
    last = m.index + m[0].length
  }
  push(md.slice(last))
  if (!children.length) push('')
  return { _type: 'block', _key: key(md), style: 'normal', markDefs, children }
}

const blocks = (paras: string[]) => paras.map(block)
const plain = (md: string) =>
  md.replace(/\*\*(.+?)\*\*/g, '$1').replace(/_(.+?)_/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1')

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* ── Lectura del markdown ─────────────────────────────────────────────── */

type Page = { lines: string[]; title: string }

async function load(locale: Locale, slug: string): Promise<Page> {
  const md = await readFile(resolve(IN, `${locale}-${slug}.md`), 'utf8')
  const title = (await readFile(resolve(IN, `${locale}-${slug}.title.txt`), 'utf8')).trim()
  const all = md.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean)
  const cut = all.findIndex((l) => l === '## Carlos Conca') // desde ahí es el footer
  return { lines: cut === -1 ? all : all.slice(0, cut), title }
}

const isH = (l: string, n?: number) => (n ? l.startsWith('#'.repeat(n) + ' ') : /^#+ /.test(l))
const text = (l: string) => l.replace(/^#+ /, '').replace(/^- /, '').trim()
const seo = (title: string) => ({ metaTitle: title })
const area = (lines: string[], from: (l: string) => boolean, to: (l: string) => boolean) => {
  const i = lines.findIndex(from)
  if (i === -1) return []
  const rest = lines.slice(i + 1)
  const j = rest.findIndex(to)
  return j === -1 ? rest : rest.slice(0, j)
}

/* ── Páginas ──────────────────────────────────────────────────────────── */

type Doc = Record<string, unknown> & { _id: string; _type: string; language: Locale }

function base(type: string, locale: Locale): Doc {
  return { _id: `${type}-${locale}`, _type: type, language: locale }
}

function home(locale: Locale, p: Page): Doc {
  const L = p.lines
  const review: string[] = []
  const stats: { _key: string; value: string; label: string }[] = []
  const numLine = (l: string) => /^(## )?\d{2,4}$/.test(l)
  L.forEach((l, i) => {
    if (numLine(l) && L[i + 1] && !isH(L[i + 1])) {
      const value = text(l)
      stats.push({ _key: key(value), value, label: L[i + 1] })
    }
  })
  review.push(
    'Figma (wireframe) usa otras cifras de muestra: 47+ años de carrera, 218 publicaciones, 119 artículos ISI, 16 doctores formados. No se usaron: contradicen al WP (54 años, 197/198 publicaciones). Definir con el cliente.',
    'Stats: el WP muestra 4 tarjetas pero los contadores animados no se pueden leer del HTML; solo se extrajeron las cifras fijas. Falta la tarjeta de publicaciones (el WP dice 198, la migración tiene 197).',
  )

  const tl = L.filter((l) => /^- \[.+?\]\(#tab_.+?\)\[.+?\]\(#tab_.+?\)$/.test(l))
  const heads = L.map((l, i) => (/^## \[.+?\]\(#tab_/.test(l) ? i : -1)).filter((i) => i >= 0)
  const bodies = L.slice(heads[heads.length - 1] + 1)
  // El WP guarda 10 textos para 6 décadas (algunas tienen 2 párrafos). El reparto
  // sale de las fechas que menciona cada texto: 1970s·1, 1980s·2, 1990s·2, 2000s·2, 2010s·2, 2020s·1.
  const PER_DECADE = [1, 2, 2, 2, 2, 1]
  const grouped = bodies.length === PER_DECADE.reduce((a, b) => a + b, 0)
  let at = 0
  const timeline = tl.map((l, i) => {
    const [, decade, caption] = l.match(/^- \[(.+?)\]\(#tab_.+?\)\[(.+?)\]\(#tab_.+?\)$/)!
    const n = grouped ? PER_DECADE[i] : 1
    const body = bodies.slice(at, at + n)
    at += n
    return { _key: key(decade), decade, caption, body: blocks(body) }
  })
  if (!grouped)
    review.push(`Timeline: se esperaban 10 textos y hay ${bodies.length}; revisar el reparto por década.`)
  else review.push('Timeline: reparto de párrafos por década inferido de las fechas del texto (1·2·2·2·2·1); confirmar.')
  if (locale === 'en')
    review.push('Timeline EN: las bajadas (caption) están en español en el WP ("Formación", …). Se copiaron tal cual; traducir.')
  review.push('Retrato: no se carga (la imagen del hero es un fondo del tema). Subirlo desde el Studio.')

  return {
    ...base('homePage', locale),
    displayName: text(L[0]).replace(/\*\*/g, ''),
    affiliation: text(L[1]),
    stats,
    timeline,
    seo: seo(p.title),
    _review: review,
  }
}

function biografia(locale: Locale, p: Page): Doc {
  const L = p.lines
  const introStart = L.findIndex((l) => l.startsWith('###### '))
  const awardsAt = L.findIndex((l) => isH(l, 2))
  const intro = L.slice(introStart + 1, awardsAt)
  const awards: { _key: string; name: string; description?: string; year?: string }[] = []
  for (const l of L.slice(awardsAt + 1)) {
    if (isH(l, 3)) awards.push({ _key: key(l), name: text(l) })
    else if (isH(l, 4)) awards[awards.length - 1].year = text(l)
    else awards[awards.length - 1].description = l
  }
  return {
    ...base('biografiaPage', locale),
    heading: text(L[0]),
    intro: blocks(intro),
    awards,
    seo: seo(p.title),
    _review: [],
  }
}

const LABEL = /^\*\*(.+?):\*\*\s*(.*)$/

function investigacion(locale: Locale, p: Page): Doc {
  const L = p.lines
  const review: string[] = []
  const introStart = L.findIndex((l) => l.startsWith('###### '))
  const areasAt = L.findIndex((l) => isH(l, 2))
  const areas: unknown[] = []
  let cur: { title: string; paras: string[] } | null = null
  const groups: { title: string; paras: string[] }[] = []
  for (const l of L.slice(areasAt + 1)) {
    if (isH(l, 3)) groups.push((cur = { title: text(l), paras: [] }))
    else cur?.paras.push(l)
  }
  for (const g of groups) {
    const apps = g.paras.find((l) => /^\*\*(Aplicaciones|Applications):\*\*/.test(l))
    const body = g.paras.filter((l) => l !== apps)
    const first = plain(body[0] ?? '')
    const summary = first.length <= 320 ? first : first.slice(0, first.lastIndexOf(' ', 317)) + '…'
    if (first.length > 320) review.push(`"${g.title}": el primer párrafo supera 320 caracteres; el summary quedó recortado.`)
    review.push(`"${g.title}": summary = primer párrafo del WP; confirmar que se entiende sin contexto.`)
    areas.push({
      _key: key(g.title),
      _type: 'researchArea',
      title: g.title,
      slug: { _type: 'slug', current: slugify(g.title).slice(0, 60) },
      summary,
      body: blocks(body),
      ...(apps
        ? { applications: plain(apps.replace(LABEL, '$2')).replace(/\.$/, '').split(/,\s*/).filter(Boolean) }
        : {}),
    })
  }
  review.push(
    '"Publicaciones clave" (texto libre en el WP) quedó dentro de `body`: el campo keyPublications del schema son referencias a publicaciones marcadas como destacadas, que se eligen en el Studio.',
  )
  return {
    ...base('investigacionPage', locale),
    heading: text(L[0]),
    intro: blocks(L.slice(introStart + 1, areasAt)),
    areas,
    seo: seo(p.title),
    _review: review,
  }
}

function docencia(locale: Locale, p: Page): Doc {
  const L = p.lines
  const review: string[] = []
  const eyebrowAt = L.findIndex((l) => l.startsWith('###### '))
  const guideAt = L.findIndex((l, i) => i > eyebrowAt && isH(l, 2))
  const heads = L.map((l, i) => (l.startsWith('###### ') ? i : -1)).filter((i) => i >= 0)
  const postdocsAt = heads[1]
  const programsAt = heads[2]

  const group = (labelRe: RegExp) =>
    area(L, (l) => labelRe.test(l), (l) => /^\*\*.+:\*\*$/.test(l) || l.startsWith('######'))

  const intl = group(/^\*\*(Doctorados con posición académica internacional|PhDs with International Academic Positions):\*\*$/)
  const chile = group(/^\*\*(Doctorados con posición académica en Chile|PhDs with Academic Positions in Chile):\*\*$/)
  const eng = group(/^\*\*(Ingenieros Civiles|Civil Engineers)/)

  const doctorates = intl
    .filter((l) => l.startsWith('–'))
    .map((l) => {
      const m = l.match(/^–\s*(.+?)\s*\((\d{4})\)\s*;?\s*(.*)$/)
      if (!m) {
        review.push(`Doctorado sin formato reconocido: ${l}`)
        return { _key: key(l), name: l }
      }
      const parts = m[3].split(/,\s*/)
      const country = parts.length > 1 ? parts.pop()! : undefined
      return { _key: key(l), name: m[1], year: m[2], position: parts.join(', '), ...(country ? { country } : {}) }
    })

  const programs = L.slice(programsAt + 1).map((l) => {
    const m = l.match(/^\*\*(.+?)\s*\(([^()]+)\)\*\*\s*(.*)$/)
    if (!m) {
      review.push(`Programa sin formato reconocido: ${l.slice(0, 60)}`)
      return { _key: key(l), name: plain(l) }
    }
    return { _key: key(m[1]), name: m[1], period: m[2], description: m[3] }
  })

  review.push(
    'Posición/país de cada doctorado: se separó el último tramo tras la coma como país; revisar que cada fila quedó bien.',
    'Los doctorados en Chile y la lista de ingenieros/magísteres NO tienen campo en el schema actual (solo hay "internacionales"). Quedaron en _unmapped; decidir si se amplía el schema.',
  )

  return {
    ...base('docenciaPage', locale),
    heading: text(L[0]),
    eyebrow: text(L[eyebrowAt]),
    intro: blocks([...L.slice(eyebrowAt + 1, guideAt), text(L[guideAt])]),
    doctorates,
    postdocs: blocks(L.slice(postdocsAt + 1, programsAt)),
    programs,
    seo: seo(p.title),
    _unmapped: { doctoradosChile: chile, ingenierosYMagisteres: eng },
    _review: review,
  }
}

function simple(type: string, locale: Locale, p: Page, review: string[] = []): Doc {
  return { ...base(type, locale), heading: text(p.lines[0]), seo: seo(p.title), _review: review }
}

/* ── siteSettings (footer del WP) ─────────────────────────────────────── */

async function settings(locale: Locale): Promise<Doc> {
  const md = await readFile(resolve(IN, `${locale}-home.md`), 'utf8')
  const all = md.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean)
  const footer = all.slice(all.findIndex((l) => l === '## Carlos Conca'))
  const section = (start: string, end: (l: string) => boolean) => {
    const rest = footer.slice(footer.indexOf(start) + 1)
    const j = rest.findIndex(end)
    return (j === -1 ? rest : rest.slice(0, j))
      .map((l) => l.match(/^### \[(.+?)\]\((.+?)\)$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => ({ _key: key(m[2]), _type: 'link', label: m[1], url: m[2] }))
  }
  const links = section('Links', (l) => l === 'Info')
  const info = section('Info', (l) => l.startsWith('©'))
  const cv = info.find((l) => /\.pdf$/i.test(l.url))
  const infoNoCv = info.filter((l) => l !== cv)
  const sameAs = [...links, ...info]
    .map((l) => l.url)
    .filter((u) => /wikipedia|scholar\.google|orcid|academia\.edu|dim\.uchile/.test(u))
  return {
    ...base('siteSettings', locale),
    footerLinks: links,
    footerInfo: infoNoCv,
    sameAs,
    ...(cv ? { _cvSource: cv.url } : {}),
    _review: [
      'CV: se descarga del WP y se sube como archivo al cargar (campo cv).',
      'sameAs: no hay ORCID en el WP; agregarlo en el Studio cuando exista.',
    ],
  }
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  await mkdir(OUT, { recursive: true })
  const docs: Doc[] = []
  for (const locale of LOCALES) {
    docs.push(home(locale, await load(locale, 'home')))
    docs.push(biografia(locale, await load(locale, 'biografia')))
    docs.push(investigacion(locale, await load(locale, 'investigacion')))
    docs.push(docencia(locale, await load(locale, 'docencia')))
    docs.push(
      simple('publicacionesPage', locale, await load(locale, 'publicaciones'), [
        'El WP no tiene texto introductorio en esta página (solo el título y el contador).',
      ]),
    )
    docs.push(
      simple('contactoPage', locale, await load(locale, 'contacto'), [
        'El WP no tiene correo ni dirección: la página solo muestra el pie. Completar en el Studio si se quiere publicar.',
      ]),
    )
    docs.push(await settings(locale))
  }
  for (const d of docs) {
    await writeFile(resolve(OUT, `${d._type}.${d.language}.json`), JSON.stringify(d, null, 2) + '\n')
    const n = (d._review as string[]).length
    console.log(`  ✓ ${d._type}.${d.language}.json${n ? `  (${n} nota${n > 1 ? 's' : ''} de revisión)` : ''}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
