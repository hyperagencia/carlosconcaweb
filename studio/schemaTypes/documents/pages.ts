import { defineType, defineField, defineArrayMember } from 'sanity'
import { languageField, localizedPreview } from '../shared'

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

