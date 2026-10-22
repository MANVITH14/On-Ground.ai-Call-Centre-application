import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During development: /api/* → http://localhost:3001/*
      // This means you can also set VITE_TOKEN_ENDPOINT=/api/token in .env
      // instead of the full http://localhost:3001/token URL.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  // Ensure @twilio/voice-sdk is bundled correctly
  optimizeDeps: {
    include: ['@twilio/voice-sdk'],
  },
});
