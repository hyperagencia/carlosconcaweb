import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { documentInternationalization } from '@sanity/document-internationalization'
import { LOCALIZED_TYPES, schemaTypes } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'conca',
  title: 'Carlos Conca',
  projectId: 'ntv5ihqf',
  dataset: 'production',
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    documentInternationalization({
      supportedLanguages: [
        { id: 'es', title: 'Español' },
        { id: 'en', title: 'English' },
      ],
      schemaTypes: [...LOCALIZED_TYPES],
    }),
  ],
})
