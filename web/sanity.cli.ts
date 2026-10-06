import { defineCliConfig } from 'sanity/cli'

// Solo para `sanity typegen`: el schema lo extrae studio/ (pnpm typegen en la raíz)
export default defineCliConfig({
  api: { projectId: 'ntv5ihqf', dataset: 'production' },
  typegen: {
    path: './lib/**/*.ts',
    schema: '../studio/schema.json',
    generates: './lib/sanity/types.ts',
  },
})
