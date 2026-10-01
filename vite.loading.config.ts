import { defineConfig, mergeConfig, type ConfigEnv } from 'vite';
import path from 'node:path';
import base from './vite.config';

export default defineConfig((env: ConfigEnv) =>
  mergeConfig(typeof base === 'function' ? base(env) : base, {
    define: { 'import.meta.env.VITE_LOADING_PREVIEW': JSON.stringify('1') },
    build: {
      target: 'esnext',
      outDir: 'dist-loading',
      emptyOutDir: true,
      rollupOptions: {
        input: { app: path.resolve(__dirname, 'index.html'), loading: path.resolve(__dirname, 'loading-lab.html') }
      }
    }
  })
);
