import { defineConfig } from 'nitro'

export default defineConfig({
  routeRules: {
    '/': { prerender: true },
  },
})
