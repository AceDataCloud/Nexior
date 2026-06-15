// Post-build: from each vite-ssg page (content baked into #app), derive a plain
// SPA shell (empty #app) so nginx can serve EITHER the SSG page or the shell per
// the runtime `features=ssr` flag. Same asset refs in both, so the shell mounts
// fresh and the SSG page hydrates.
//
// For each route file `<dir>/index.html` we write:
//   <dir>/index.ssg.html   — the SSG page (content), served when flag is on
//   <dir>/index.html       — the shell (empty #app), served by default
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Routes pre-rendered by vite-ssg (keep in sync with ssgOptions.includedRoutes).
const ROUTES = ['auth/login'];
const DIST = 'dist';

function toShell(html) {
  const startTag = html.indexOf('<div id="app"');
  if (startTag === -1) return null;
  const openEnd = html.indexOf('>', startTag) + 1;
  let depth = 1;
  let i = openEnd;
  while (depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
    }
  }
  const closeStart = i - 6;
  return html.slice(0, startTag) + '<div id="app">' + html.slice(closeStart);
}

let ok = 0;
for (const route of ROUTES) {
  const dir = route ? join(DIST, route) : DIST;
  const page = join(dir, 'index.html');
  if (!existsSync(page)) {
    console.warn(`[ssg-shell] missing ${page} — skipped`);
    continue;
  }
  const ssg = readFileSync(page, 'utf8');
  const shell = toShell(ssg);
  if (!shell) {
    console.error(`[ssg-shell] could not locate #app in ${page}`);
    process.exit(1);
  }
  writeFileSync(join(dir, 'index.ssg.html'), ssg);
  writeFileSync(page, shell);
  ok++;
  console.log(`[ssg-shell] ${page}: shell=${shell.length}B ssg=${ssg.length}B`);
}
console.log(`[ssg-shell] done (${ok} routes)`);
