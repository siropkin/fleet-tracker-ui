import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@resources': path.resolve(__dirname, './src/resources'),
      '@classes': path.resolve(__dirname, './src/classes'),
    },
  },
  plugins: [react()],
});
