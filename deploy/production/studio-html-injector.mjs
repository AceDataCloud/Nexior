import http from 'node:http';
import { Readable } from 'node:stream';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const listenPort = Number(process.env.PORT || 3000);
const upstream = process.env.STUDIO_UPSTREAM || 'http://studio-frontend.acedatacloud.svc.cluster.local:8085';
const metadataApi = process.env.SITE_HEAD_API || 'https://platform.acedata.cloud/api/v1/site-head/';
const freshMs = Number(process.env.SITE_CACHE_TTL_MS || 60_000);
const staleMs = Number(process.env.SITE_STALE_TTL_MS || 300_000);
const lookupTimeoutMs = Number(process.env.SITE_LOOKUP_TIMEOUT_MS || 3_000);
const upstreamTimeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 300_000);
const maxHtmlBytes = Number(process.env.MAX_HTML_BYTES || 4 * 1024 * 1024);
const officialHost = normalizeHost(process.env.OFFICIAL_STUDIO_HOST || 'studio.acedata.cloud');
const metadataCache = new Map();
const pendingLookups = new Map();

export function normalizeHost(rawHost) {
  const host = String(rawHost || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host))
    return '';
  return host;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function removeTag(html, matcher) {
  return html.replace(matcher, '');
}

function appendHead(html, tag) {
  return html.replace(/<\/head\s*>/i, `    ${tag}\n  </head>`);
}

