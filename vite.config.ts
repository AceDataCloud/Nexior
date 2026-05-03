import { type ConfigEnv, defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import * as path from 'path';

const normalizeModuleId = (id: string) => id.replace(/\\/g, '/');

const vendorChunkRules: Array<[chunkName: string, matches: (normalizedId: string) => boolean]> = [
  // NOTE: We deliberately do NOT define a `vendor-web3` chunk here. Forcing
  // every Web3 dependency into one giant chunk causes Rollup to hoist shared
  // helpers (notably Vite's auto-generated `__vitePreload`) into that chunk,
  // which makes the entry statically depend on it. The browser then preloads
  // ~2 MB / 650 KB-gz of Solana code on first paint even for users who never
  // visit a payment page. Letting Rollup pick natural chunk boundaries keeps
  // Web3 code split across small chunks that are only fetched lazily by
  // `utils/x402/solana.ts` and `plugins/solana-wallets.ts`.
  //
  // Same rationale applies to `element-plus`: although every consumer in `src`
  // uses selective `import { ElButton } from 'element-plus'` (so tree-shaking
  // is already at work), forcing all retained components into a single shared
  // chunk lumps ~115 component subtrees (570 KB / 180 KB-gz) onto the entry's
  // static graph, because dozens of routes statically import from it. Letting
  // Rollup do the splitting naturally keeps each component family in a small
  // chunk co-located with its consumer route. The eager critical path then
  // only carries the few components that App.vue / Layouts / `vLoading`
  // actually need (ElConfigProvider, ElTag, ElIcon, ElDialog/Overlay/…).
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
        '/sso/v1/token': {
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

            return undefined;
          }
        }
      }
    }
  };
});
