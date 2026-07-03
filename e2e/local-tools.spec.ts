import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

/**
 * Local Tools settings panel E2E. Reproduces the "Local Tools tab is blank"
 * report against the REAL Electron app (real preload bridge, real main-process
 * config load, real Element Plus / i18n / font-awesome renderer).
 *
 * Each test launches the app with an ISOLATED `--user-data-dir` seeded with a
 * realistic local-tools config (authorized root + full computer-use / builtin
 * grants + `computerUse: true`) — matching the shape a real user accumulates.
 * Isolating userData (a) avoids colliding with the single-instance lock of a
 * running dev/installed app, and (b) makes the render deterministic.
 *
 * The panel is opened via the `open-user-settings` event (owned by the
 * always-mounted UserCenter, so it works for guests — no login). Any renderer
 * `pageerror` / `console.error` fails the test: a render-time crash (the
 * classic Vue "blank subtree" failure) surfaces here.
 *
 * Run after `compile:electron` + `copy-renderer` so electron/dist/main.js and
 * electron/renderer/ exist.
 */
const MAIN = path.join(__dirname, '..', 'electron', 'dist', 'main.js');

// A config in the shape a real desktop user ends up with: one authorized root,
// no MCP servers, computer-use enabled, and a full set of persistent grants
// (per-action computer.* grants + tool-wide builtin grants + one input-scoped
// fs grant). This is the data that must render without blanking.
const SEED_CONFIG = {
  roots: [path.join(os.tmpdir(), 'acedata-e2e-root')],
  mcp: [],
  grants: [
    'fs.list_dir:{"path":"~/Desktop"}',
    'computer.screenshot',
    'computer.click',
    'computer.move',
    'computer.type',
    'computer.key',
    'computer.scroll',
    'shell.run_command',
    'fs.write_file',
    'fs.list_dir',
    'fs.read_file'
  ],
  computerUse: true
};

let app: ElectronApplication;
let win: Page;
let userDataDir: string;
const errors: string[] = [];

test.beforeEach(async () => {
  errors.length = 0;
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acedata-e2e-'));
  fs.writeFileSync(path.join(userDataDir, 'local-tools.json'), JSON.stringify(SEED_CONFIG, null, 2));

  app = await electron.launch({ args: [MAIN, `--user-data-dir=${userDataDir}`] });
  win = await app.firstWindow();
  win.on('pageerror', (e) => errors.push(`pageerror: ${e.message}\n${e.stack ?? ''}`));
  win.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  await win.waitForLoadState('domcontentloaded');
  await expect(win.locator('#app')).toBeAttached();
});

test.afterEach(async () => {
  await app?.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    /* best-effort temp cleanup */
  }
});

test('localExec.getConfig() returns a well-formed config (roots is an array)', async () => {
  const cfg = await win.evaluate(async () => {
    const bridge = (window as unknown as { localExec?: { getConfig: () => Promise<unknown> } }).localExec;
    if (!bridge) return { __missing: true } as const;
    return bridge.getConfig();
  });

  expect(cfg, 'localExec bridge should be exposed by preload').not.toHaveProperty('__missing');
  // The renderer reads cfg.roots unguarded (`roots.length` in the template),
  // so the main process MUST always hand back roots as an array — otherwise the
  // panel crashes to blank.
  expect(Array.isArray((cfg as { roots?: unknown }).roots), `roots must be an array, got: ${JSON.stringify(cfg)}`).toBe(
    true
  );
});

test('Local Tools settings tab renders content (not a blank pane)', async () => {
  // The UserCenter (always mounted in the Main layout, guests included) owns the
  // only <user-setting> dialog and opens it on this event. Dispatch repeatedly
  // until the panel mounts, to absorb boot/listener-registration timing.
  await expect
    .poll(
      async () => {
        await win.evaluate(() =>
          window.dispatchEvent(new CustomEvent('open-user-settings', { detail: { tab: 'localTools' } }))
        );
        return win.locator('.local-tools-setting').count();
      },
      { timeout: 20_000, intervals: [300, 500, 1000, 2000, 3000] }
    )
    .toBeGreaterThan(0);

  const panel = win.locator('.local-tools-setting');
  await expect(panel).toBeVisible();

  // Give the async mounted() (getConfig + tool catalogs + grants) time to run,
  // so a render crash triggered by the loaded data has a chance to fire.
  await win.waitForTimeout(1500);

  // Diagnostics: dump what actually rendered + any captured errors. Printed
  // regardless so a blank pane is debuggable from CI logs.
  const html = await panel.evaluate((el) => el.innerHTML).catch(() => '<panel detached>');
  const sectionCount = await panel.locator('section').count();
  const text = ((await panel.innerText().catch(() => '')) || '').trim();
  // eslint-disable-next-line no-console
  console.log(
    `\n[local-tools] sections=${sectionCount} textLen=${text.length}\n` +
      `[local-tools] errors:\n${errors.join('\n') || '(none)'}\n` +
      `[local-tools] innerHTML (first 1200):\n${html.slice(0, 1200)}\n`
  );

  // "Not blank" = the desktop branch rendered its sections. On desktop at least
  // the MCP + Computer Use sections always render (no v-if gate), each with an
  // <h3> heading. A render crash (e.g. `roots` undefined) would blank the whole
  // subtree, dropping these to zero.
  await expect(panel.locator('section h3').first()).toBeVisible();
  expect(sectionCount, 'panel should render at least one section').toBeGreaterThan(0);
  expect(text.length, 'panel should not be visually empty').toBeGreaterThan(0);

  // No render-time errors should have fired while opening the panel.
  expect(errors, `renderer errors during Local Tools render:\n${errors.join('\n')}`).toEqual([]);
});
