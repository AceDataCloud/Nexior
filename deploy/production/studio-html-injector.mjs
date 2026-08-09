import http from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';

const listenPort = Number(process.env.PORT || 3000);
const upstream = process.env.STUDIO_UPSTREAM || 'http://studio-frontend.acedatacloud.svc.cluster.local:8085';
const siteApi = process.env.SITE_API || 'https://platform.acedata.cloud/api/v1/sites/';
const cacheTtlMs = Number(process.env.SITE_CACHE_TTL_MS || 60_000);
const staleTtlMs = Number(process.env.SITE_STALE_TTL_MS || 300_000);
const siteCache = new Map();

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

function validHost(rawHost) {
  const host = String(rawHost || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)
    ? host
    : '';
}

function replaceTitle(html, title) {
  const tag = `<title>${escapeText(title)}</title>`;
  const stripped = html.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '');
  return stripped.replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${tag}`);
}

function replaceMeta(html, attribute, key, content) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*(["'])${escapedKey}\\1)[^>]*>\\s*`, 'gi');
  const tag = `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />`;
  return html.replace(matcher, '').replace(/<\/head\s*>/i, `    ${tag}\n  </head>`);
}

function replaceLink(html, relation, href) {
  const escapedRelation = relation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`<link\\b(?=[^>]*\\brel\\s*=\\s*(["'])${escapedRelation}\\1)[^>]*>\\s*`, 'gi');
  const tag = `<link rel="${escapeAttribute(relation)}" href="${escapeAttribute(href)}" />`;
  return html.replace(matcher, '').replace(/<\/head\s*>/i, `    ${tag}\n  </head>`);
}

export function injectTenantHead(html, site, requestUrl) {
  const url = new URL(requestUrl);
  const host = validHost(url.hostname);
  if (!host) return html;

  const title = String(site?.title || host).trim() || host;
  const description = String(site?.description || '').trim();
  const keywords = Array.isArray(site?.keywords) ? site.keywords.filter(Boolean).join(', ') : '';
  const favicon = String(site?.favicon || '').trim();
  const canonical = `${url.origin}${url.pathname}`;
  const shareImage = `https://platform.acedata.cloud/api/v1/og/${encodeURIComponent(host)}.png`;

  let result = replaceTitle(html, title);
  result = result.replace(/<meta\b(?=[^>]*\bname\s*=\s*(["'])slack-app-id\1)[^>]*>\s*/gi, '');
  result = replaceMeta(result, 'name', 'description', description);
  result = replaceMeta(result, 'name', 'keywords', keywords);
  result = replaceMeta(result, 'property', 'og:type', 'website');
  result = replaceMeta(result, 'property', 'og:site_name', title);
  result = replaceMeta(result, 'property', 'og:title', title);
  result = replaceMeta(result, 'property', 'og:description', description);
  result = replaceMeta(result, 'property', 'og:url', canonical);
  result = replaceMeta(result, 'property', 'og:image', shareImage);
  result = replaceMeta(result, 'name', 'twitter:card', 'summary_large_image');
  result = replaceMeta(result, 'name', 'twitter:title', title);
  result = replaceMeta(result, 'name', 'twitter:description', description);
  result = replaceMeta(result, 'name', 'twitter:image', shareImage);
  result = replaceLink(result, 'canonical', canonical);

  // A missing tenant favicon must not fall back to Ace Data Cloud's icon.
  result = result.replace(/<link\b(?=[^>]*\brel\s*=\s*(["'])(?:shortcut\s+)?icon\1)[^>]*>\s*/gi, '');
  result = result.replace(/<link\b(?=[^>]*\brel\s*=\s*(["'])apple-touch-icon\1)[^>]*>\s*/gi, '');
  if (favicon) {
    result = replaceLink(result, 'icon', favicon);
    result = replaceLink(result, 'apple-touch-icon', favicon);
  }
  return result;
}

async function fetchSite(host) {
  const now = Date.now();
  const cached = siteCache.get(host);
  if (cached && cached.expiresAt > now) return cached.site;

  try {
    const response = await fetch(`${siteApi}?origin=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(3_000),
      headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`site lookup returned ${response.status}`);
    const payload = await response.json();
    const site = Array.isArray(payload?.items) ? payload.items[0] || null : null;
    siteCache.set(host, { site, expiresAt: now + cacheTtlMs, staleUntil: now + staleTtlMs });
    return site;
  } catch (error) {
    if (cached && cached.staleUntil > now) return cached.site;
    console.error(JSON.stringify({ event: 'site_lookup_failed', host, message: error.message }));
    return null;
  }
}

function copyResponseHeaders(response, outgoing, transformed) {
  for (const [name, value] of response.headers) {
    const lower = name.toLowerCase();
    if (['connection', 'content-length', 'content-encoding', 'transfer-encoding'].includes(lower)) continue;
    outgoing.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie?.() || [];
  if (cookies.length) outgoing.setHeader('set-cookie', cookies);
  if (transformed) {
    outgoing.setHeader('cache-control', 'no-cache, no-store, max-age=0, must-revalidate');
    outgoing.setHeader('vary', 'Host, Accept-Encoding');
  }
}

async function proxyRequest(request, response) {
  const host = validHost(request.headers.host);
  if (!host) {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Invalid Host');
    return;
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined && !['connection', 'content-length', 'host'].includes(name.toLowerCase())) {
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  headers.set('host', host);
  headers.set('accept-encoding', 'identity');
  headers.set('x-forwarded-host', host);
  headers.set('x-forwarded-proto', 'https');

  const method = request.method || 'GET';
  const upstreamResponse = await fetch(new URL(request.url || '/', upstream), {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method) ? undefined : Readable.toWeb(request),
    duplex: ['GET', 'HEAD'].includes(method) ? undefined : 'half',
    redirect: 'manual',
    signal: AbortSignal.timeout(300_000)
  });
  const contentType = upstreamResponse.headers.get('content-type') || '';
  const isHtml = method === 'GET' && upstreamResponse.ok && contentType.toLowerCase().includes('text/html');

  response.statusCode = upstreamResponse.status;
  copyResponseHeaders(upstreamResponse, response, isHtml);
  if (isHtml) {
    const [html, site] = await Promise.all([upstreamResponse.text(), fetchSite(host)]);
    response.end(injectTenantHead(html, site, `https://${host}${request.url || '/'}`));
    return;
  }
  if (!upstreamResponse.body || method === 'HEAD') {
    response.end();
    return;
  }
  Readable.fromWeb(upstreamResponse.body).pipe(response);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
