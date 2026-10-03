import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import vm from 'node:vm';
import ts from 'typescript';

function fixture({
  host = 'platform.acedata.cloud',
  fetcher,
  cookies = {},
  denied = false,
  brokenCookies = false
} = {}) {
  const calls = [];
  const initialUrl = `https://${host}/documents/seedance-mcp?utm_source=seedancemcp`;
  const location = { hostname: host, href: initialUrl };
  const context = {
    exports: {},
    URLSearchParams,
    Date,
    Promise,
    Set,
    AbortSignal,
    window: { location },
    navigator: {},
    localStorage: { getItem: () => (denied ? 'denied' : null) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return fetcher ? fetcher(url, options) : { ok: true, json: async () => ({ touch: 'signed-visit' }) };
    },
    require: () => ({
      getCookie: (key) => cookies[key],
      setCookie: (key, value) => {
        cookies[key] = value;
      },
      removeCookie: (key) => {
        if (brokenCookies) throw new Error('cookies disabled');
        delete cookies[key];
      }
    })
  };
  vm.runInNewContext(
    ts.transpileModule(readFileSync('src/utils/marketingTouch.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText,
    context
  );
  const query = new URLSearchParams(
    'utm_source=seedancemcp&utm_medium=readme&utm_campaign=opensource_activation&utm_content=quick_start'
  );
  return { api: context.exports, calls, cookies, location, initialUrl, query };
}

test('missing/offline collection never navigates or binds an old campaign', async () => {
  for (const fetcher of [
    async () => ({ ok: false }),
    async () => {
      throw new Error('offline');
    }
  ]) {
    const f = fixture({ fetcher, cookies: { MARKETING_TOUCH: 'old' } });
    await f.api.captureMarketingTouch(f.query);
    await f.api.bindMarketingTouch('fixture-access');
    assert.equal(f.location.href, f.initialUrl);
    assert.equal(f.cookies.MARKETING_TOUCH, undefined);
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].options.headers.Authorization, undefined);
  }
});

test('duplicate startup captures once and binding waits for the new signed visit', async () => {
  let release;
  const response = new Promise((resolve) => {
    release = resolve;
  });
  const f = fixture({ fetcher: async (url) => (url.endsWith('/visits/') ? response : { ok: true }) });
  const capture = f.api.captureMarketingTouch(f.query);
  const duplicate = f.api.captureMarketingTouch(f.query);
  const bind = f.api.bindMarketingTouch('fixture-access');
  assert.equal(f.calls.length, 1);
  release({ ok: true, json: async () => ({ touch: 'new-signed-visit' }) });
  await Promise.all([capture, duplicate, bind]);
  assert.equal(f.calls.length, 2);
  assert.equal(JSON.parse(f.calls[1].options.body).touch, 'new-signed-visit');
  assert.equal(f.calls[1].options.keepalive, true);
  assert.equal(f.location.href, f.initialUrl);
});

test('a later landing cannot receive the previous campaign response', async () => {
  let release;
  const first = new Promise((resolve) => {
    release = resolve;
  });
  const f = fixture({
    fetcher: async (_url, options) =>
      JSON.parse(options.body).entry === 'seedancemcp' ? first : { ok: true, json: async () => ({ touch: 'newer' }) }
  });
  const old = f.api.captureMarketingTouch(f.query);
  await f.api.captureMarketingTouch(new URLSearchParams('utm_source=sunomcp&utm_campaign=opensource_activation'));
  release({ ok: true, json: async () => ({ touch: 'older' }) });
  await old;
  assert.equal(f.cookies.MARKETING_TOUCH, 'newer');
});

test('custom domains, saved opt-outs and disabled cookies leave navigation untouched', async () => {
  for (const options of [{ host: 'tenant.example' }, { denied: true }, { brokenCookies: true }]) {
    const f = fixture(options);
    await f.api.captureMarketingTouch(f.query);
    await f.api.bindMarketingTouch('fixture-access');
    assert.equal(f.calls.length, 0);
    assert.equal(f.location.href, f.initialUrl);
  }
});
