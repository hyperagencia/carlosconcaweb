# CLAUDE.md

Sitio de Carlos Conca — matemático chileno, Premio Nacional de Ciencias Exactas 2003.
Migración de WordPress a Next.js 16 + Sanity. Cliente de Hyper Branding Agency.

El sitio actual está **en producción y funcionando**. Esta es una reconstrucción que
debe preservar URLs, contenido y posicionamiento SEO. El diseño desktop ya está
aprobado en Figma; el diseño mobile es nuevo y se piensa de forma independiente.

---

## Comandos

```bash
pnpm dev                    # Next en :3000
pnpm --filter studio dev    # Sanity Studio en :3333
pnpm build                  # build de producción del sitio
pnpm typecheck              # tsc --noEmit en ambos workspaces
pnpm lint
pnpm test                   # vitest
pnpm typegen                # extrae schema de studio/ + genera tipos de las queries de web/

pnpm migrate -- --dry-run   # valida el JSON de publicaciones sin escribir
pnpm migrate                # importa a Sanity (idempotente)
```

Antes de dar por terminada cualquier tarea: `pnpm typecheck && pnpm lint && pnpm build`.

---

## Estructura

```
web/                     Next.js 16 · App Router · Tailwind v4
  app/[locale]/          rutas localizadas (ver "Rutas")
  components/
  lib/
    sanity/              cliente, queries GROQ, tipos generados
    search/              índice y normalización de búsqueda
  messages/              es.json · en.json (next-intl)
studio/                  Sanity Studio standalone (se despliega en sanity.studio)
data/publicaciones.json  origen de la migración · solo lectura, no editar
scripts/
```

---

## Invariantes

Romper cualquiera de estas invalida el proyecto. Si una tarea parece exigirlo,
detente y pregunta.

**1 · Las URLs no cambian.** Están indexadas y el sitio viene creciendo en
orgánico. Los slugs están traducidos, no solo prefijados:

| ES (sin prefijo) | EN (prefijo `/en`) |
|---|---|
| `/` | `/en` |
| `/publicaciones` | `/en/publications` |
| `/investigacion` | `/en/research` |
| `/docencia` | `/en/teaching` |
| `/biografia` | `/en/biography` |
| `/contacto` | `/en/contact` |

Se implementa con `pathnames` de next-intl y `localePrefix: 'as-needed'`.
Usar siempre el `Link` y el `useRouter` que exporta `@/lib/i18n/navigation`,
nunca los de `next/link` o `next/navigation` — los nativos no traducen el
segmento y generan URLs que no existen.

**2 · No hay páginas individuales por publicación.** Decisión del cliente. Las
197 publicaciones viven en `/publicaciones` y punto. No crear rutas dinámicas
`/publicaciones/[slug]`.

**3 · Las 197 tarjetas se renderizan en el HTML del servidor**, no las primeras
N. El control de rendimiento es `content-visibility: auto` sobre las tarjetas
bajo el pliegue, no paginación en servidor. Los crawlers deben ver el catálogo
completo en una sola URL; ese HTML es además la fuente del índice de búsqueda
en cliente, así que no hay fetch adicional. "Cargar más" es revelado por CSS,
no una petición.

**4 · Nada de `defineLive` ni Visual Editing.** Es el default que recomiendan
los docs de Sanity, pero abre una conexión SSE persistente y vuelve las páginas
dinámicas. El sitio se despliega en el plan gratuito de Vercel y debe ser
estático. Los datos se leen con `'use cache'` + `cacheTag`, y se invalidan por
webhook desde Sanity con `revalidateTag`.

**5 · Los valores de `category` son cadenas en español con guiones** y vienen
tal cual del sistema anterior: `articulo-wos`, `actas-capitulos`,
`articulo-indexado`, `revista-nacional`, `otras`, `libro`. No renombrar a
camelCase, no traducir, no "ordenar". La etiqueta visible se resuelve en
`messages/{locale}.json`.

**6 · Las imágenes van por Cloudinary**, configurado como `loader` de
`next/image`. No usar la optimización de imágenes de Vercel: es un recurso
medido y una de las causas típicas de sobrecosto.

**7 · Studio standalone.** No montar el Studio dentro de la app Next
(`/app/studio/[[...tool]]`). Vive en `studio/` y se despliega con
`sanity deploy`.

---

## Next.js 16 — diferencias que importan

- **Las request APIs son asíncronas.** `params`, `searchParams`, `cookies()`,
  `headers()`, `draftMode()` devuelven promesas. También los props de
  `opengraph-image` e `icon`. El acceso síncrono fue eliminado, no deprecado.
- **`cacheComponents: true`** está activado. El caché es explícito: si una
  función lee datos y no declara `'use cache'`, el segmento se vuelve dinámico.
- **Patrón de datos**, en todas las lecturas de Sanity:

  ```ts
  import { cacheLife, cacheTag } from 'next/cache'

  export async function getPublications() {
    'use cache'
    cacheLife('max')
    cacheTag('publication')
    return client.fetch(PUBLICATIONS_QUERY)
  }
  ```

- **Invalidación**: `revalidateTag(tag, { profile: 'max' })`. Sin el `profile`
  el comportamiento es expiración inmediata, que provoca un cache miss
  bloqueante en la primera visita después de publicar. Con `'max'` se sirve
  stale-while-revalidate.
