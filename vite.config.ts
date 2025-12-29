import { type ConfigEnv, defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import * as path from 'path';

const normalizeModuleId = (id: string) => id.replace(/\\/g, '/');

const vendorChunkRules: Array<[chunkName: string, matches: (normalizedId: string) => boolean]> = [
  ['vendor-element-plus', (id) => id.includes('/element-plus/')],
  ['vendor-vue-router', (id) => id.includes('/vue-router/')],
  ['vendor-vue', (id) => id.includes('/node_modules/vue/') || id.includes('/node_modules/@vue/')],
  ['vendor-codemirror', (id) => id.includes('/codemirror/') || id.includes('/@codemirror/')],
  ['vendor-katex', (id) => id.includes('/katex/')],
  ['vendor-highlight', (id) => id.includes('/highlight.js/')],
  ['vendor-chart', (id) => id.includes('/chart.js/') || id.includes('/vue-chartjs/')],
  ['vendor-axios', (id) => id.includes('/axios/')],
  ['vendor-dayjs', (id) => id.includes('/dayjs/')]
];

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
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = normalizeModuleId(id);
            if (!normalizedId.includes('/node_modules/')) return;

            const matched = vendorChunkRules.find(([, matches]) => matches(normalizedId));
            if (matched) return matched[0];

            return 'vendor';
          }
        }
      }
    }
  };
});
