import { copyFile, cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = new URL('.', import.meta.url);
const sourceRoot = fileURLToPath(root);

export default defineConfig({
  appType: 'spa',
  build: {
    rollupOptions: {
      input: {
        index: resolve(sourceRoot, 'index.html'),
        preview: resolve(sourceRoot, 'preview.html'),
      },
    },
  },
  plugins: [{
    name: 'copy-static-contracts',
    async writeBundle() {
      await mkdir(new URL('dist/assets/components/', root), { recursive: true });
      await Promise.all([
        copyFile(new URL('component-manifest.json', root), new URL('dist/component-manifest.json', root)),
        copyFile(new URL('staticwebapp.config.json', root), new URL('dist/staticwebapp.config.json', root)),
        copyFile(new URL('404.html', root), new URL('dist/404.html', root)),
        copyFile(new URL('assets/tokens.css', root), new URL('dist/assets/tokens.css', root)),
        copyFile(new URL('assets/docs.css', root), new URL('dist/assets/docs.css', root)),
        cp(new URL('assets/components/', root), new URL('dist/assets/components/', root), { recursive: true }),
      ]);
    },
  }],
});
