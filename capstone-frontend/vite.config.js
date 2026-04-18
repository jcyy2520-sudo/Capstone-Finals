import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'favicon.ico', 'logo192.png', 'logo512.png'],

      manifest: {
        name: 'My React App',
        short_name: 'ReactApp',
        description: 'My Awesome React Application',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#333333',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
          {
            src: 'logo192.png',
            type: 'image/png',
            sizes: '192x192',
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512',
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable', // adds maskable icon support
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              ['document', 'script', 'style', 'image', 'font'].includes(request.destination),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'offline-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400, // 1 day
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
})
