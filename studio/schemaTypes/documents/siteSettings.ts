import { defineType, defineField, defineArrayMember } from 'sanity'
import { languageField, localizedPreview } from '../shared'

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

