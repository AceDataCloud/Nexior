import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
import * as path from 'path';
import * as fs from 'fs';

const getAuthEndpoint = () => {
  console.log('process.env.NODE_ENV', process.env.NODE_ENV);
  switch (process.env.NODE_ENV) {
    case 'local':
      return 'http://localhost:8001';
    case 'test':
      return 'https://auth.test.zhishuyun.com';
    case 'production':
    default:
      return 'https://auth.zhishuyun.com';
  }
};

const getAcademyEndpoint = () => {
  switch (process.env.NODE_ENV) {
    case 'local':
      return 'http://localhost:8002';
    case 'test':
      return 'https://academy.test.zhishuyun.com';
    case 'production':
    default:
      return 'https://academy.zhishuyun.com';
  }
};

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
        target: getAuthEndpoint(),
        changeOrigin: true
      },
      '/api/v1/token': {
        target: getAuthEndpoint(),
        changeOrigin: true
      },
      '/api': {
        target: getAcademyEndpoint(),
        changeOrigin: true
      },
      '/static': {
        target: getAcademyEndpoint(),
        changeOrigin: true
      }
      // '/ws': {
      //   target: 'ws://localhost:8000',
      //   changeOrigin: true,
      //   ws: true
      // }
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
