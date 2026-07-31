#!/usr/bin/env node

/**
 * Copy the tray icons into `electron/dist/assets/`, next to the compiled main
 * process that loads them.
 *
 * `build/` is buildResources — electron-builder reads icons from it at PACKAGE
 * time but does not ship it, and `files:` only includes `electron/dist/**` and
 * `electron/renderer/**`. An icon referenced from `build/` at RUNTIME therefore
 * resolves to nothing inside the .app, and `Tray` silently renders an empty
 * image: the app is resident with no menu-bar icon and no way to reach its
 * Quit item.
 *
 * Usage:  node scripts/copy-tray-assets.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'build');
const DEST = path.join(__dirname, '..', 'electron', 'dist', 'assets');
const ICONS = ['trayTemplate.png', 'trayTemplate@2x.png', 'icon.png'];

fs.mkdirSync(DEST, { recursive: true });

let copied = 0;
for (const name of ICONS) {
  const from = path.join(SRC, name);
  if (!fs.existsSync(from)) {
    // Non-fatal: a missing @2x only costs sharpness on Retina, and the
    // packaged app still has the 1x. A missing 1x is caught by the check below.
    console.warn(`[copy-tray-assets] missing ${from}`);
    continue;
  }
  fs.copyFileSync(from, path.join(DEST, name));
  copied += 1;
}

if (!fs.existsSync(path.join(DEST, 'trayTemplate.png'))) {
  console.error('[copy-tray-assets] trayTemplate.png missing — run "python3 scripts/gen-tray-icon.py"');
  process.exit(1);
}

console.log(`[copy-tray-assets] copied ${copied} icon(s) → ${DEST}`);
