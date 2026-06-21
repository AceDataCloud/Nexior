#!/usr/bin/env node

/**
 * Copy the Vite desktop build (`dist-electron/`) into `electron/renderer/`,
 * which `electron/protocol.ts` serves over `app://bundle/`. Kept separate from
 * the web `dist/` so surfaces never overwrite each other.
 *
 * Usage:  node scripts/copy-renderer.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'dist-electron');
const DEST = path.join(__dirname, '..', 'electron', 'renderer');

if (!fs.existsSync(SRC)) {
  console.error(`[copy-renderer] missing ${SRC} — run "npm run build:electron" first`);
  process.exit(1);
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(SRC, DEST, { recursive: true });

console.log(`[copy-renderer] copied ${SRC} → ${DEST}`);
