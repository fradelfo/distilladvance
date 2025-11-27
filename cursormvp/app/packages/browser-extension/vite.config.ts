import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import react from '@vitejs/plugin-react';

// Plugin to copy static files to dist
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    writeBundle() {
      // Copy manifest.json
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'));

      // Copy icons if they exist
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(__dirname, 'dist/icons');

      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }

        const files = readdirSync(iconsDir);
        for (const file of files) {
          copyFileSync(resolve(iconsDir, file), resolve(distIconsDir, file));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticFiles()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyDirOnBuildStart: true,
    rollupOptions: {
      input: {
        // Popup React app
        popup: resolve(__dirname, 'src/popup/index.html'),
        // Options page
        options: resolve(__dirname, 'src/options/index.html'),
        // Background service worker
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        // Content script
        'content/main': resolve(__dirname, 'src/content/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep CSS files in appropriate locations
          if (assetInfo.name?.endsWith('.css')) {
            if (assetInfo.name.includes('popup')) {
              return 'popup/[name][extname]';
            }
            return 'content/[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },
    // Service worker needs to be iife format
    target: 'esnext',
    minify: false, // Easier debugging during development
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@distill/shared-types': resolve(__dirname, '../shared-types/src/index.ts'),
    },
  },
  // Development server config (for testing popup separately)
  server: {
    port: 5173,
    open: '/src/popup/index.html',
  },
});
