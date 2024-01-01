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
    sourcemap: false
  }
});
