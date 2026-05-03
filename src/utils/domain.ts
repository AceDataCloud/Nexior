/**
 * Cookie-scope domain resolution.
 *
 * Replaces a 150 KB `psl` (Public Suffix List) dependency with a small lookup
 * table covering the multi-label public suffixes we actually care about for
 * AceDataCloud cookies (LOCALE / THEME / INVITER_ID across our own subdomains).
 *
 * Anything not in {@link MULTI_LABEL_PUBLIC_SUFFIXES} falls back to a
 * "last two labels" rule, which is what `psl` would also return for any
 * single-label TLD (`acedata.cloud`, `example.com`, …).
 */

/**
 * Common second-level public suffixes that need three-segment treatment, e.g.
 * `foo.co.uk` → registrable domain is `foo.co.uk`, not `co.uk`.
 *
 * Curated to cover the country-code TLDs realistic for our user base. If a new
 * locale shows up that uses a multi-label TLD not listed here, cookies will
 * still work but they'll be scoped to the full host instead of being shared
 * across subdomains — add the suffix here to fix that.
 */
const MULTI_LABEL_PUBLIC_SUFFIXES = new Set<string>([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'co.jp',
  'or.jp',
  'ne.jp',
  'ac.jp',
  'go.jp',
  'ad.jp',
  'ed.jp',
  'gr.jp',
  'lg.jp',
  'co.kr',
  'or.kr',
  'ne.kr',
  'go.kr',
  're.kr',
  'pe.kr',
  'es.kr',
  'sc.kr',
  'hs.kr',
  'ms.kr',
  'co.in',
  'org.in',
  'net.in',
  'firm.in',
  'gen.in',
  'ind.in',
  'ac.in',
  'edu.in',
  'res.in',
  'gov.in',
  'co.id',
  'or.id',
  'ac.id',
  'web.id',
  'sch.id',
  'go.id',
  'mil.id',
  'net.id',
  'biz.id',
  'co.za',
  'org.za',
  'net.za',
  'web.za',
  'gov.za',
  'ac.za',
  'co.nz',
  'org.nz',
  'net.nz',
  'ac.nz',
  'school.nz',
  'govt.nz',
  'co.il',
  'org.il',
  'net.il',
  'ac.il',
  'gov.il',
  'muni.il',
  'idf.il',
  'co.th',
  'or.th',
  'ac.th',
  'go.th',
  'in.th',
  'mi.th',
  'net.th',
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'edu.cn',
  'ac.cn',
  'mil.cn',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'asn.au',
  'id.au',
  'com.br',
  'net.br',
  'org.br',
  'gov.br',
  'edu.br',
  'com.mx',
  'org.mx',
  'gob.mx',
  'edu.mx',
  'com.ar',
  'org.ar',
  'gob.ar',
  'edu.ar',
  'net.ar',
  'com.tr',
  'net.tr',
  'org.tr',
  'edu.tr',
  'gov.tr',
  'gen.tr',
  'biz.tr',
  'com.tw',
  'org.tw',
  'net.tw',
  'edu.tw',
  'gov.tw',
  'idv.tw',
  'mil.tw',
  'game.tw',
  'com.hk',
  'org.hk',
  'net.hk',
  'edu.hk',
  'gov.hk',
  'idv.hk',
  'com.sg',
  'org.sg',
  'net.sg',
  'edu.sg',
  'gov.sg',
  'per.sg',
  'com.my',
  'org.my',
  'net.my',
  'gov.my',
  'edu.my',
  'mil.my',
  'com.vn',
  'net.vn',
  'org.vn',
  'edu.vn',
  'gov.vn',
  'biz.vn',
  'pro.vn',
  'name.vn',
  'com.ph',
  'net.ph',
  'org.ph',
  'gov.ph',
  'edu.ph',
  'com.pk',
  'net.pk',
  'org.pk',
  'edu.pk',
  'gov.pk',
  'com.ru',
  'net.ru',
  'org.ru',
  'pp.ru',
  'msk.ru',
  'spb.ru',
  'com.ua',
  'net.ua',
  'org.ua',
  'gov.ua',
  'edu.ua',
  'kiev.ua',
  'com.ng',
  'net.ng',
  'org.ng',
  'gov.ng',
  'edu.ng',
  'co.ke',
  'or.ke',
  'ne.ke',
  'go.ke',
  'ac.ke',
  'sc.ke',
  'co.tz',
  'or.tz',
  'ne.tz',
  'go.tz',
  'ac.tz',
  'sc.tz',
  'co.ug',
  'or.ug',
  'ne.ug',
  'go.ug',
  'ac.ug',
  'sc.ug'
]);

const isIpLike = (host: string): boolean => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || /^\[[0-9a-f:]+\]$/i.test(host);

/**
 * Compute the cookie-scope domain for the given host (defaults to current page).
 *
 * - Returns `host` unchanged for IP literals, `localhost`, single-label hosts,
 *   or hosts that already equal the registrable domain.
 * - Otherwise returns the registrable domain prefixed with `.` so cookies are
 *   shared across subdomains (e.g. `auth.acedata.cloud` → `.acedata.cloud`).
 */
export const getDomain = (host: string = window.location.hostname): string => {
  if (!host || host === 'localhost' || isIpLike(host)) {
    return host;
  }
  const labels = host.split('.');
  if (labels.length < 2) {
    return host;
  }
  let registrable: string;
  if (labels.length >= 3 && MULTI_LABEL_PUBLIC_SUFFIXES.has(labels.slice(-2).join('.'))) {
    registrable = labels.slice(-3).join('.');
  } else {
    registrable = labels.slice(-2).join('.');
  }
  if (registrable === host) {
    return host;
  }
  return '.' + registrable;
};
