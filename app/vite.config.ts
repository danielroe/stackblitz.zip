import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    nitro({
      config: {
        routeRules: {
          '/': { isr: true },
        },
      },
    }),
  ],
})
