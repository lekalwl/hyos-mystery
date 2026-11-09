import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build portable (static hosting, sub-folders).
// --mode public   : site without the editor (deploy this one)
// --mode artifact : single JS bundle (used for the one-file preview)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build: {
    outDir: mode === 'public' ? 'dist-public' : 'dist',
    rollupOptions: { output: { inlineDynamicImports: mode === 'artifact' } },
  },
}));
