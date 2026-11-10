import templateCompilerOptions from "@tresjs/core/template-compiler-options";
import { ICONS } from "./app/utils/icons";

export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n", "@vite-pwa/nuxt", "@nuxt/icon"],
  compatibilityDate: "2024-11-01",
  // specs/web/spec.md — `<TresMesh>` and friends belong to the TresJS custom
  // renderer, not to Vue's component registry, so the compiler leaves them alone.
  vue: { compilerOptions: templateCompilerOptions.template.compilerOptions },
  // specs/web/spec.md — icons ship with the app so they render offline.
  icon: {
    mode: "svg",
    serverBundle: { collections: ["lucide"] },
    clientBundle: { icons: [...ICONS], scan: true },
  },
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
    // specs/feedback/spec.md — the feedback form files a GitHub issue from the
    // server, so the token never reaches the browser. A reader needs no GitHub
    // account. Without a token the route logs the message instead.
    feedbackGithubToken: process.env.FEEDBACK_GITHUB_TOKEN ?? "",
    // specs/feedback/spec.md — screenshot uploads go to the public `feedback`
    // bucket with the service role; never exposed to the browser.
    supabaseServiceKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NUXT_SUPABASE_SERVICE_KEY ??
      "",
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      // specs/analytics/spec.md — a build-time tag, never the hostname.
      analyticsEnv: process.env.NUXT_PUBLIC_ANALYTICS_ENV ?? "development",
      // Opt-in for a deliberate local ingestion test; off everywhere by default.
      analyticsEnabled: process.env.NUXT_PUBLIC_ANALYTICS_DEV === "1",
      // specs/feedback/spec.md — the repo the form files into, for the GitHub
      // fallback link. The token stays server-side.
      feedbackRepo: process.env.FEEDBACK_REPO ?? "lordsayur/wsb",
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
