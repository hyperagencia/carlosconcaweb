import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    include: ['tests/routes.test.ts'],
    globalSetup: ['tests/start-server.ts'],
    testTimeout: 15_000,
  },
})
