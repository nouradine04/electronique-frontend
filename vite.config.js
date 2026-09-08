import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [
    VitePWA({
      manifest: false,
      injectRegister: 'script',
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
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
  base: './',
  server: {
    port: 3000,
    host: '127.0.0.1'
  }
});
