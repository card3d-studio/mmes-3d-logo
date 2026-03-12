import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/mmes-3d-logo/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        embedTest: resolve(__dirname, 'embed-test.html'),
      },
    },
  },
})