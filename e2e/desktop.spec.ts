import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test';
import path from 'node:path';

/**
 * Desktop boot smoke test. Launches the real Electron main process against the
 * copied renderer and asserts the highest-value invariants:
 *
 *  1. a window actually opens (single-instance + window creation work),
 *  2. it loads over the custom `app://bundle` scheme (NOT file://),
 *  3. `index.html` was served correctly — `#app` is present, which proves
 *     protocol.ts returned the HTML with the right MIME (the classic
 *     custom-scheme white-screen failure mode), not a 404 / octet-stream.
 *
 * Backend calls fail in CI (offline), but the shell + protocol serving must
 * still produce a mounted document. Run after `compile:electron` +
 * `copy-renderer` so electron/dist/main.js and electron/renderer/ exist.
 */
const MAIN = path.join(__dirname, '..', 'electron', 'dist', 'main.js');

let app: ElectronApplication;

test.afterEach(async () => {
  await app?.close();
});

test('boots, serves the SPA over app://bundle, and mounts #app', async () => {
  app = await electron.launch({ args: [MAIN] });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');

  expect(win.url()).toContain('app://bundle');
  await expect(win.locator('#app')).toBeAttached();
});
