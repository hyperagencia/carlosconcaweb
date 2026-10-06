# INFRA

Quién es dueño de qué, variables de entorno y cómo mover el hosting.
Se completa a medida que llegan las cuentas del cliente.

## Cuentas

| Servicio | Dueño actual | Dueño final | Estado |
|---|---|---|---|
| Repo GitHub (`hyperagencia/carlosconcaweb`) | Hyper | Hyper | local, sin push |
| Sanity (proyecto `ntv5ihqf`, dataset `production`) | Carlos | Carlos | creado |
| Vercel | — | Carlos | sin conectar |
| DNS carlosconca.cl | — | Carlos | pendiente |

## Variables de entorno

Ver `.env.example`. Los valores reales viven en `.env.local` (nunca al repo) y,
en producción, en el proyecto de Vercel.

| Variable | Uso |
|---|---|
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | cliente y script de migración |
| `SANITY_WRITE_TOKEN` | solo `pnpm migrate`; permisos de escritura |
| `SANITY_REVALIDATE_SECRET` | firma del webhook que invalida caché (T3) |

## Webhook de revalidación (pendiente: necesita URL pública)

Cuando exista el sitio desplegado, en sanity.io/manage → API → Webhooks:

- URL: `https://<dominio>/api/revalidate/`, método POST
- Secret: el valor de `SANITY_REVALIDATE_SECRET` (en Vercel y en `.env.local`)
- Dataset: `production`; disparar en create, update y delete
- Filtro: `_type in ["publication","homePage","biografiaPage","investigacionPage","docenciaPage","publicacionesPage","contactoPage","siteSettings"]`
- Proyección: `{_type}`

El endpoint devuelve 401 sin firma válida y 400 si el tipo no es uno de los anteriores.

## Migración de hosting

Pendiente: se documenta en la Fase 6 (cutover).
