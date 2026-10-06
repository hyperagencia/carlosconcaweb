import type { NextConfig } from 'next'
import { loadEnvConfig } from '@next/env'
import createNextIntlPlugin from 'next-intl/plugin'
import { resolve } from 'node:path'

// Un solo .env.local en la raíz del monorepo para web, studio y migración
// forceReload: Next ya cargó los .env de web/ y cachea ese resultado
loadEnvConfig(resolve(process.cwd(), '..'), process.env.NODE_ENV !== 'production', console, true)

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
