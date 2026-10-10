import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendUrl = process.env.VITE_API_URL || 'http://127.0.0.1:5000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
