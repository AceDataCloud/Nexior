import { defineConfig } from '@playwright/test';

/**
 * Playwright config for the Electron desktop E2E smoke test. The test drives
 * the real Electron app (via `_electron`), so there is no web server / browser
 * project here — Electron is launched directly in the spec.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list'
});
