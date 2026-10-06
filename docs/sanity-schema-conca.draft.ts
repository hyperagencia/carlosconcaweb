/**
 * MODELO DE CONTENIDO — carlosconca.cl
 * Sanity Studio standalone · plan Free · dataset `production`
 *
 * Decisiones de fondo:
 *  1. `publication` NO se localiza. Los títulos, revistas y nombres de autores
 *     están en inglés en el original y no se traducen. Lo único traducible es
 *     la etiqueta de categoría, que vive en los mensajes de next-intl, no aquí.
 *     Esto elimina ~200 documentos duplicados y mantiene el conteo en ~215.
 *  2. Las páginas usan localización a NIVEL DOCUMENTO (@sanity/document-internationalization)
 *     con IDs fijos por locale (`biografiaPage-es`, `biografiaPage-en`). Son
 *     contenido de presentación, se publican de forma independiente, y el
 *     profesor ve "Biografía (ES)" / "Biografía (EN)" en la barra lateral.
 *  3. Tipos concretos por página en vez de un page builder genérico. Para un
 *     sitio de 6 páginas fijas con un editor no técnico, cada campo con su
 *     etiqueta real vale más que la flexibilidad.
 *  4. Las áreas de investigación son un array dentro de `investigacionPage`,
 *     no documentos aparte: se usan en un solo lugar y así heredan la
 *     localización sin un segundo sistema de i18n.
 *
 * Para dividir en archivos: cada sección marcada con `// ===` es un archivo
 * en `studio/schemaTypes/`.
 */

import { defineType, defineField, defineArrayMember } from 'sanity'

const LOCALES = ['es', 'en'] as const

/* === objects/seo.ts ===================================================== */

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Título para buscadores',
      type: 'string',
      description:
        'Aparece en la pestaña del navegador y en Google. Ideal: 50-60 caracteres.',
      validation: (Rule) => Rule.max(70).warning('Google suele cortar sobre 60 caracteres.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Descripción para buscadores',
      type: 'text',
      rows: 3,
      description:
        'El resumen que aparece bajo el título en Google. Ideal: 140-160 caracteres.',
      validation: (Rule) =>
        Rule.max(180).warning('Google suele cortar sobre 160 caracteres.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Imagen para redes sociales',
      type: 'image',
      description: 'Se muestra al compartir el enlace. Recomendado: 1200 × 630 px.',
    }),
  ],
})

/* === objects/link.ts ==================================================== */

export const linkType = defineType({
  name: 'link',
  title: 'Enlace',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Texto',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) =>
        Rule.required().uri({ scheme: ['http', 'https', 'mailto'] }),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'url' } },
})

/* === documents/publication.ts =========================================== */

/**
 * Valores tomados literalmente del JSON actual (`categoria`). No se renombran:
 * cualquier cambio rompería la equivalencia 1:1 con el sitio en producción y
 * obligaría a re-etiquetar 197 registros a mano.
 *
 * `categoria_label` del JSON NO se migra: la etiqueta visible se resuelve en
 * los mensajes de next-intl, que es lo que permite tenerla en ES y EN sin
 * duplicar documentos.
 */
export const PUBLICATION_CATEGORIES = [
  { title: 'WOS-ISI', value: 'articulo-wos' },
  { title: 'Actas / Capítulos', value: 'actas-capitulos' },
  { title: 'Indexado', value: 'articulo-indexado' },
  { title: 'Revista Nacional', value: 'revista-nacional' },
  { title: 'Otras', value: 'otras' },
  { title: 'Libro', value: 'libro' },
] as const

