import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["ascend-icon.svg"],
      manifest: {
        id: "./",
        name: "ASCEND",
        short_name: "ASCEND",
        description: "A progression system built around whatever you are actually working on.",
        lang: "en",
        dir: "ltr",
        theme_color: "#060a14",
        background_color: "#060a14",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "ascend-icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "ascend-icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/speeches\/.*\.(mp4|webm|m4v|mov|mp3|m4a|aac|ogg|wav|jpg|jpeg|png|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "speeches",
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] },
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
