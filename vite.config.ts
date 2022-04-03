import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';
import { string } from 'rollup-plugin-string';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    open: true,
    host: 'academy.local.zhishuyun.com',
    port: 443,
    https: {
      key: fs.readFileSync('certs/academy.local.zhishuyun.com.cert.key'),
      cert: fs.readFileSync('certs/academy.local.zhishuyun.com.cert.crt')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  plugins: [
    vue(),
    string({
      include: ['**/*.md', '**/*.theme', 'highlight.js/styles/*.css']
    }),
    replace({
      preventAssignment: true
      // VDITOR_VERSION: JSON.stringify(pkg.dependencies.vditor.replace(/^[\^\~]/g, '')),
      // '_VDITOR_VERSION as VDITOR_VERSION': ''
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
