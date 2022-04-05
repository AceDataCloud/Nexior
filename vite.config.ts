import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
import * as path from 'path';
import * as fs from 'fs';

export default defineConfig({
  server: {
    // open: true,
    host: 'academy.local.zhishuyun.com',
    port: 443,
    https: {
      key: fs.readFileSync('certs/academy.local.zhishuyun.com.cert.key'),
      cert: fs.readFileSync('certs/academy.local.zhishuyun.com.cert.crt')
    },
    proxy: {
      '/api/v1/me': {
        target: 'https://auth.test.zhishuyun.com',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/static': {
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
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: process.env.NODE_ENV !== 'production'
  }
});
