import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Hero } from '@/components/hero'
import type { Locale } from '@/lib/i18n/routing'
import { getHomePage } from '@/lib/sanity/fetch'

export default async function Page({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const [home, meta] = await Promise.all([
    getHomePage(locale as Locale),
    getTranslations('Meta'),
  ])

  return (
    <main>
      <Hero
        name={home?.displayName ?? meta('siteName')}
        affiliation={home?.affiliation ?? ''}
      />
    </main>
  )
}
