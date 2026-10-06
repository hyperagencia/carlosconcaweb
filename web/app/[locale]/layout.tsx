import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Zalando_Sans } from 'next/font/google'
import { ThemeSync } from '@/components/theme-sync'
import { Navbar } from '@/components/navbar/navbar'
import { routing } from '@/lib/i18n/routing'

const zalando = Zalando_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-zalando',
  display: 'swap',
})


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })
  return { title: t('siteName'), description: t('description') }
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={locale} className={zalando.variable}>
      <body>
        <NextIntlClientProvider>
          <ThemeSync />
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
