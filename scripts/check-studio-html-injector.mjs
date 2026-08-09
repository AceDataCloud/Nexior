import assert from 'node:assert/strict';
import test from 'node:test';
import { injectTenantHead } from '../deploy/production/studio-html-injector.mjs';

const shell = `<!doctype html><html><head>
<title>Ace Data Cloud - AI Hub</title>
<meta name="description" content="Ace default">
<meta property="og:title" content="Ace Data Cloud - AI Hub">
<meta property="og:description" content="Ace default">
<meta property="og:image" content="https://platform.acedata.cloud/api/v1/og/__OG_HOST__.png">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head><body></body></html>`;

test('injects tenant title, description, Open Graph, canonical and favicon into raw HTML', () => {
  const output = injectTenantHead(
    shell,
    {
      title: '知数云 & Knowledge Cloud',
      description: '一站式 AI <能力>平台',
      keywords: ['知数云', 'AI API'],
      favicon: 'https://cdn.example.com/favicon?a=1&b=2'
    },
    'https://studio.zhishuyun.com/pricing?campaign=test'
  );

  assert.match(output, /<title>知数云 &amp; Knowledge Cloud<\/title>/);
  assert.match(output, /name="description" content="一站式 AI &lt;能力&gt;平台"/);
  assert.match(output, /property="og:title" content="知数云 &amp; Knowledge Cloud"/);
  assert.match(output, /property="og:url" content="https:\/\/studio\.zhishuyun\.com\/pricing"/);
  assert.match(
    output,
    /property="og:image" content="https:\/\/platform\.acedata\.cloud\/api\/v1\/og\/studio\.zhishuyun\.com\.png"/
  );
  assert.match(output, /rel="canonical" href="https:\/\/studio\.zhishuyun\.com\/pricing"/);
  assert.match(output, /rel="icon" href="https:\/\/cdn\.example\.com\/favicon\?a=1&amp;b=2"/);
  assert.doesNotMatch(output, /Ace Data Cloud/);
  assert.doesNotMatch(output, /\/favicon\.ico/);
});

test('fails closed to the tenant hostname when site lookup is unavailable', () => {
  const output = injectTenantHead(shell, null, 'https://tenant.example.com/');
  assert.match(output, /<title>tenant\.example\.com<\/title>/);
  assert.match(output, /property="og:title" content="tenant\.example\.com"/);
  assert.doesNotMatch(output, /Ace Data Cloud/);
  assert.doesNotMatch(output, /rel="icon"/);
});

test('rejects an invalid host without modifying the document', () => {
  assert.equal(injectTenantHead(shell, { title: 'Tenant' }, 'https://localhost/'), shell);
});
