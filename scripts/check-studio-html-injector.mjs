import assert from 'node:assert/strict';
import test from 'node:test';
import { injectTenantHead, normalizeHost } from '../deploy/production/studio-html-injector.mjs';

const shell = `<!doctype html><html><head>
<title>Ace Data Cloud - AI Studio</title>
<meta name="slack-app-id" content="official">
<meta name="description" content="Ace default">
<meta name="keywords" content="Ace,AI">
<meta property="og:title" content="Ace Data Cloud - AI Studio">
<meta property="og:description" content="Ace default">
<meta property="og:image" content="https://platform.acedata.cloud/api/v1/og/__OG_HOST__.png">
<meta name="twitter:title" content="Ace Data Cloud - AI Studio">
<link rel="canonical" href="https://studio.acedata.cloud/">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head><body></body></html>`;

function count(value, needle) {
  return value.split(needle).length - 1;
}

test('injects escaped tenant metadata into the raw HTML response', () => {
  const output = injectTenantHead(
    shell,
    {
      title: 'FOY-AI & Studio',
      description: 'Create <brands> "fast"',
      keywords: ['FOY', 'AI tools'],
      favicon: 'https://cdn.example.com/favicon?a=1&b=2',
      image: 'https://platform.acedata.cloud/api/v1/og/foyai.foytea.com.png'
    },
    'https://foyai.foytea.com/pricing?share_check=1'
  );

  assert.match(output, /<title>FOY-AI &amp; Studio<\/title>/);
  assert.match(output, /name="description" content="Create &lt;brands&gt; &quot;fast&quot;"/);
  assert.match(output, /property="og:url" content="https:\/\/foyai\.foytea\.com\/pricing"/);
  assert.match(output, /rel="canonical" href="https:\/\/foyai\.foytea\.com\/pricing"/);
  assert.match(output, /favicon\?a=1&amp;b=2/);
  assert.equal(count(output, 'property="og:title"'), 1);
  assert.doesNotMatch(output, /Ace Data Cloud|slack-app-id|share_check/);
});

test('fails closed to hostname without platform metadata leakage', () => {
  const output = injectTenantHead(shell, null, 'https://tenant.example.com/');
  assert.match(output, /<title>tenant\.example\.com<\/title>/);
  assert.match(output, /property="og:title" content="tenant\.example\.com"/);
  assert.doesNotMatch(output, /Ace Data Cloud|Ace default|slack-app-id|rel="icon"|apple-touch-icon/);
  assert.doesNotMatch(output, /name="description"|name="keywords"|og:description|twitter:description/);
});

test('drops unsafe favicon URLs', () => {
  const output = injectTenantHead(
    shell,
    { title: 'Tenant', favicon: 'javascript:alert(1)' },
    'https://tenant.example.com/'
  );
  assert.doesNotMatch(output, /rel="icon"|apple-touch-icon|javascript:/);
});

test('normalizes valid hosts and rejects unsafe host input', () => {
  assert.equal(normalizeHost('FOYAI.FOYTEA.COM.:443'), 'foyai.foytea.com');
  for (const value of ['', 'localhost', 'user@example.com', 'example.com/path', 'example.com:bad'])
    assert.equal(normalizeHost(value), '');
});
