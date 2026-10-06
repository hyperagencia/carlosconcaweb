# ROADMAP

Dos ejes: el **roadmap de proyecto** (fases, dependencias, qué bloquea a qué) y
el **roadmap técnico** (orden de construcción). Se leen juntos: la fase de
proyecto define cuándo, el roadmap técnico define en qué orden.

---

## Estado de bloqueos

| Necesita | Estado | Bloquea |
|---|---|---|
| Cuenta Sanity de Carlos | pendiente | solo el cutover, no el desarrollo |
| Cuenta Vercel de Carlos | pendiente | solo producción |
| Diseño mobile en Figma | pendiente | Fase 4 |
| Acceso DNS de carlosconca.cl | pendiente | Fase 6 |
| Contenido EN | aprobado | — |

**Nada de esto bloquea el arranque.** El desarrollo corre contra un proyecto
Sanity `carlosconca-dev` creado en la cuenta de Hyper. Cuando llegue la cuenta
de Carlos se crea el proyecto definitivo en su organización y se re-ejecuta
`pnpm migrate` apuntado allá: el script es idempotente y sirve de ensayo del
cutover real.

---

# Roadmap de proyecto

## Fase 0 · Discovery técnico y línea base

Va antes que todo. La línea base no se puede reconstruir después: si no se
captura ahora, el caso de estudio pierde su mitad más valiosa.

- [ ] Verificar `trailingSlash` en producción: `curl -sI https://carlosconca.cl/publicaciones`
- [ ] Confirmar comportamiento de `/en` (¿redirige a `/en/`?)
- [ ] Capturar línea base: PageSpeed / CrUX de las 12 URLs, mobile y desktop
- [ ] Exportar Search Console: consultas, CTR e impresiones de los últimos 6 meses
- [ ] Confirmar propiedad de GSC y ID de medición de GA4
- [ ] Confirmar si Carlos tiene ORCID; si no, registrarlo
- [ ] Crear proyecto Sanity `carlosconca-dev` en la cuenta de Hyper
- [ ] Crear repo privado en el org de Hyper e inicializar el monorepo
- [ ] Escribir `INFRA.md`: quién es dueño de qué, env vars, procedimiento de
      migración de hosting

**Cierra cuando:** existe un documento con los números de partida y el repo
levanta en local con `pnpm dev`.

## Fase 1 · Diseño mobile (Figma)

Corre en paralelo a las fases 2 y 3. No bloquea el desarrollo desktop.

- [ ] Navegación y jerarquía específicas de mobile
- [ ] Componente de Publicaciones: tarjeta condensada, filtros en panel
      deslizable, patrón de "cargar más"
- [ ] Las 6 páginas
- [ ] Tokens de diseño exportables (color, tipografía, espaciado, breakpoints)
- [ ] Reunión de revisión con el cliente

**Cierra cuando:** el cliente aprueba. Cualquier cambio posterior se evalúa por
impacto en tiempo y costo, según la cotización.

## Fase 2 · Fundaciones

- [ ] Monorepo, Next 16, Tailwind v4, Studio standalone
- [ ] Schema de Sanity desplegado
- [ ] Migración de las 197 publicaciones con verificación de integridad
- [ ] Enrutamiento localizado con las 12 URLs exactas
- [ ] Capa de datos con `'use cache'` + `cacheTag` y webhook de revalidación

**Cierra cuando:** las 12 rutas responden, `pnpm migrate` reporta 197/197 y una
edición en el Studio se refleja en el sitio local.

## Fase 3 · Desktop

Recodificación del sistema de diseño ya aprobado. Es traducción, no diseño.

- [ ] Sistema de diseño y primitivas
- [ ] Layout, nav flotante, footer
- [ ] Las 6 páginas
- [ ] Componente de Publicaciones (búsqueda, filtros, cargar más)

**Cierra cuando:** paridad visual con producción y el buscador funciona sobre
los 197 registros.

## Fase 4 · Mobile

- [ ] Nav y panel de filtros mobile
- [ ] Adaptación de las 6 páginas al diseño aprobado
- [ ] Componente de Publicaciones en su versión mobile
- [ ] Presupuesto de rendimiento verificado en dispositivo real, no solo en
      DevTools con throttling

**Cierra cuando:** LCP bajo 1.2 s e INP bajo 100 ms en un móvil de gama media
con red 4G.

## Fase 5 · SEO, AEO y GEO

- [ ] Metadata, canonical, hreflang en las 12 rutas
- [ ] JSON-LD: `Person`, `ItemList` de `ScholarlyArticle`
- [ ] `sitemap.ts`, `robots.ts`, `llms.txt`, `llms-full.txt`
- [ ] Anclas por área de investigación
- [ ] Plan de redirects 301 probado contra staging, URL por URL
- [ ] Continuidad de GA4

**Cierra cuando:** las 12 URLs resuelven sin salto de redirect y el mapa de
redirects pasa al 100%.

## Fase 6 · Cutover

- [ ] Proyecto Sanity definitivo en la cuenta de Carlos + `pnpm migrate`
- [ ] Proyecto Vercel en la cuenta de Carlos, importando el repo de Hyper
- [ ] Revisión en staging con el cliente
- [ ] Bajar TTL de DNS 24 h antes
- [ ] Cambio de DNS. **WordPress se deja intacto hasta 30 días después**
- [ ] Resubmit del sitemap, verificación de GSC
- [ ] Manual de Sanity Studio y capacitación
- [ ] Marcha blanca

