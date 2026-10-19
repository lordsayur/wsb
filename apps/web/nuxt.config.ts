export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n", "@vite-pwa/nuxt"],
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/theme.css"],
  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      // specs/web/spec.md — the app fits the viewport, so browser zoom is off.
      meta: [
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        },
      ],
    },
  },
  // specs/web/spec.md — offline-first PWA; prompt reload when a new build waits.
  pwa: {
    registerType: "prompt",
    manifest: {
      name: "Waktu Sembahyang Brunei",
      short_name: "Waktu Sembahyang",
      description: "Waktu sembahyang Brunei, di mana-mana sahaja.",
      lang: "ms",
      theme_color: "#facc15",
      background_color: "#0b0d0e",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      navigateFallback: "/",
    },
    client: {
      installPrompt: false,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
    },
  },
  // Public dev previews through routeup (see VISION.md).
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
  },
  vite: {
    server: {
      allowedHosts: [".try.routeup.dev", ".localhost"],
    },
  },
  i18n: {
    defaultLocale: "ms",
    strategy: "no_prefix",
    detectBrowserLanguage: false,
    locales: [
      { code: "ms", name: "Bahasa Melayu", language: "ms-BN", file: "ms.json", dir: "ltr" },
      { code: "ms-Arab", name: "بهاس ملايو (Jawi)", language: "ms-Arab", file: "ms-Arab.json", dir: "rtl" },
      { code: "ar", name: "العربية", language: "ar", file: "ar.json", dir: "rtl" },
      { code: "en", name: "English", language: "en", file: "en.json", dir: "ltr" },
    ],
    langDir: "locales",
  },
});
