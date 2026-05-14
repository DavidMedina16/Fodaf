// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],

  devServer: {
    host: '0.0.0.0',
    port: 4111,
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
    },
  },

  hooks: {
    listen(_server, listener) {
      const port = listener?.address?.port ?? 4111
      // eslint-disable-next-line no-console
      console.log(`  \x1B[36m➜\x1B[0m Hosts:    \x1B[36mhttp://fodaf.development:${port}/\x1B[0m`)
    },
  },
})
