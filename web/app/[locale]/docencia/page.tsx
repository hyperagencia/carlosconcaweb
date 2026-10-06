import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function Page({ params }: PageProps<'/[locale]/docencia'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Nav')

  return (
    <main>
      <h1>{t('teaching')}</h1>
    </main>
  )
}
