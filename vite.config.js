import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [
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
