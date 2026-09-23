import { prepareOcrAssets } from './scripts/ocr-assets.mjs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [
    { name: 'local-ocr-assets', buildStart: prepareOcrAssets },
    VitePWA({
      manifest: false,
      injectRegister: 'script',
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['push-events.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['**/ocr/**'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/ocr/v6/'),
            handler: 'CacheFirst',
            options: { cacheName: 'nstock-ocr-v6', cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 8, purgeOnQuotaError: true } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'nstock-product-images',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
    react({
      include: /\.(jsx|js|tsx|ts)$/,
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }]
        ]
      }
    })
  ],
  base: '/',
  server: {
    port: 3000,
    host: 'localhost'
  }
});
