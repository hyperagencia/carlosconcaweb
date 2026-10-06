import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function Page({ params }: PageProps<'/[locale]/investigacion'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Nav')

  return (
    <main>
      <h1>{t('research')}</h1>
    </main>
  )
}