export const publicationType = defineType({
  name: 'publication',
  title: 'Publicación',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Año',
      type: 'number',
      validation: (Rule) =>
        Rule.required().integer().min(1975).max(new Date().getFullYear() + 2),
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: { list: [...PUBLICATION_CATEGORIES], layout: 'dropdown' },
      initialValue: 'articulo-wos',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'citation',
      title: 'Referencia',
      type: 'text',
      rows: 2,
      description:
        'Revista, volumen y páginas tal como se cita. Ej: "J. Math. Anal. Appl. 544, pp. 1–27"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'collaborators',
      title: 'Colaboradores',
      type: 'string',
      description:
        'Coautores, sin incluir a Carlos Conca. Ej: "V. Ocqueteau, R. Gormaz & J. San Martín". ' +
        'El prefijo "con" lo agrega el sitio automáticamente en cada idioma.',
    }),
    /**
     * Un solo campo, no dos. En el JSON actual el campo `doi` ya contiene la
     * URL completa (https://doi.org/…), que es también el destino del botón
     * "Ver artículo". Mantener `doi` y `link` por separado obligaría al
     * profesor a escribir lo mismo dos veces; el identificador desnudo para
     * los datos estructurados se deriva de la URL en el build.
     */
    defineField({
      name: 'link',
      title: 'Enlace al artículo',
      type: 'url',
      description:
        'Pega la URL del DOI (https://doi.org/…) o el enlace directo al artículo. ' +
        'Si se deja vacío, la tarjeta muestra "Sin enlace disponible".',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'featured',
      title: 'Publicación destacada',
      type: 'boolean',
      description:
        'Márcala para que aparezca entre las publicaciones clave de un área de investigación.',
      initialValue: false,
    }),
    // Campo puente para la migración desde el JSON actual. Permite re-ejecutar
    // el script de importación sin duplicar registros. No usar IDs derivados
    // del sistema legado como _id.
    defineField({
      name: 'legacyId',
      title: 'ID de origen',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: 'Año (más reciente primero)',
      name: 'yearDesc',
      by: [
        { field: 'year', direction: 'desc' },
        { field: 'title', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title', year: 'year', category: 'category' },
    prepare({ title, year, category }) {
      const label =
        PUBLICATION_CATEGORIES.find((c) => c.value === category)?.title ?? '—'
      return { title, subtitle: `${year} · ${label}` }
    },
  },
})

/* === documents/pages ==================================================== */

/** Campo oculto que inyecta @sanity/document-internationalization. */
const languageField = defineField({
  name: 'language',
  type: 'string',
  readOnly: true,
  hidden: true,
})

/** Preview compartido por todos los singletons localizados. */
const localizedPreview = (title: string) => ({
  select: { language: 'language' },
  prepare({ language }: { language?: string }) {
    return { title, subtitle: (language ?? '??').toUpperCase() }
  },
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Inicio',
  type: 'document',
  fields: [
    languageField,
    defineField({ name: 'displayName', title: 'Nombre', type: 'string' }),
    defineField({
      name: 'affiliation',
      title: 'Afiliación',
      type: 'text',
      rows: 3,
      description: 'Ej: "Departamento de Ingeniería Matemática y Centro de Modelamiento Matemático…"',
    }),
    defineField({ name: 'portrait', title: 'Retrato', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'stats',
      title: 'Cifras de carrera',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Cifra', type: 'string' }),
            defineField({ name: 'label', title: 'Descripción', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: 'timeline',
      title: 'Timeline destacado',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'decade', title: 'Década', type: 'string' }),
            defineField({ name: 'caption', title: 'Bajada', type: 'string' }),
            defineField({ name: 'body', title: 'Texto', type: 'array', of: [{ type: 'block' }] }),
          ],
          preview: { select: { title: 'decade', subtitle: 'caption' } },
        }),
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Inicio'),
})

export const biografiaPage = defineType({
  name: 'biografiaPage',
  title: 'Biografía',
  type: 'document',
  fields: [
    languageField,
    defineField({ name: 'heading', title: 'Título de página', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Introducción narrativa',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'awards',
      title: 'Reconocimientos y premios',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Distinción', type: 'string' }),
            defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
            defineField({ name: 'year', title: 'Año', type: 'string' }),
          ],
          preview: { select: { title: 'name', subtitle: 'year' } },
        }),
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Biografía'),
})

export const investigacionPage = defineType({
  name: 'investigacionPage',
  title: 'Investigación',
  type: 'document',
  fields: [
    languageField,
    defineField({ name: 'heading', title: 'Título de página', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Introducción',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'areas',
      title: 'Áreas de investigación',
      description:
        'Cada área genera una sección del acordeón con su propio enlace directo (#slug).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'researchArea',
          fields: [
            defineField({
              name: 'title',
              title: 'Nombre del área',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'slug',
              title: 'Ancla',
              type: 'slug',
              description: 'Genera el enlace directo. Ej: /investigacion#homogeneizacion',
              options: { source: 'title', maxLength: 60 },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'summary',
              title: 'Definición breve',
              type: 'text',
              rows: 3,
              description:
                'Una o dos frases autocontenidas que respondan "¿qué es esto?" sin contexto previo. ' +
                'Es el fragmento que citan los buscadores y asistentes de IA.',
              validation: (Rule) => Rule.required().max(320),
            }),
            defineField({
              name: 'body',
              title: 'Desarrollo',
              type: 'array',
              of: [{ type: 'block' }],
            }),
            defineField({
              name: 'applications',
              title: 'Aplicaciones',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            }),
            defineField({
              name: 'keyPublications',
              title: 'Publicaciones clave',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'reference',
                  to: [{ type: 'publication' }],
                  options: { filter: 'featured == true' },
                }),
              ],
              validation: (Rule) => Rule.unique(),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'summary' } },
        }),
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Investigación'),
})

export const docenciaPage = defineType({
  name: 'docenciaPage',
  title: 'Docencia',
  type: 'document',
  fields: [
    languageField,
    defineField({ name: 'heading', title: 'Título de página', type: 'string' }),
    defineField({ name: 'eyebrow', title: 'Antetítulo', type: 'string' }),
    defineField({ name: 'intro', title: 'Introducción', type: 'array', of: [{ type: 'block' }] }),
    defineField({
      name: 'doctorates',
      title: 'Doctorados con posición académica internacional',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Nombre', type: 'string' }),
            defineField({ name: 'year', title: 'Año', type: 'string' }),
            defineField({ name: 'position', title: 'Posición actual', type: 'string' }),
            defineField({ name: 'country', title: 'País', type: 'string' }),
          ],
          preview: { select: { title: 'name', subtitle: 'position' } },
        }),
      ],
    }),
    defineField({
      name: 'postdocs',
      title: 'Post-doctorados supervisados',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'programs',
      title: 'Programas co-fundados',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Programa', type: 'string' }),
            defineField({ name: 'period', title: 'Período', type: 'string' }),
            defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'name', subtitle: 'period' } },
        }),
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Docencia'),
})

