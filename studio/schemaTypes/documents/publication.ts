import { defineType, defineField } from 'sanity'

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

