export const HOME_HTML_IFRAME_RESIZE_MESSAGE = 'acedatacloud:home-html-iframe-resize';
export const HOME_HTML_IFRAME_MEASURE_MESSAGE = 'acedatacloud:home-html-iframe-measure';
export const HOME_HTML_IFRAME_MIN_HEIGHT = 160;
export const HOME_HTML_IFRAME_MAX_HEIGHT = 12_000;
export const HOME_HTML_IFRAME_SANDBOX = [
  'allow-scripts',
  'allow-forms',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-top-navigation-by-user-activation'
].join(' ');

const RTL_LANGUAGES = new Set(['ar']);
export const normalizeHomeLocale = (locale: string): string => {
  const normalized = locale.trim().replace('_', '-').slice(0, 35);
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(normalized) ? normalized : 'en';
};
export const homeLocaleDirection = (locale: string): 'ltr' | 'rtl' =>
  RTL_LANGUAGES.has(locale.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr';
export type HomeTheme = 'light' | 'dark';
const scriptJson = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .split(String.fromCharCode(0x2028))
    .join('\\u2028')
    .split(String.fromCharCode(0x2029))
    .join('\\u2029');

const resizeBridge = `<script data-acedatacloud-resize>
(() => {
  let pendingFrame = 0;
  let lastHeight = -1;
  let observed = new Set();
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule());
  const isFixed = (element) => {
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (getComputedStyle(current).position === 'fixed') return true;
    }
    return false;
  };
  const measure = () => {
    pendingFrame = 0;
    const body = document.body;
    if (!body) return;
    const bodyStyle = getComputedStyle(body);
    const bodyTop = body.getBoundingClientRect().top;
    const paddingBottom = parseFloat(bodyStyle.paddingBottom) || 0;
    let bottom = bodyTop + (parseFloat(bodyStyle.paddingTop) || 0) + paddingBottom;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!element || isFixed(element)) continue;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const range = document.createRange();
      if (node.nodeType === Node.TEXT_NODE) range.selectNodeContents(node);
      const rect = node.nodeType === Node.TEXT_NODE ? range.getBoundingClientRect() : element.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      const margin = node.nodeType === Node.ELEMENT_NODE ? Math.max(0, parseFloat(style.marginBottom) || 0) : 0;
      bottom = Math.max(bottom, rect.bottom + margin + paddingBottom);
    }
    const height = Math.max(1, Math.ceil(bottom - bodyTop));
    if (height === lastHeight) return;
    lastHeight = height;
    parent.postMessage({ type: '${HOME_HTML_IFRAME_RESIZE_MESSAGE}', height }, '*');
  };
  const schedule = () => {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(measure);
  };
  const observeContent = () => {
    if (!observer || !document.body) return;
    const current = new Set(document.body.children);
    for (const element of current) {
      if (!observed.has(element)) observer.observe(element);
    }
    for (const element of observed) {
      if (!current.has(element)) observer.unobserve(element);
    }
    observed = current;
  };
  const start = () => {
    observeContent();
    schedule();
    setTimeout(schedule, 100);
    setTimeout(schedule, 500);
    new MutationObserver(() => {
      observeContent();
      schedule();
    }).observe(document.body, { attributes: true, characterData: true, childList: true, subtree: true });
    addEventListener('load', schedule, true);
    document.fonts?.ready.then(schedule);
    addEventListener('message', (event) => {
      if (event.source === parent && event.data?.type === '${HOME_HTML_IFRAME_MEASURE_MESSAGE}') schedule();
    });
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
</script>`;

const contextScript = (
  locale: string,
  dir: 'ltr' | 'rtl',
  theme: HomeTheme
): string => `<script data-acedatacloud-context>
Object.defineProperty(window, '__ACEDATACLOUD__', {
  value: Object.freeze(${scriptJson({ locale, dir, theme })}),
  writable: false,
  configurable: false
});
</script>`;

const headContent = (
  locale: string,
  dir: 'ltr' | 'rtl',
  theme: HomeTheme,
  autoResize: boolean
): string => `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_top">
<style data-acedatacloud-frame>
html { color-scheme: ${theme}; }
html, body { width: 100%; height: auto !important; min-height: 0 !important; margin: 0; overflow-x: hidden; }
*, *::before, *::after { box-sizing: border-box; }
img, video, svg, canvas, iframe { max-width: 100%; }
</style>
${contextScript(locale, dir, theme)}
${autoResize ? resizeBridge : ''}`;

const injectAfterOpeningTag = (source: string, tag: string, content: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>`, 'i').exec(source);
  if (!match || match.index === undefined) return source;
  const offset = match.index + match[0].length;
  return `${source.slice(0, offset)}${content}${source.slice(offset)}`;
};

const applyHtmlContext = (source: string, locale: string, dir: 'ltr' | 'rtl', theme: HomeTheme): string =>
  source.replace(/<html\b([^>]*)>/i, (_tag, attributes: string) => {
    const cleaned = attributes.replace(/\s(?:lang|dir|data-lang|data-theme)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<html${cleaned} lang="${locale}" dir="${dir}" data-lang="${locale}" data-theme="${theme}">`;
  });

export const buildHomeHtmlIframeDocument = (
  source: string,
  requestedLocale = 'en',
  autoResize = true,
  theme: HomeTheme = 'light'
): string => {
  const locale = normalizeHomeLocale(requestedLocale);
  const dir = homeLocaleDirection(locale);
  if (!/<html\b[^>]*>/i.test(source)) {
    return `<!DOCTYPE html><html lang="${locale}" dir="${dir}" data-lang="${locale}" data-theme="${theme}"><head>${headContent(locale, dir, theme, autoResize)}</head><body>${source}</body></html>`;
  }
  const localized = applyHtmlContext(source, locale, dir, theme);
  if (/<head\b[^>]*>/i.test(localized)) {
    return injectAfterOpeningTag(localized, 'head', headContent(locale, dir, theme, autoResize));
  }
  return injectAfterOpeningTag(localized, 'html', `<head>${headContent(locale, dir, theme, autoResize)}</head>`);
};

export const homeHtmlIframeHeight = (data: unknown): number | null => {
  if (!data || typeof data !== 'object') return null;
  const message = data as { type?: unknown; height?: unknown };
  if (message.type !== HOME_HTML_IFRAME_RESIZE_MESSAGE || typeof message.height !== 'number') return null;
  if (!Number.isFinite(message.height)) return null;
  return Math.min(HOME_HTML_IFRAME_MAX_HEIGHT, Math.max(HOME_HTML_IFRAME_MIN_HEIGHT, Math.ceil(message.height)));
};
