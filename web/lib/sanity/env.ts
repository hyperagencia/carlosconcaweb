function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`)
  return value
}

export const projectId = () => required('SANITY_PROJECT_ID')
export const dataset = () => process.env.SANITY_DATASET ?? 'production'
export const revalidateSecret = () => required('SANITY_REVALIDATE_SECRET')
