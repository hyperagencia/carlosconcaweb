import { createClient } from '@sanity/client'
import { dataset, projectId } from './env'

// Lectura pública del dataset: sin token. Sin CDN para que la revalidación
// por webhook lea siempre datos frescos.
export const client = createClient({
  projectId: projectId(),
  dataset: dataset(),
  apiVersion: '2026-02-01',
  useCdn: false,
  perspective: 'published',
})
