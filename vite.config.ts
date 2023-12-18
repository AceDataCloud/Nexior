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
        target: 'https://data.zhishuyun.com',
        changeOrigin: true
      },
      '/oauth2': {
        target: 'https://auth.zhishuyun.com',
        changeOrigin: true
      },
      '/api/v1/me': {
        target: 'https://auth.zhishuyun.com',
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
