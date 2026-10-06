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
pnpm test:routes            # las 12 URLs contra next start (requiere pnpm build antes)

pnpm migrate -- --dry-run   # valida el JSON de publicaciones sin escribir
pnpm migrate                # importa a Sanity (idempotente)

pnpm extract:wp             # baja el texto del WordPress actual a scripts/.cache/ (solo GET)
pnpm build:content          # lo convierte en data/contenido/*.json (revisable)
pnpm load:pages -- --dry-run  # valida y carga las páginas; sin --force no pisa lo editado
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
data/contenido/          14 JSON de páginas (6 + siteSettings × es/en), revisables
assets/                  bandeja de assets de diseño del usuario (ver assets/README.md)
scripts/                 migración, extracción del WP, carga de páginas
```

---

## Invariantes

Romper cualquiera de estas invalida el proyecto. Si una tarea parece exigirlo,
detente y pregunta.

**1 · Las URLs no cambian.** Están indexadas y el sitio viene creciendo en
orgánico. Los slugs están traducidos, no solo prefijados:

| ES (sin prefijo) | EN (prefijo `/en`) |
|---|---|
| `/` | `/en/` |
| `/publicaciones` | `/en/publications` |
| `/investigacion` | `/en/research` |
| `/docencia` | `/en/teaching` |
| `/biografia` | `/en/biography` |
| `/contacto` | `/en/contact` |

Producción usa **trailing slash** (`/publicaciones` → 301 → `/publicaciones/`), por
lo que `trailingSlash: true`. La home EN indexada hoy es `/en/inicio-english/`:
se sirve `/en/` y se redirige 301 desde la antigua.

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

**6 · Imágenes con `next/image` por defecto** (optimización de Vercel). Hay muy
pocas imágenes; no se usa Cloudinary ni loader custom. Decisión de 2026-10-05.

**7 · Studio standalone.** No montar el Studio dentro de la app Next
(`/app/studio/[[...tool]]`). Vive en `studio/` y se despliega con
`sanity deploy`.

---

## Estado y decisiones (2026-10-05)

### Cómo retomar en otra sesión

1. `pnpm install`; el `.env.local` de la raíz ya tiene `SANITY_PROJECT_ID`,
   `SANITY_DATASET`, `SANITY_WRITE_TOKEN` y `SANITY_REVALIDATE_SECRET` (si falta,
   ver `.env.example`; el token se crea en sanity.io/manage → API → Tokens).
2. `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:routes`
   debe pasar antes de tocar nada.
3. **Fase 3 (desktop) es lo siguiente y está bloqueada por una conversación**: el
   usuario va a explicar la línea visual del tema de Carlos y los componentes de
   Figma uno a uno. No inventar tokens, colores ni tipografías. Preguntar y llenar
   el `@theme` de `web/app/globals.css` (hoy vacío) con lo que él indique. Orden
   del ROADMAP: T5 sistema de diseño → T6 componente de Publicaciones → T7 páginas.
4. Las páginas (`web/app/[locale]/**/page.tsx`) son stubs que solo muestran un `<h1>`;
   los datos ya se leen con las funciones de `web/lib/sanity/fetch.ts`.

### Hecho (T1–T4 del ROADMAP técnico)

- **T1 andamiaje:** monorepo pnpm; `web/` (Next 16, next-intl, Tailwind v4, vitest);
  `studio/` (Sanity standalone, schema en `studio/schemaTypes/`, estructura con
  publicaciones primero); CI en `.github/workflows/ci.yml`; `INFRA.md`.
- **T2 rutas:** `pnpm test:routes` prueba contra `next start` las 12 URLs (200 sin
  redirect, `lang` correcto), el salto sin slash → con slash, y `/en/inicio-english/`
  → 301 `/en/`. Corre en CI. Next emite 308 (no 301) en el redirect de trailing
  slash: es equivalente para SEO y no es configurable.
- **T3 datos:** `web/lib/sanity/` (cliente sin token, queries con `defineQuery`,
  tipos generados, lecturas `'use cache'` con `cacheTag(<_type>)`) y
  `POST /api/revalidate` (firma con `next-sanity/webhook`; 401 / 400 / 200;
  `revalidateTag(tipo, 'max')`, el perfil es el 2.º argumento posicional según la
  doc de Next 16.3). `next.config.ts` carga el `.env.local` de la raíz con
  `loadEnvConfig(..., forceReload)`. Falta crear el webhook en Sanity: necesita URL
  pública (pasos en `INFRA.md`).
- **T4 migración:** 197 publicaciones en Sanity, verificadas por categoría, década,
  enlaces y registro a registro (script idempotente, commit `sync`). 14 documentos de
  página cargados desde el WordPress. Flujo: `extract:wp` → `build:content` →
  revisar `data/contenido/*.json` → `load:pages`. `docenciaPage` se amplió con
  `doctoratesChile`, `engineers` y `genealogy`. **Todo lo que dice el WordPress es la
  fuente válida de contenido.**

### Decisiones

- Repo: `github.com/hyperagencia/carlosconcaweb` (Hyper). Trabajo en
  `~/dev/carlosconca`, **fuera de iCloud**. Varios commits locales, **sin push**
  (no pushear sin que el usuario lo pida).
- Sanity: cuenta de Carlos, proyecto `ntv5ihqf`, dataset `production` (lectura
  pública; las lecturas del sitio no usan token). El token de escritura vence el
  2027-01-03 y quedó expuesto en una conversación: rotarlo al terminar de desarrollar.
- Vercel: plan gratuito, **sin conectar** hasta tener acceso. Solo local.
- **Sin formulario de contacto ni Resend por ahora**: `/contacto` es informativa.
- Figma (`loI5LpwjO7N6uRGsD73gbl`, "Carlos Conca Wireframes"): es un wireframe con
  datos de muestra (47+ años, 218 publicaciones, 119 ISI, 16 doctores) que
  **contradicen al WordPress**; no usar esas cifras. Sirve para estructura y capturas
  de "Home/Publicaciones/Investigación/Docencia/Biografía Wordpress". El usuario
  explica los componentes uno a uno; mobile es más simple y se piensa aparte.
- Datos: `data/publicaciones.json` = 197 (120 wos, 43 actas, 16 indexado, 10 nacional,
  6 otras, 2 libro; 73 con DOI; `pdf` siempre null).
- Redirects por cubrir (Fase 5): `/sample-page/`, `/work/`, posts, portfolio,
  taxonomías. `/en/inicio-english/` ya está resuelto.
- `docs/sanity-schema-conca.draft.ts` es el borrador histórico; la fuente de verdad
  del schema es `studio/schemaTypes/`.

### Pendientes de contenido

- **Publicación 198:** el WordPress muestra "Publicaciones (198)"; el JSON tiene 197.
  El usuario la verificará y la agregará desde el Studio como prueba de que el flujo
  de edición funciona (y de que el webhook revalida, cuando exista).
- Revisar el contenido de cada área de investigación (acordeón; el primer párrafo
  del WP quedó como `summary`) y traducir las bajadas del timeline EN (el WP las
  tiene en español).
- Home: solo se cargaron las cifras `1973` y `+40`. Las otras 2 tarjetas
  ("Publicaciones Científicas", "Publicaciones Matemáticas y Física-Matemática") tienen
  contador dinámico no legible en el WP: definir qué número muestran (¿calculado
  desde Sanity?).
- No existen en el WP: correo y dirección de contacto, ORCID, retrato (el del hero es
  un fondo del tema), texto introductorio de Publicaciones. Se completan en el Studio.
- Afiliación: WP dice "UMR CNRS-UChile"; el wireframe dice "UMI 2807". Se cargó la del WP.
- Imágenes de las 6 áreas (`assets/fotos/areas-investigacion/`): el schema no tiene
  campo de imagen por área; decidir si se agrega `researchArea.image` o se sirven desde
  `public/`.

### Pendiente del usuario

Export de GSC/GA4 (línea base), Fase 0 sin hacer (`curl` de trailing slash en
producción, PageSpeed/CrUX de las 12 URLs), acceso a Vercel/DNS de Carlos, primer
push del repo, diseño mobile en Figma (Fase 1, solo bloquea la Fase 4), y los assets
que falten (`assets/README.md` lista lo que no está).

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

- **Invalidación**: `revalidateTag(tag, 'max')` (el perfil es el 2.º argumento posicional, según la doc de Next 16.3). Sin el perfil
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
