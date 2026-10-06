import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Todo menos api, _next, _vercel y archivos con extensión
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
