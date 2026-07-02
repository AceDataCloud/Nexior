#!/usr/bin/env node
/**
 * Cross-platform wrapper for `electron-rebuild` that only targets the native
 * libnut prebuild for the current OS. Called via `npm run rebuild:electron`.
 *
 * Why not a one-liner in package.json?
 *   `electron-rebuild -f -w a b c` treats every name as a required module and
 *   errors when the OS-specific packages aren't installed. `@nut-tree-fork/
 *   libnut-{win32,darwin,linux}` are OS-restricted optionalDeps, so on any
 *   single machine only one of the three is present. Dispatching by
 *   `process.platform` here keeps the npm script portable.
 */

'use strict';

const { spawnSync } = require('node:child_process');

const MAP = {
  win32: '@nut-tree-fork/libnut-win32',
  darwin: '@nut-tree-fork/libnut-darwin',
  linux: '@nut-tree-fork/libnut-linux'
};

const target = MAP[process.platform];
if (!target) {
  console.log(`rebuild:electron: unsupported platform ${process.platform} — nothing to rebuild`);
  process.exit(0);
}

console.log(`rebuild:electron: rebuilding ${target} for Electron ABI`);
const r = spawnSync('npx', ['electron-rebuild', '-f', '-o', target], {
  stdio: 'inherit',
  shell: true
});
process.exit(typeof r.status === 'number' ? r.status : 1);
