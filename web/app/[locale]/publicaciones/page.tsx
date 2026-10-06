import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function Page({ params }: PageProps<'/[locale]/publicaciones'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Nav')

  return (
    <main>
      <h1>{t('publications')}</h1>
    </main>
  )
}
