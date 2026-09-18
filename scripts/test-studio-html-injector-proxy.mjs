import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import test from 'node:test';

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function reservePort() {
  const server = http.createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

function request(port, path, host = 'foyai.foytea.com') {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path, headers: { host } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() })
      );
    });
    req.on('error', reject);
  });
}

async function waitForHealth(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await request(port, '/healthz');
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('injector did not become healthy');
}

test('proxy rewrites HTML, streams non-HTML, isolates hosts, and caches metadata', async (context) => {
  const lookups = new Map();
  const metadataServer = http.createServer((req, res) => {
    const host = decodeURIComponent(req.url.split('/').at(-1));
    lookups.set(host, (lookups.get(host) || 0) + 1);
    if (host === 'missing.example.com') {
      res.writeHead(503).end();
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        title: host === 'foyai.foytea.com' ? 'FOY-AI' : 'Other AI',
        description: `Description for ${host}`,
        keywords: ['AI', host],
        favicon: `https://cdn.example.com/${host}.png`,
        image: `https://platform.acedata.cloud/api/v1/og/${host}.png`
      })
    );
  });
  const frontendServer = http.createServer((req, res) => {
    if (req.url === '/cookies') {
      res.setHeader('content-type', 'application/json');
      res.setHeader('set-cookie', ['session=abc; Path=/; HttpOnly', 'theme=dark; Path=/']);
      res.end('{}');
      return;
    }
    if (req.url === '/data.json') {
      res.setHeader('content-type', 'application/json');
      res.end('{"brand":"Ace Data Cloud"}');
      return;
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('etag', 'official-shell');
    res.end(
      '<!doctype html><html><head><title>Ace Data Cloud</title><meta property="og:title" content="Ace Data Cloud"></head><body>app</body></html>'
    );
  });
  const metadataPort = await listen(metadataServer);
  const frontendPort = await listen(frontendServer);
  const injectorPort = await reservePort();
  const child = spawn(process.execPath, ['deploy/production/studio-html-injector.mjs'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: String(injectorPort),
      STUDIO_UPSTREAM: `http://127.0.0.1:${frontendPort}`,
      SITE_HEAD_API: `http://127.0.0.1:${metadataPort}/`,
      SITE_CACHE_TTL_MS: '60000'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  context.after(async () => {
    child.kill('SIGTERM');
    await Promise.all([close(metadataServer), close(frontendServer)]);
  });
  await waitForHealth(injectorPort);

  const first = await request(injectorPort, '/pricing?campaign=1');
  assert.equal(first.status, 200);
  assert.match(first.body, /<title>FOY-AI<\/title>/);
  assert.match(first.body, /property="og:url" content="https:\/\/foyai\.foytea\.com\/pricing"/);
  assert.doesNotMatch(first.body, /Ace Data Cloud|campaign=1/);
  assert.equal(first.headers.etag, undefined);
  assert.match(first.headers['cache-control'], /no-store/);

  const second = await request(injectorPort, '/');
  assert.match(second.body, /FOY-AI/);
  assert.equal(lookups.get('foyai.foytea.com'), 1);

  const other = await request(injectorPort, '/', 'other.example.com');
  assert.match(other.body, /Other AI/);
  assert.doesNotMatch(other.body, /FOY-AI/);
  assert.equal(lookups.get('other.example.com'), 1);

  const missing = await request(injectorPort, '/', 'missing.example.com');
  assert.match(missing.body, /<title>missing\.example\.com<\/title>/);
  assert.doesNotMatch(missing.body, /Ace Data Cloud|FOY-AI|Other AI/);

  const json = await request(injectorPort, '/data.json');
  assert.equal(json.body, '{"brand":"Ace Data Cloud"}');
  const cookies = await request(injectorPort, '/cookies');
  assert.deepEqual(cookies.headers['set-cookie'], ['session=abc; Path=/; HttpOnly', 'theme=dark; Path=/']);
});

test('coalesces concurrent lookups and uses only same-host stale metadata', async (context) => {
  let lookups = 0;
  let fail = false;
  const metadataServer = http.createServer(async (_req, res) => {
    lookups += 1;
    await new Promise((resolve) => setTimeout(resolve, 25));
    if (fail) {
      res.writeHead(503).end();
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ title: 'Cached Tenant' }));
  });
  const frontendServer = http.createServer((_req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end('<html><head><title>Ace Data Cloud</title></head><body></body></html>');
  });
  const metadataPort = await listen(metadataServer);
  const frontendPort = await listen(frontendServer);
  const injectorPort = await reservePort();
  const child = spawn(process.execPath, ['deploy/production/studio-html-injector.mjs'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: String(injectorPort),
      STUDIO_UPSTREAM: `http://127.0.0.1:${frontendPort}`,
      SITE_HEAD_API: `http://127.0.0.1:${metadataPort}/`,
      SITE_CACHE_TTL_MS: '1',
      SITE_STALE_TTL_MS: '60000'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  context.after(async () => {
    child.kill('SIGTERM');
    await Promise.all([close(metadataServer), close(frontendServer)]);
  });
  await waitForHealth(injectorPort);

  const concurrent = await Promise.all(Array.from({ length: 5 }, () => request(injectorPort, '/')));
  assert.equal(lookups, 1);
  concurrent.forEach((response) => assert.match(response.body, /Cached Tenant/));

  await new Promise((resolve) => setTimeout(resolve, 5));
  fail = true;
  const stale = await request(injectorPort, '/');
  assert.equal(lookups, 2);
  assert.match(stale.body, /Cached Tenant/);

  const other = await request(injectorPort, '/', 'other.example.com');
  assert.equal(lookups, 3);
  assert.match(other.body, /<title>other\.example\.com<\/title>/);
  assert.doesNotMatch(other.body, /Cached Tenant|Ace Data Cloud/);
});
