// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: {
    port: 3001,
    host: 'localhost',
  },
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  css: [
    '@/assets/css/tailwind.css',
  ],
  plugins: [
    '~/plugins/firebase.ts',
    '~/plugins/lucide.ts'],
  typescript: {
    strict: true
  },
  pages: true,
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseDatabaseURL: process.env.FIREBASE_DATABASE_URL,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
    }
  },
  app: {
    head: {
      title: 'Ajaxtreon Store',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Ajaxtreon Store – shop efficiently for your business needs.' },
        { name: 'keywords', content: 'ajaxtreon, online store, inventory, e-commerce, business, products' },
        { name: 'author', content: 'Ajax' },
        { name: 'theme-color', content: '#0f172a' },
        // { property: 'og:title', content: 'Ajaxtreon Store' },
        // { property: 'og:description', content: 'Find and order what you need at Ajaxtreon Store.' },
        // { property: 'og:type', content: 'website' },
        // { property: 'og:url', content: 'https://store.ajaxtreon.com' },
        // { property: 'og:image', content: '/og-image.png' }
      ],
      // link: [
      //   { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      //   { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      //   { rel: 'manifest', href: '/site.webmanifest' }
      // ]
    }
  }
})
