import { defineConfig, loadEnv } from 'vite';
import { createTmdbProxy } from './server/proxy.ts';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), {
    name: 'viewenda-api',
    configureServer(server) { const proxy = createProxy(); server.middlewares.use((req, res, next) => req.url?.startsWith('/api/tmdb/') ? void proxy(req, res) : next()); },
    configurePreviewServer(server) { const proxy = createProxy(); server.middlewares.use((req, res, next) => req.url?.startsWith('/api/tmdb/') ? void proxy(req, res) : next()); },
  }, VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    includeAssets: ['icons/apple-touch-icon.png'],
    manifest: {
      name: 'Viewenda', short_name: 'Viewenda', description: 'Your entertainment, all lined up.',
      start_url: '/', scope: '/', display: 'standalone',
      theme_color: '#121018', background_color: '#121018',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      // Cache the shell only; do not cache authenticated TMDB API responses.
    },
    devOptions: { enabled: false },
  })],
});

function createProxy() {
  return createTmdbProxy(process.env.TMDB_BEARER_TOKEN ?? loadEnv('development', process.cwd(), 'TMDB_').TMDB_BEARER_TOKEN ?? '');
}
