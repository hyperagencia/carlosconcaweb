/**
 * Extrae el texto de las 12 páginas del WordPress actual (solo GET) y lo deja
 * como markdown plano en scripts/.cache/extract/{locale}-{slug}.md, para
 * revisarlo y mapearlo a los campos del schema. No escribe nada en WP ni en Sanity.
 *
 *   pnpm extract:wp
 */
import * as cheerio from 'cheerio'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ORIGIN = 'https://carlosconca.cl'
const OUT = resolve(process.cwd(), 'scripts/.cache/extract')

const PAGES = [
  ['es', 'home', '/'],
  ['es', 'biografia', '/biografia/'],
  ['es', 'investigacion', '/investigacion/'],
  ['es', 'docencia', '/docencia/'],
  ['es', 'publicaciones', '/publicaciones/'],
  ['es', 'contacto', '/contacto/'],
  ['en', 'home', '/en/inicio-english/'],
  ['en', 'biografia', '/en/biography/'],
  ['en', 'investigacion', '/en/research/'],
  ['en', 'docencia', '/en/teaching/'],
  ['en', 'publicaciones', '/en/publications/'],
  ['en', 'contacto', '/en/contact/'],
] as const

const clean = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim()

function inline($: cheerio.CheerioAPI, el: cheerio.Cheerio<any>): string {
  let out = ''
  el.contents().each((_, node) => {
    if (node.type === 'text') out += $(node).text()
    else if (node.type === 'tag') {
      const n = $(node)
      const tag = node.tagName
      if (tag === 'br') out += '\n'
      else if (tag === 'a') {
        const text = clean(inline($, n))
        const href = n.attr('href')
        out += text ? (href && href !== '#' ? `[${text}](${href})` : text) : ''
      } else if (tag === 'strong' || tag === 'b') out += `**${clean(inline($, n))}**`
      else if (tag === 'em' || tag === 'i') out += `_${clean(inline($, n))}_`
      else out += inline($, n)
    }
  })
  return out
}

function pageTitle(html: string): string {
  const $ = cheerio.load(html)
  return clean($('title').first().text())
}

function toMarkdown(html: string): string {
  const $ = cheerio.load(html)
  const root = $('#ajax-content-wrap')
  root.find('script, style, svg, noscript, .screen-reader-text, .nectar-next-section-wrap, #footer-outer, #slide-out-widget-area').remove()
  const lines: string[] = []
  root.find('h1,h2,h3,h4,h5,h6,p,li,img,figcaption,div').each((_, node) => {
    const el = $(node)
    const tag = node.tagName
    if (tag === 'img') {
      const src = el.attr('data-src') ?? el.attr('src')
      if (src && !src.startsWith('data:')) lines.push(`![${clean(el.attr('alt') ?? '')}](${src})`)
      return
    }
    // los <div> solo cuentan si son hoja de texto (sin bloques adentro)
    if (tag === 'div' && el.find('h1,h2,h3,h4,h5,h6,p,li,div').length) return
    // los <p> dentro de <li> ya salen con su <li>
    if (tag === 'p' && el.closest('li').length) return
    const text = clean(inline($, el))
    if (!text) return
    if (/^h[1-6]$/.test(tag)) lines.push(`${'#'.repeat(Number(tag[1]))} ${text}`)
    else if (tag === 'li') lines.push(`- ${text}`)
    else lines.push(text)
  })
  return lines.join('\n\n') + '\n'
}

async function main() {
  await mkdir(OUT, { recursive: true })
  for (const [locale, slug, path] of PAGES) {
    const res = await fetch(ORIGIN + path, { headers: { 'user-agent': 'conca-migration/1.0' } })
    if (!res.ok) throw new Error(`${path} → ${res.status}`)
    const html = await res.text()
    const md = toMarkdown(html)
    await writeFile(resolve(OUT, `${locale}-${slug}.md`), md)
    await writeFile(resolve(OUT, `${locale}-${slug}.title.txt`), pageTitle(html) + '\n')
    console.log(`  ✓ ${locale}-${slug}.md (${md.length} caracteres)`)
    await new Promise((r) => setTimeout(r, 400))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