function addMeta(html, attribute, key, content) {
  return appendHead(html, `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />`);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

export function injectTenantHead(html, metadata, requestUrl) {
  const url = new URL(requestUrl);
  const host = normalizeHost(url.hostname);
  if (!host) return html;

  const title = String(metadata?.title || host).trim() || host;
  const description = String(metadata?.description || '').trim();
  const keywords = Array.isArray(metadata?.keywords)
    ? metadata.keywords
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim())
        .join(', ')
    : '';
  const favicon = safeHttpsUrl(metadata?.favicon);
  const image =
    safeHttpsUrl(metadata?.image) || `https://platform.acedata.cloud/api/v1/og/${encodeURIComponent(host)}.png`;
  const canonical = `${url.origin}${url.pathname}`;

  let result = html;
  result = removeTag(result, /<title\b[^>]*>[\s\S]*?<\/title\s*>\s*/gi);
  result = removeTag(
    result,
    /<meta\b(?=[^>]*\bname\s*=\s*(["'])(?:description|keywords|slack-app-id|twitter:[^"']+)\1)[^>]*>\s*/gi
  );
  result = removeTag(result, /<meta\b(?=[^>]*\bproperty\s*=\s*(["'])og:[^"']+\1)[^>]*>\s*/gi);
  result = removeTag(
    result,
    /<link\b(?=[^>]*\brel\s*=\s*(["'])(?:canonical|(?:shortcut\s+)?icon|apple-touch-icon)\1)[^>]*>\s*/gi
  );
  result = result.replace(/<head\b[^>]*>/i, (head) => `${head}\n    <title>${escapeText(title)}</title>`);
  if (description) result = addMeta(result, 'name', 'description', description);
  if (keywords) result = addMeta(result, 'name', 'keywords', keywords);
  result = addMeta(result, 'property', 'og:type', 'website');
  result = addMeta(result, 'property', 'og:site_name', title);
  result = addMeta(result, 'property', 'og:title', title);
  if (description) result = addMeta(result, 'property', 'og:description', description);
  result = addMeta(result, 'property', 'og:url', canonical);
  result = addMeta(result, 'property', 'og:image', image);
  result = addMeta(result, 'name', 'twitter:card', 'summary_large_image');
  result = addMeta(result, 'name', 'twitter:title', title);
  if (description) result = addMeta(result, 'name', 'twitter:description', description);
  result = addMeta(result, 'name', 'twitter:image', image);
  result = appendHead(result, `<link rel="canonical" href="${escapeAttribute(canonical)}" />`);
  if (favicon) {
    result = appendHead(result, `<link rel="icon" href="${escapeAttribute(favicon)}" />`);
    result = appendHead(result, `<link rel="apple-touch-icon" href="${escapeAttribute(favicon)}" />`);
  }
  return result;
}

async function refreshMetadata(host) {
  const response = await fetch(`${metadataApi}${encodeURIComponent(host)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(lookupTimeoutMs)
  });
  if (!response.ok) throw new Error(`site head lookup returned ${response.status}`);
  const metadata = await response.json();
  const now = Date.now();
  metadataCache.set(host, { metadata, freshUntil: now + freshMs, staleUntil: now + staleMs });
  return metadata;
}

async function getMetadata(host) {
  const now = Date.now();
  const cached = metadataCache.get(host);
  if (cached?.freshUntil > now) return cached.metadata;
  if (!pendingLookups.has(host)) {
    pendingLookups.set(
      host,
      refreshMetadata(host).finally(() => pendingLookups.delete(host))
    );
  }
  try {
    return await pendingLookups.get(host);
  } catch (error) {
    if (cached?.staleUntil > now) return cached.metadata;
    console.error(JSON.stringify({ event: 'metadata_lookup_failed', host, message: error.message }));
    return null;
  }
}

function requestHeaders(request, host) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (
      value !== undefined &&
      !['connection', 'content-length', 'host', 'if-none-match', 'if-modified-since'].includes(name.toLowerCase())
    ) {
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  headers.set('host', host);
  headers.set('accept-encoding', 'identity');
  headers.set('x-forwarded-host', host);
  headers.set('x-forwarded-proto', 'https');
  return headers;
}

function copyHeaders(source, target, transformed) {
  const invalid = new Set(['connection', 'content-length', 'content-encoding', 'transfer-encoding']);
  if (transformed) ['etag', 'content-md5', 'last-modified'].forEach((name) => invalid.add(name));
  for (const [name, value] of source.headers) {
    if (name.toLowerCase() !== 'set-cookie' && !invalid.has(name.toLowerCase())) target.setHeader(name, value);
  }
  const cookies = source.headers.getSetCookie?.() || [];
  if (cookies.length) target.setHeader('set-cookie', cookies);
  if (transformed) {
    target.setHeader('cache-control', 'no-cache, no-store, max-age=0, must-revalidate');
    target.setHeader('vary', 'Host, Accept-Encoding');
  }
}

async function readLimited(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxHtmlBytes) {
      await reader.cancel();
      throw new Error('HTML response exceeds configured limit');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function proxyRequest(request, response) {
  if (request.url === '/healthz') {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }
  const host = normalizeHost(request.headers.host);
  if (!host) {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Invalid Host');
    return;
  }
  const method = request.method || 'GET';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);
  const onClose = () => controller.abort();
  request.once('aborted', onClose);
  try {
    const upstreamResponse = await fetch(new URL(request.url || '/', upstream), {
      method,
      headers: requestHeaders(request, host),
      body: ['GET', 'HEAD'].includes(method) ? undefined : Readable.toWeb(request),
      duplex: ['GET', 'HEAD'].includes(method) ? undefined : 'half',
      redirect: 'manual',
      signal: controller.signal
    });
    const contentType = upstreamResponse.headers.get('content-type') || '';
    const isHtml = method === 'GET' && upstreamResponse.ok && contentType.toLowerCase().includes('text/html');
    response.statusCode = upstreamResponse.status;
    copyHeaders(upstreamResponse, response, isHtml);
    if (isHtml) {
      const [html, metadata] = await Promise.all([readLimited(upstreamResponse), getMetadata(host)]);
      response.end(
        metadata === null && host === officialHost
          ? html
          : injectTenantHead(html, metadata, `https://${host}${request.url || '/'}`)
      );
    } else if (!upstreamResponse.body || method === 'HEAD') {
      response.end();
    } else {
      Readable.fromWeb(upstreamResponse.body).pipe(response);
    }
  } finally {
    clearTimeout(timeout);
    request.off('aborted', onClose);
  }
}

export function startServer() {
  return http
    .createServer((request, response) => {
      proxyRequest(request, response).catch((error) => {
        console.error(JSON.stringify({ event: 'proxy_failed', message: error.message }));
        if (!response.headersSent) response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Bad Gateway');
      });
    })
    .listen(listenPort, '0.0.0.0');
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) startServer();
