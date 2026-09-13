import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-180.png"],
      manifest: {
        name: "ASCEND",
        short_name: "ASCEND",
        description: "A progression system built around whatever you are actually working on.",
        theme_color: "#060a14",
        background_color: "#060a14",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        /* Deliberately no media extensions here. Precaching is what blocks
           the install, and one bundled speech would hold the whole app
           shell hostage to a 200MB download. They are cached on first play
           by the rule below instead. */
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            /* Speeches bundled in public/speeches. Cached the first time
               each one is played, so it works offline from then on.
               `rangeRequests` is not optional: a <video> asks for byte
               ranges to seek, and a cache that answers 200 to a request
               for 206 makes Safari refuse to play the file at all. */
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
