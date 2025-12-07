import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt", // 🔥 obriga update imediato
        injectRegister: "auto",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg"
        ],
        manifest: {
          name: "Snap Immobile",
          short_name: "SnapImmobile",
          description: "Gestão de fotografia imobiliária com IA",
          theme_color: "#ffffff",
          background_color: "#000000",
          display: "standalone",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json,mp3,wav}"],
          cleanupOutdatedCaches: true
        }
      })
    ],

    server: { host: true },

    // 🔥 REMOVEMOS DEFINE (conflito com Vercel)
    define: {},

    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["lucide-react"],
            ai: ["@google/generative-ai"]
          }
        }
      }
    }
  };
});
