import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Consume the library source directly for live HMR during development.
    alias: { 'palette-snap': resolve(__dirname, '../src/index.ts') },
    dedupe: ['react', 'react-dom'],
  },
});
