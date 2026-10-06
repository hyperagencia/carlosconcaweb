import { spawn, type ChildProcess } from 'node:child_process'

const PORT = 3101
let server: ChildProcess | undefined

async function waitFor(url: string, ms = 30_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      await fetch(url, { redirect: 'manual' })
      return
    } catch {
      await new Promise((r) => setTimeout(r, 300))
    }
  }
  throw new Error(`El servidor no respondió en ${url}. ¿Corriste "pnpm build"?`)
}

// Si hay ROUTES_BASE_URL se prueba contra ese servidor; si no, se levanta `next start`
export async function setup() {
  if (process.env.ROUTES_BASE_URL) return
  process.env.ROUTES_BASE_URL = `http://localhost:${PORT}`
  server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PORT)], {
    stdio: 'ignore',
  })
  await waitFor(process.env.ROUTES_BASE_URL)
}

export async function teardown() {
  server?.kill()
}
