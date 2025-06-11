import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteRuby from 'vite-plugin-ruby'

export default defineConfig({
  build: {
    experimental: {
      enableNativePlugin: true,
    },
  },
  resolve: {
    alias: {
      '@assets/': fileURLToPath(new URL('./app/assets/', import.meta.url)),
    },
  },
  plugins: [
    Vue(),
    ViteRuby(),
  ],
})
