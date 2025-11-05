import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    nitro({
      config: {
        vercel: {
          functions: {
            runtime: 'bun1.x',
          },
        },
        routeRules: {
          '/': { isr: true },
          '/**': { isr: 60 },
        },
      },
    }),
  ],
})
