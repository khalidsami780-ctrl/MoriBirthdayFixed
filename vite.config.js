import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',          // We control when to activate the new SW
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Tell the waiting SW to activate when we send SKIP_WAITING
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Cache Cloudinary media (images / audio) — network first
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cloudinary-media',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'قصتنا 💙',
        short_name: 'موري',
        description: 'رسائل وذكريات مريم وخالد',
        theme_color: '#03091a',
        background_color: '#03091a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/heart.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
})
