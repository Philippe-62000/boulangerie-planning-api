import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}",
      babel: {
        parserOpts: {
          plugins: ['jsx'],
        },
      },
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  
  // Base path pour OVH (/plan/)
  base: '/plan/',
  
  // Serveur de développement
  server: {
    port: 3000,
    open: true,
  },
  
  // Build configuration
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Conserver la structure des noms de fichiers pour compatibilité
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/[ext]/[name].[hash].[ext]',
      },
    },
  },
  
  // Variables d'environnement (préfixe VITE_ au lieu de REACT_APP_)
  envPrefix: 'VITE_',
  
  // Alias pour les imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

