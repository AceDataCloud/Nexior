/// <reference types="vitest/config" />
import { type ConfigEnv, defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import replace from '@rollup/plugin-replace';
import * as path from 'path';
import { createRequire } from 'module';
import { configDefaults } from 'vitest/config';

const pkg = createRequire(import.meta.url)('./package.json') as { version: string };

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
    // Inject the package version as a plain global for ALL surfaces. Read via
    // `__APP_VERSION__` (telemetry release tag + desktop version gate). Do NOT
    // define onto import.meta.env.* — Vite manages that namespace and the key
    // can be clobbered.
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    // Keep the Playwright Electron E2E specs (e2e/) out of the vitest run —
    // they use @playwright/test, not vitest, and are driven by `playwright test`.
    test: {
      exclude: [...configDefaults.exclude, 'e2e/**']
    },
    // vite-ssg: only used by `npm run build:ssg`. Plain `npm run build` ignores
    // this and produces today's SPA. Pre-renders are served behind features=ssr.
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      dirStyle: 'nested',
      // Nexior is a client-only app (no SEO landing); SSG the login page as the
      // SSR-safe entry. Broad app-page SSG needs per-component window guards.
      includedRoutes: () => ['/auth/login']
    },
    ssr: {
      // Bundle (don't externalize) deps Node can't load during the SSG render:
      // raw .css imports + Capacitor plugins that ship extensionless ESM imports.
      noExternal: ['vue-dark-switch', /^@capacitor\//, /^@capacitor-community\//]
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      // Desktop (Electron) builds go to a dedicated outDir so they never share
      // or overwrite the web `dist/` (each surface owns its own output).
      outDir: process.env.VITE_SURFACE === 'desktop' ? 'dist-electron' : 'dist',
      // Computing gzip size for ~10 MB of chunks blows past the 2 GB V8
      // heap on Cloudflare Workers Builds. The report is stdout-only,
      // so disabling it costs nothing functional and shaves ~15 s off
      // every build (also resolves the OOM crash at the
      // `computing gzip size` step).
      reportCompressedSize: false,
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
