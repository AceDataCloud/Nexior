import { protocol } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { Readable } from 'node:stream';

/**
 * Serve the Vite SPA build over a registered standard+secure custom scheme
 * (`app://bundle/...`) rather than `file://`. A real, whitelistable origin is
 * required so AuthFrontend's CSP `frame-ancestors` can allow the login iframe
 * (a `file://`/opaque origin can't be whitelisted).
 */
const SCHEME = 'app';
export const APP_ORIGIN = `${SCHEME}://bundle`;

// electron/renderer holds the copied Vite `dist-electron` output (see
// scripts/copy-renderer.js). realpath up front so the traversal guard compares
// against the canonical path.
const ROOT = fs.realpathSync(path.join(__dirname, '..', 'renderer'));

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.wasm': 'application/wasm'
};

/**
 * Resolve a request path to a real file inside ROOT, or null. Guards against
 * traversal: a plain `startsWith(ROOT)` is unsafe (sibling-prefix like
 * `ROOT-secrets`, Windows short names) — use a separator boundary AND realpath
 * to also defeat symlinks. Returns null on ENOENT.
 */
function resolveSafe(rel: string): string | null {
  const full = path.resolve(ROOT, rel);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  try {
    const real = fs.realpathSync(full);
    if (real !== ROOT && !real.startsWith(ROOT + path.sep)) return null;
    if (!fs.statSync(real).isFile()) return null;
    return real;
  } catch {
    return null; // ENOENT etc.
  }
}

// net.fetch(file://) Content-Type is unreliable (octet-stream on many
// platforms → ESM refuses to load under a secure scheme). Stream the file with
// an explicit Content-Type. A Node Readable is NOT a web ReadableStream, so
// bridge with Readable.toWeb (a bare cast yields an empty body → white screen).
function serveFile(file: string): Response {
  const ct = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const body = Readable.toWeb(fs.createReadStream(file)) as unknown as ReadableStream;
  return new Response(body, { status: 200, headers: { 'Content-Type': ct } });
}

export const registerAppProtocol = {
  /** Must run at module load, BEFORE app 'ready', in every process. */
  declare(): void {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: SCHEME,
        privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
      }
    ]);
  },
  /** Wire the handler. Call after app 'ready'. */
  serve(): void {
    protocol.handle(SCHEME, (request) => {
      const { pathname } = new URL(request.url);
      const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
      const wantsHtml = (request.headers.get('Accept') || '').includes('text/html');

      const file = resolveSafe(rel);
      if (file) return serveFile(file);

      // SPA fallback ONLY for navigation requests; a genuinely missing asset
      // (e.g. a stale hashed chunk) must 404, not silently return index.html.
      if (wantsHtml) {
        const index = resolveSafe('index.html');
        if (index) return serveFile(index);
      }
      return new Response('not found', { status: 404 });
    });
  }
};
