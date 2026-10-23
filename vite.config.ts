import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Ensure NODE_ENV defaults to production for builds
if (!process.env.VITEST && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    isolate: false,
    env: {
      TEST_DB_NAME: 'i2a_schoolos_synthetic_test'
    }
  }
});
