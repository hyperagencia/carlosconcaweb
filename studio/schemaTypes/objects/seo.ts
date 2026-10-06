import { defineType, defineField } from 'sanity'

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

