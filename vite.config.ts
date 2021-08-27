import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    vue(),
    replace({
      preventAssignment: true,
      VDITOR_VERSION: JSON.stringify(pkg.dependencies.vditor.replace(/^[\^\~]/g, '')),
      '_VDITOR_VERSION as VDITOR_VERSION': ''
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: true
  }
});
