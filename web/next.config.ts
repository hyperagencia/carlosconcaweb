import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  cacheComponents: true,
  trailingSlash: true,
  async redirects() {
    return [
      // Home EN antigua, aún indexada. statusCode explícito: permanent emite 308.
      { source: '/en/inicio-english/', destination: '/en/', statusCode: 301 },
    ]
  },
}

export default withNextIntl(nextConfig)
