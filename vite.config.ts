import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
import * as path from 'path';
import * as fs from 'fs';

const getAuthEndpoint = () => {
  switch (process.env.NODE_ENV) {
    case 'local':
      return 'https://auth.test.zhishuyun.com';
    case 'test':
      return 'https://auth.test.zhishuyun.com';
    case 'production':
    default:
      return 'https://auth.zhishuyun.com';
  }
};

const getDataEndpoint = () => {
  switch (process.env.NODE_ENV) {
    case 'local':
      return 'http://127.0.0.1:8007';
    case 'test':
      return 'https://data.test.zhishuyun.com';
    case 'production':
    default:
      return 'https://data.zhishuyun.com';
  }
};

export default defineConfig({
  server: {
    host: 'chat.local.zhishuyun.com',
    port: 443,
    https: {
      key: fs.readFileSync('certs/chat.local.zhishuyun.com.cert.key'),
      cert: fs.readFileSync('certs/chat.local.zhishuyun.com.cert.crt')
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
        target: getDataEndpoint(),
        changeOrigin: true
      },
      '/static': {
        target: getDataEndpoint(),
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
            if (id.includes('@fortawesome')) {
              const part = id.toString().split('node_modules/')[1];
              const parts = part.split('/');
              return `${parts[0]}.${parts[1]}`;
            }
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});
