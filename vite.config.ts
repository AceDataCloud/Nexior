import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
import * as path from 'path';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://platform.acedata.cloud',
        changeOrigin: true
      },
      '/oauth2': {
        target: 'https://auth.acedata.cloud',
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue(),
    string({
      include: ['**/*.md', '**/*.tpl', '**/*.theme']
    }),
    replace({
      preventAssignment: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const modules = ['@vue', 'highlight.js', 'element-plus', 'axios'];
            const chunk = modules.find((module) => id.includes(module));
            return chunk ? `vendor-${chunk}` : 'vendor-others';
          }
        }
      }
    }
  }
});
