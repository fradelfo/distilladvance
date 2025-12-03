import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { type ConfigEnv, build, defineConfig } from 'vite';

type BrowserTarget = 'chrome' | 'firefox';

// Plugin to copy static files, fix output paths, and build content script as IIFE
function copyStaticFiles(browser: BrowserTarget) {
  return {
    name: 'copy-static-files',
    async writeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // Copy the appropriate manifest based on browser target
      const manifestFile = browser === 'firefox' ? 'manifest.firefox.json' : 'manifest.json';
      copyFileSync(resolve(__dirname, manifestFile), resolve(distDir, 'manifest.json'));

      // Copy icons if they exist
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(distDir, 'icons');

      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }

        const files = readdirSync(iconsDir);
        for (const file of files) {
          copyFileSync(resolve(iconsDir, file), resolve(distIconsDir, file));
        }
      }

      // Fix HTML output paths (move from dist/src/* to dist/*)
      const srcDir = resolve(distDir, 'src');
      if (existsSync(srcDir)) {
        // Move popup/index.html
        const srcPopupDir = resolve(srcDir, 'popup');
        const distPopupDir = resolve(distDir, 'popup');
        if (existsSync(srcPopupDir)) {
          if (!existsSync(distPopupDir)) {
            mkdirSync(distPopupDir, { recursive: true });
          }
          if (existsSync(resolve(srcPopupDir, 'index.html'))) {
            copyFileSync(resolve(srcPopupDir, 'index.html'), resolve(distPopupDir, 'index.html'));
          }
        }

        // Move options/index.html
        const srcOptionsDir = resolve(srcDir, 'options');
        const distOptionsDir = resolve(distDir, 'options');
        if (existsSync(srcOptionsDir)) {
          if (!existsSync(distOptionsDir)) {
            mkdirSync(distOptionsDir, { recursive: true });
          }
          if (existsSync(resolve(srcOptionsDir, 'index.html'))) {
            copyFileSync(
              resolve(srcOptionsDir, 'index.html'),
              resolve(distOptionsDir, 'index.html')
            );
          }
        }

        // Clean up src directory
        rmSync(srcDir, { recursive: true, force: true });
      }

      // Build content script separately as IIFE (no ES module imports)
      console.log('Building content script as IIFE...');
      await build({
        configFile: false,
        build: {
          outDir: resolve(__dirname, 'dist/content'),
          emptyDirOnBuildStart: false,
          lib: {
            entry: resolve(__dirname, 'src/content/main.ts'),
            name: 'DistillContent',
            formats: ['iife'],
            fileName: () => 'main.js',
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
          minify: false,
          sourcemap: true,
        },
        resolve: {
          alias: {
            '@distill/shared-types': resolve(__dirname, '../shared-types/src/index.ts'),
          },
        },
      });
      console.log('Content script built as IIFE');
    },
  };
}

export default defineConfig(({ mode }: ConfigEnv) => {
  // Determine browser target from mode
  const browser: BrowserTarget = mode === 'firefox' ? 'firefox' : 'chrome';
  console.log(`Building for: ${browser}`);

  return {
    plugins: [react(), copyStaticFiles(browser)],
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
          // Content script is built separately as IIFE (see copyStaticFiles plugin)
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
          // Vendor chunk for popup/background
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      // Enable IIFE format for content scripts (no module imports)
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
  };
});
