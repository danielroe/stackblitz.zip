import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/zip.ts', 'src/cli/clone.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
})