- Turbopack es el default en `dev`. No agregar flags.

---

## Modelo de datos

Documentos en Sanity (~215 en total):

- **`publication`** — sin localización. Títulos, revistas y autores están en
  inglés en el original y no se traducen. Campos: `title`, `citation`, `year`,
  `category`, `collaborators?`, `link?`, `featured`, `legacyId` (oculto, es el
  puente con el JSON de origen que hace la migración idempotente).
- **Páginas** — localización a nivel documento vía
  `@sanity/document-internationalization`, con IDs fijos `{type}-{locale}`:
  `homePage`, `biografiaPage`, `investigacionPage`, `docenciaPage`,
  `publicacionesPage`, `contactoPage`, `siteSettings`.

`link` contiene la URL completa (normalmente `https://doi.org/…`). El DOI
desnudo para el JSON-LD se deriva con regex en el build; **no existe un campo
`doi` separado** y no hay que crearlo.

Cobertura actual de enlaces: 73 de 197. Las 124 restantes muestran "Sin enlace
disponible". Es esperado, no un bug.

---

## Búsqueda de publicaciones

Corre 100% en cliente sobre datos ya hidratados. Sin red, sin servidor.

- **Normalizar acentos siempre**: `.normalize('NFD').replace(/\p{Diacritic}/gu, '')`
  sobre el query y sobre los campos indexados. Sin esto "matematica" no
  encuentra "matemática" y el buscador parece roto en español.
- Filtrar sobre `title`, `citation` y `collaborators`.
- `useDeferredValue` sobre el query; `useMemo` sobre el resultado; componente
  de tarjeta memoizado con key estable. El INP se pierde acá o no se pierde.
- Sin virtualización. Con 197 elementos añade complejidad y no aporta.
- Estado en la URL (`?q=`, `?cat=`, `?year=`) vía `history.replaceState`, para
  que una vista filtrada se pueda compartir.
- Sin librerías de búsqueda. Un `.filter()` sobre 197 registros toma menos de
  1 ms; MiniSearch solo entraría si se pide tolerancia a errores de tipeo.

---

## SEO · AEO · GEO

Es un objetivo del proyecto, no un extra. En cada página nueva:

- `generateMetadata` async con `alternates.canonical` y `alternates.languages`
  (es, en, x-default).
- JSON-LD. `Person` en el layout con `sameAs` desde `siteSettings` (Wikipedia,
  Scholar, ORCID, Academia, DIM). `ItemList` de `ScholarlyArticle` en
  `/publicaciones`.
- `app/sitemap.ts` y `app/robots.ts`. El robots permite explícitamente GPTBot,
  ClaudeBot, PerplexityBot, OAI-SearchBot y Google-Extended.
- `llms.txt` y `llms-full.txt` generados en build desde la misma data de Sanity.
  El segundo lleva el catálogo completo en texto plano.
- Cada área de investigación en `/investigacion` es deep-linkable por `#slug` y
  abre con un párrafo autocontenido (campo `summary`, obligatorio en el schema).
  Es el fragmento que citan los buscadores y asistentes; no lo reemplaces por
  texto que dependa del contexto anterior.

---

## Convenciones

- TypeScript estricto. Los tipos de las queries se generan con
  `pnpm typegen`, no se escriben a mano.
- Server Components por defecto. `'use client'` solo donde hay estado o
  eventos — en la práctica: buscador de publicaciones, acordeón, nav mobile.
- Tailwind v4, configuración CSS-first con `@theme`. Los tokens salen del
  archivo de Figma; no inventar valores ni hardcodear colores fuera de `@theme`.
- Breakpoints propios del nuevo diseño mobile. **No** heredar los del theme
  Salient del sitio anterior (1300 / 1000 / 690) — eran una restricción de
  WordPress, no una decisión de diseño.
- Mobile y desktop comparten un solo árbol de componentes. Que el diseño sea
  distinto no significa dos implementaciones ni render por user-agent, que
  destruiría la cacheabilidad. La diferencia se resuelve con CSS y container
  queries; solo el nav y el panel de filtros se montan condicionalmente.
- Textos de interfaz siempre desde `messages/`, nunca literales en JSX.
- `data/publicaciones.json` es de solo lectura. Es el origen de la migración y
  el respaldo si algo sale mal.

---

## Objetivos medibles

Se toma una línea base antes de migrar y se compara después. Es parte del
compromiso con el cliente y del caso de estudio.

| Métrica | Actual (mobile) | Objetivo |
|---|---|---|
| LCP | 5.2 s | < 1.2 s |
| INP | — | < 100 ms |
| CLS | — | < 0.05 |
| URLs preservadas | — | 12 de 12 |
| Publicaciones migradas | — | 197 de 197 |

---

## Contexto del cliente

El profesor tiene 71 años, es riguroso y no es técnico. El Studio es para él:
las publicaciones van primero en la estructura y sin submenús, cada campo se
etiqueta con el nombre que él usaría, y las descripciones explican qué hace el
campo, no cómo funciona. Si al agregar un campo hay que explicar qué es un
slug o un DOI, la explicación va en la `description` del campo.
