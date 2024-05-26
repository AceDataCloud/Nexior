import { ConfigEnv, defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import { string } from 'rollup-plugin-string';
import * as path from 'path';

export default defineConfig((config: ConfigEnv) => {
  process.env = { ...process.env, ...loadEnv(config.mode, process.cwd()) };
  return {
    server: {
      host: 'localhost',
      port: 8084,
      proxy: {
        '/api/v1/auth': {
          target: process.env.VITE_BASE_URL_AUTH,
          changeOrigin: true
        },
        '/api/v1/users': {
          target: process.env.VITE_BASE_URL_AUTH,
          changeOrigin: true
        },
        '/oauth2/v1/token': {
          target: process.env.VITE_BASE_URL_AUTH,
          changeOrigin: true
        },
        '/api': {
          target: process.env.VITE_BASE_URL_PLATFORM,
          changeOrigin: true
        },
        '/static': {
          target: process.env.VITE_BASE_URL_PLATFORM,
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
              const modules = [
                '@vue',
                'element-plus',
                'axios',
                'highlight.js',
                'mustache',
                'markdown',
                'fortawesome',
                'qrcode',
                'vue-dark-switch',
                'chart.js'
              ];
              const chunk = modules.find((module) => id.includes(module));
              return chunk ? `vendor-${chunk}` : 'vendor-others';
            }
          }
        }
      }
    }
  };
});
