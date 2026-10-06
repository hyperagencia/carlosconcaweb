import { defineField } from 'sanity'

export const LOCALES = ['es', 'en'] as const

/** Campo oculto que inyecta @sanity/document-internationalization. */
export const languageField = defineField({
  name: 'language',
  type: 'string',
  readOnly: true,
  hidden: true,
})

/** Preview compartido por todos los singletons localizados. */
export const localizedPreview = (title: string) => ({
  select: { language: 'language' },
  prepare({ language }: { language?: string }) {
    return { title, subtitle: (language ?? '??').toUpperCase() }
  },
})