**Cierra cuando:** producción sirve el sitio nuevo, GSC no reporta errores de
cobertura y el profesor publicó una publicación por su cuenta sin ayuda.

## Fase 7 · Medición

Dos semanas después. Es el entregable del caso de estudio.

- [ ] Comparar Core Web Vitals de campo contra la línea base
- [ ] Verificar continuidad de tráfico orgánico
- [ ] Documentar resultados

---

# Roadmap técnico

Orden de construcción. Cada bloque asume el anterior terminado.

## T1 · Andamiaje

```
carlosconca/
├─ CLAUDE.md · ROADMAP.md · INFRA.md
├─ pnpm-workspace.yaml
├─ data/publicaciones.json
├─ scripts/migrate-publications.ts
├─ web/      Next 16 · TS estricto · Tailwind v4 · next-intl
└─ studio/   Sanity standalone
```

`next.config.ts` mínimo:

```ts
{
  cacheComponents: true,
  trailingSlash: <según Fase 0>,
  images: { loader: 'custom', loaderFile: './lib/cloudinary-loader.ts' },
}
```

CI en GitHub Actions desde el primer commit: `typecheck`, `lint`, `build`.
Barato ahora, caro de agregar después.

## T2 · Enrutamiento localizado

El bloque de mayor riesgo del proyecto: un error acá cuesta posicionamiento.

```ts
// lib/i18n/routing.ts
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  pathnames: {
    '/':               { es: '/',              en: '/' },
    '/publicaciones':  { es: '/publicaciones', en: '/publications' },
    '/investigacion':  { es: '/investigacion', en: '/research' },
    '/docencia':       { es: '/docencia',      en: '/teaching' },
    '/biografia':      { es: '/biografia',     en: '/biography' },
    '/contacto':       { es: '/contacto',      en: '/contact' },
  },
})
```

**Test de regresión de rutas antes de escribir una sola página.** Un test que
recorra las 12 URLs y exija 200 sin redirect intermedio. Ese test es el
contrato con el SEO existente y debe correr en CI de aquí en adelante.

## T3 · Capa de datos

- Cliente Sanity (`useCdn: false` en build y en webhooks)
- Queries GROQ con `defineQuery` + `pnpm typegen`
- Envoltorio `'use cache'` / `cacheLife('max')` / `cacheTag`
- Route handler `/api/revalidate` validando firma con `parseBody` de
  `next-sanity/webhook` y llamando `revalidateTag(tag, { profile: 'max' })`
- Webhook configurado en Sanity con filtro por `_type`

## T4 · Schema y migración

- Desplegar el schema al Studio
- `pnpm migrate -- --dry-run`, luego `pnpm migrate`
- Verificar 197/197 por categoría, década y cobertura de enlaces
- Cargar el contenido de las 6 páginas × 2 idiomas

## T5 · Sistema de diseño

- Tokens desde Figma a `@theme` de Tailwind
- Tipografía self-hosted con `next/font/local`, subset latin, `display: swap`,
  preload únicamente del peso que participa del LCP
- Primitivas: tipografía, botón, tarjeta, contenedor, acordeón

## T6 · Componente de Publicaciones

El componente crítico. Orden importa:

1. Server Component que renderiza las 197 tarjetas en HTML
2. `content-visibility: auto` con `contain-intrinsic-size` sobre las tarjetas
   bajo el pliegue — sin el `contain-intrinsic-size` la barra de scroll salta
3. Utilidad de normalización de acentos + tests unitarios
4. Cliente de búsqueda y filtros con `useDeferredValue`
5. Sincronización de estado con la URL
6. Medir INP antes de seguir. Si supera 100 ms, se resuelve acá y no después

## T7 · Páginas

Inicio → Publicaciones → Investigación → Docencia → Biografía → Contacto.
Contacto con Server Action + Resend, sin base de datos.

## T8 · Mobile

Sobre el diseño aprobado en Fase 1. Un solo árbol de componentes: CSS y
container queries. Nav y panel de filtros son los únicos montados
condicionalmente.

## T9 · Capa de descubrimiento

`generateMetadata`, JSON-LD, sitemap, robots, `llms.txt`, `llms-full.txt`.
Los dos últimos se generan desde la misma data de Sanity en build.

## T10 · Endurecimiento

- Lighthouse CI en el pipeline con presupuestos que fallan el build
- Test de las 12 rutas + del mapa de redirects contra staging
- Verificación de integridad del catálogo
- `INFRA.md` al día

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `trailingSlash` distinto al de producción | Verificar en Fase 0, antes de escribir rutas |
| Vercel pausa el proyecto por uso comercial en plan Hobby | `INFRA.md` con procedimiento de migración documentado, para que salir sea una tarea de 30 min y no una emergencia |
| El diseño mobile cambia después de aprobado | Cláusula ya está en la cotización; aplicarla |
| El JSON tiene 124 publicaciones sin enlace | Aceptado en el alcance. El enriquecimiento vía Crossref es una propuesta aparte |
| Slugs traducidos mal implementados rompen URLs | Test de rutas en CI desde T2 |
| Regresión de rendimiento tardía | Medir INP en T6, no al final |