export const publicacionesPage = defineType({
  name: 'publicacionesPage',
  title: 'Publicaciones',
  type: 'document',
  description:
    'Solo textos y SEO de la página. Las publicaciones se administran en su propia sección.',
  fields: [
    languageField,
    defineField({ name: 'heading', title: 'Título de página', type: 'string' }),
    defineField({ name: 'intro', title: 'Introducción', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Publicaciones'),
})

export const contactoPage = defineType({
  name: 'contactoPage',
  title: 'Contacto',
  type: 'document',
  fields: [
    languageField,
    defineField({ name: 'heading', title: 'Título de página', type: 'string' }),
    defineField({ name: 'intro', title: 'Introducción', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'email', title: 'Correo de contacto', type: 'string' }),
    defineField({ name: 'address', title: 'Dirección', type: 'text', rows: 3 }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: localizedPreview('Contacto'),
})

/* === documents/siteSettings.ts ========================================== */

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configuración del sitio',
  type: 'document',
  fields: [
    languageField,
    defineField({
      name: 'footerLinks',
      title: 'Footer — columna LINKS',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
    }),
    defineField({
      name: 'footerInfo',
      title: 'Footer — columna INFO',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
    }),
    defineField({
      name: 'cv',
      title: 'CV descargable',
      type: 'file',
      options: { accept: '.pdf' },
    }),
    defineField({
      name: 'sameAs',
      title: 'Perfiles externos (datos estructurados)',
      description:
        'Wikipedia, Google Scholar, ORCID, Academia, página del DIM. Alimentan el JSON-LD ' +
        'que permite a Google y a los asistentes de IA identificar al profesor como una entidad única. ' +
        'Solo URLs, una por línea.',
      type: 'array',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'defaultSeo',
      title: 'SEO por defecto',
      type: 'seo',
    }),
  ],
  preview: localizedPreview('Configuración del sitio'),
})

/* === schemaTypes/index.ts =============================================== */

export const schemaTypes = [
  // objects
  seoType,
  linkType,
  // documents
  publicationType,
  homePage,
  biografiaPage,
  investigacionPage,
  docenciaPage,
  publicacionesPage,
  contactoPage,
  siteSettings,
]

/** Tipos que reciben localización a nivel documento. */
export const LOCALIZED_TYPES = [
  'homePage',
  'biografiaPage',
  'investigacionPage',
  'docenciaPage',
  'publicacionesPage',
  'contactoPage',
  'siteSettings',
] as const

export { LOCALES }

/* ========================================================================
 * sanity.config.ts — fragmentos de configuración
 * ========================================================================
 *
 * import { documentInternationalization } from '@sanity/document-internationalization'
 *
 * export default defineConfig({
 *   name: 'conca',
 *   projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
 *   dataset: 'production',
 *   schema: { types: schemaTypes },
 *   plugins: [
 *     structureTool({ structure }),
 *     documentInternationalization({
 *       supportedLanguages: [
 *         { id: 'es', title: 'Español' },
 *         { id: 'en', title: 'English' },
 *       ],
 *       schemaTypes: [...LOCALIZED_TYPES],
 *     }),
 *   ],
 * })
 *
 * ------------------------------------------------------------------------
 * structure.ts — singletons con ID fijo por locale
 * ------------------------------------------------------------------------
 *
 * const localizedSingleton = (S, type, title) =>
 *   S.listItem().title(title).child(
 *     S.list().title(title).items(
 *       LOCALES.map((locale) =>
 *         S.listItem()
 *           .title(`${title} (${locale.toUpperCase()})`)
 *           .child(
 *             S.document()
 *               .schemaType(type)
 *               .documentId(`${type}-${locale}`)   // ← ID fijo: solo para singletons
 *               .title(`${title} (${locale.toUpperCase()})`)
 *           )
 *       )
 *     )
 *   )
 *
 * export const structure = (S) =>
 *   S.list().title('Contenido').items([
 *     // Lo que el profesor edita a diario, primero y sin submenús:
 *     S.documentTypeListItem('publication').title('Publicaciones'),
 *     S.divider(),
 *     localizedSingleton(S, 'homePage', 'Inicio'),
 *     localizedSingleton(S, 'publicacionesPage', 'Publicaciones — textos'),
 *     localizedSingleton(S, 'investigacionPage', 'Investigación'),
 *     localizedSingleton(S, 'docenciaPage', 'Docencia'),
 *     localizedSingleton(S, 'biografiaPage', 'Biografía'),
 *     localizedSingleton(S, 'contactoPage', 'Contacto'),
 *     S.divider(),
 *     localizedSingleton(S, 'siteSettings', 'Configuración del sitio'),
 *   ])
 */
