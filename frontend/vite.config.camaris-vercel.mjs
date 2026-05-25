/**
 * Build statique page publique Camaris → deploy-camaris-vercel/ (Vercel, base /).
 * Pas de lien filmara.fr — API serverless Vercel (même origine /api), MongoDB direct.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js}',
      babel: { parserOpts: { plugins: ['jsx'] } }
    })
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  base: '/',
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, '../deploy-camaris-vercel'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'camaris-semaine-standalone.html')
      },
      output: {
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/[ext]/[name].[hash].[ext]'
      }
    }
  },
  envPrefix: 'VITE_'
});
