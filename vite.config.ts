import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    includeAssets: ['icons/apple-touch-icon.png'],
    manifest: {
      name: 'Cue', short_name: 'Cue', description: 'Your streaming plans, together.',
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
      // Cache the shell only; do not cache authenticated TMDB API responses.
    },
    devOptions: { enabled: false },
  })],
});
