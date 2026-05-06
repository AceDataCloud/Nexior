import { describe, expect, it } from 'vitest';

import { getDomain } from './domain';

/**
 * Tests for the cookie-scope domain resolver.
 *
 * NOTE: Behaviour is intentionally a tight subset of `psl` (the Public Suffix
 * List). For any host whose effective TLD is NOT in the curated multi-label
 * suffix table, we fall back to the "last two labels" rule. The test cases
 * below document exactly which inputs that affects so we can review the
 * trade-off when adding/removing entries.
 */
describe('getDomain', () => {
  describe('AceDataCloud production hosts (single-label TLD)', () => {
    // These are the hosts the app actually runs on. They MUST resolve to
    // `.acedata.cloud` so that LOCALE/THEME/INVITER_ID cookies are shared
    // across all subdomains. Behaviour is identical to the previous `psl`
    // implementation for every one of these.
    it.each([
      ['hub.acedata.cloud', '.acedata.cloud'],
      ['auth.acedata.cloud', '.acedata.cloud'],
      ['platform.acedata.cloud', '.acedata.cloud'],
      ['api.acedata.cloud', '.acedata.cloud'],
      ['studio.acedata.cloud', '.acedata.cloud'],
      ['hub-test.acedata.cloud', '.acedata.cloud'],
      ['dify.acedata.cloud', '.acedata.cloud'],
      ['docs.acedata.cloud', '.acedata.cloud'],
      // Wechat-browser sub-domain detour (`<YYYYMMDD>.hub.acedata.cloud`).
      ['20240802.hub.acedata.cloud', '.acedata.cloud'],
      ['20260503.hub.acedata.cloud', '.acedata.cloud'],
      // Hypothetical 4+ label case — still collapses to registrable.
      ['dev.20240802.hub.acedata.cloud', '.acedata.cloud']
    ])('%s → %s', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('apex domain (already the registrable root)', () => {
    // For the apex itself we return the host unchanged — `setCookie` will
    // then default-scope the cookie to the host (and host-only cookies are
    // sent to subdomains that share it as a parent in some browsers, but
    // that's a setCookie concern, not ours).
    it.each([
      ['acedata.cloud'],
      ['example.com'],
      ['google.com'],
      ['baidu.com'],
      ['github.io'] // see "private suffixes" below for nuance
    ])('%s → unchanged', (host) => {
      expect(getDomain(host)).toBe(host);
    });
  });

  describe('local / dev / IP / single-label hosts', () => {
    // Browsers reject cookies whose Domain attribute is an IP literal or
    // `localhost`; just return the host unchanged so the caller can either
    // omit the Domain attribute or accept a no-op.
    it.each([
      ['localhost', 'localhost'],
      ['127.0.0.1', '127.0.0.1'],
      ['10.0.0.1', '10.0.0.1'],
      ['192.168.1.1', '192.168.1.1'],
      ['255.255.255.255', '255.255.255.255'],
      ['[::1]', '[::1]'],
      ['[fe80::1]', '[fe80::1]'],
      ['intranet', 'intranet'], // single-label corporate intranet hostname
      ['', ''], // pathological: empty input
      ['com', 'com'] // pathological: TLD only
    ])('%s → %s', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('common single-label country-code TLDs (covered by 2-label fallback)', () => {
    // The fallback rule (`registrable = last two labels`) is correct for ALL
    // single-label public suffixes, which covers most ccTLDs in our user
    // base: .de, .fr, .it, .nl, .es, .ca, .us, .io, .ai, .me, .se, .pl, …
    it.each([
      ['app.example.de', '.example.de'],
      ['shop.boutique.fr', '.boutique.fr'],
      ['blog.example.it', '.example.it'],
      ['x.example.nl', '.example.nl'],
      ['x.example.es', '.example.es'],
      ['x.example.ca', '.example.ca'],
      ['x.example.us', '.example.us'],
      ['x.example.io', '.example.io'],
      ['x.example.ai', '.example.ai'],
      ['x.example.me', '.example.me'],
      ['x.example.se', '.example.se'],
      ['x.example.pl', '.example.pl'],
      ['x.example.no', '.example.no'],
      ['x.example.fi', '.example.fi'],
      ['x.example.dk', '.example.dk'],
      ['x.example.at', '.example.at'],
      ['x.example.be', '.example.be']
    ])('%s → %s', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('multi-label public suffixes that ARE in our curated list', () => {
    // Verified against `psl.parse()` to behave identically.
    it.each([
      // United Kingdom
      ['app.example.co.uk', '.example.co.uk'],
      ['x.example.org.uk', '.example.org.uk'],
      ['x.foo.bar.co.uk', '.bar.co.uk'],
      // Japan
      ['app.example.co.jp', '.example.co.jp'],
      ['x.example.or.jp', '.example.or.jp'],
      // Korea
      ['app.example.co.kr', '.example.co.kr'],
      // China
      ['app.mywebsite.com.cn', '.mywebsite.com.cn'],
      ['x.example.org.cn', '.example.org.cn'],
      // Australia
      ['app.example.com.au', '.example.com.au'],
      ['x.example.net.au', '.example.net.au'],
      // New Zealand
      ['app.example.co.nz', '.example.co.nz'],
      // Brazil
      ['app.example.com.br', '.example.com.br'],
      // India
      ['app.example.co.in', '.example.co.in'],
      // Mexico
      ['app.example.com.mx', '.example.com.mx'],
      // Argentina
      ['app.example.com.ar', '.example.com.ar'],
      // Turkey
      ['app.example.com.tr', '.example.com.tr'],
      // Taiwan
      ['app.example.com.tw', '.example.com.tw'],
      // Hong Kong
      ['app.example.com.hk', '.example.com.hk'],
      // Singapore
      ['app.example.com.sg', '.example.com.sg'],
      // Malaysia
      ['app.example.com.my', '.example.com.my'],
      // Vietnam
      ['app.example.com.vn', '.example.com.vn'],
      // Philippines
      ['app.example.com.ph', '.example.com.ph'],
      // South Africa
      ['app.example.co.za', '.example.co.za'],
      // Israel
      ['app.example.co.il', '.example.co.il'],
      // Russia
      ['app.example.com.ru', '.example.com.ru'],
      // Ukraine
      ['app.example.com.ua', '.example.com.ua'],
      // Indonesia
      ['app.example.co.id', '.example.co.id'],
      // Thailand
      ['app.example.co.th', '.example.co.th']
    ])('%s → %s', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('multi-label public suffixes that are NOT in our list (documented fallback)', () => {
    // For obscure ccTLDs (Cook Islands `.co.ck`, Bangladesh `.com.bd`,
    // Falkland Islands `.co.fk`, Crown Dependencies `.co.gg`/`.co.je`, …),
    // the fallback over-collapses: e.g. `example.co.ck` → `.co.ck` instead
    // of the correct `example.co.ck`. The browser will silently REJECT a
    // cookie whose Domain is a public suffix, so the practical effect is
    // "cookie not set on this hostname" rather than a misrouted cookie.
    //
    // None of these TLDs are realistic for AceDataCloud's user base. If
    // someone forks Nexior to one of them, the fix is to add the suffix
    // to MULTI_LABEL_PUBLIC_SUFFIXES in `domain.ts`.
    it.each([
      ['app.example.co.ck', '.co.ck'],
      ['app.example.co.fk', '.co.fk'],
      ['app.example.com.bd', '.com.bd'],
      ['app.example.gov.bd', '.gov.bd']
    ])('%s → %s (over-collapse: cookie will be rejected, no security impact)', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('private/cloud hosting suffixes (documented fallback)', () => {
    // Hosting providers (`*.netlify.app`, `*.vercel.app`, `*.herokuapp.com`,
    // `*.appspot.com`, `*.cloudfront.net`, `*.amazonaws.com`, `*.github.io`)
    // register their own zone on the PSL as a "private" suffix so each
    // tenant's deployment is treated as a registrable boundary.
    //
    // We deliberately do NOT track these: AceDataCloud is hosted on
    // self-owned `acedata.cloud` (single-label TLD), so the issue is moot.
    // For a forked deployment on `*.vercel.app`, our `getDomain` would scope
    // cookies to `.vercel.app` (shared with every other Vercel app), which
    // browsers reject for `.app` directly but accept for `.vercel.app`.
    //
    // The cookies stored here (LOCALE, THEME, INVITER_ID) are non-sensitive
    // — locale/theme are user prefs, INVITER_ID is a 7-day affiliate marker
    // already publicly visible in URL params. Worst case for a forked Vercel
    // deployment: another Vercel app could read/spoof these, with no
    // consequence beyond a wrong default theme/locale or a stale inviter id.
    //
    // If someone forks Nexior onto a public hosting suffix and treats those
    // cookies as security-sensitive, the fix is to add the suffix to
    // MULTI_LABEL_PUBLIC_SUFFIXES (or scope the cookie to the host instead).
    it.each([
      ['my-app.netlify.app', '.netlify.app'],
      ['my-app.vercel.app', '.vercel.app'],
      ['my-app.herokuapp.com', '.herokuapp.com'],
      ['my-app.appspot.com', '.appspot.com'],
      ['my-cdn.cloudfront.net', '.cloudfront.net'],
      ['my-bucket.s3.amazonaws.com', '.amazonaws.com'],
      ['user.github.io', '.github.io']
    ])('%s → %s (private suffix: not relevant for AceDataCloud production)', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('IDN / punycode hostnames', () => {
    // We don't decode punycode — `psl` does, but the cookie-domain string we
    // hand `setCookie` is the encoded form anyway, so behaviour is identical.
    it.each([
      ['xn--fsq.com', 'xn--fsq.com'],
      ['app.xn--fsq.com', '.xn--fsq.com'],
      ['xn--bcher-kva.example', 'xn--bcher-kva.example']
    ])('%s → %s', (host, expected) => {
      expect(getDomain(host)).toBe(expected);
    });
  });

  describe('default argument', () => {
    // When called with no argument, the function reads
    // `window.location.hostname`. The default param is evaluated at CALL
    // time, so a tiny stub is enough — no jsdom/happy-dom required.
    it('reads window.location.hostname when called with no argument', () => {
      const stubbed = (globalThis as unknown as { window?: unknown }).window === undefined;
      if (stubbed) {
        (globalThis as unknown as { window: { location: { hostname: string } } }).window = {
          location: { hostname: 'hub.acedata.cloud' }
        };
      } else {
        // jsdom-like env: mutate the existing one.
        Object.defineProperty(window.location, 'hostname', {
          value: 'hub.acedata.cloud',
          configurable: true
        });
      }
      try {
        expect(getDomain()).toBe('.acedata.cloud');
      } finally {
        if (stubbed) {
          delete (globalThis as unknown as { window?: unknown }).window;
        }
      }
    });
  });
});
