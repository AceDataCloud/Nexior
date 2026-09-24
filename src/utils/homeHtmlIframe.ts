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

const resizeBridge = `<script data-acedatacloud-resize>
(() => {
  let pendingMeasure = 0;
  const measure = () => {
    pendingMeasure = 0;
    const root = document.documentElement;
    const body = document.body;
    const height = Math.ceil(Math.max(
      root?.scrollHeight || 0,
      root?.offsetHeight || 0,
      body?.scrollHeight || 0,
      body?.offsetHeight || 0
    ));
    parent.postMessage({ type: '${HOME_HTML_IFRAME_RESIZE_MESSAGE}', height }, '*');
  };
  const schedule = () => {
    if (pendingMeasure) clearTimeout(pendingMeasure);
    pendingMeasure = setTimeout(measure, 0);
  };
  const start = () => {
    schedule();
    setTimeout(schedule, 100);
    setTimeout(schedule, 500);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(document.documentElement);
    new MutationObserver(schedule).observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });
    addEventListener('load', schedule);
    addEventListener('message', (event) => {
      if (event.source === parent && event.data?.type === '${HOME_HTML_IFRAME_MEASURE_MESSAGE}') schedule();
    });
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
</script>`;

const headContent = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_top">
<style data-acedatacloud-frame>
html, body { width: 100%; min-height: 1px; margin: 0; overflow-x: hidden; }
*, *::before, *::after { box-sizing: border-box; }
img, video, svg, canvas, iframe { max-width: 100%; }
</style>
${resizeBridge}`;

const injectAfterOpeningTag = (source: string, tag: string, content: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>`, 'i').exec(source);
  if (!match || match.index === undefined) return source;
  const offset = match.index + match[0].length;
  return `${source.slice(0, offset)}${content}${source.slice(offset)}`;
};

export const buildHomeHtmlIframeDocument = (source: string): string => {
  if (!/<html\b[^>]*>/i.test(source)) {
    return `<!DOCTYPE html><html><head>${headContent}</head><body>${source}</body></html>`;
  }
  if (/<head\b[^>]*>/i.test(source)) {
    return injectAfterOpeningTag(source, 'head', headContent);
  }
  return injectAfterOpeningTag(source, 'html', `<head>${headContent}</head>`);
};

export const homeHtmlIframeHeight = (data: unknown): number | null => {
  if (!data || typeof data !== 'object') return null;
  const message = data as { type?: unknown; height?: unknown };
  if (message.type !== HOME_HTML_IFRAME_RESIZE_MESSAGE || typeof message.height !== 'number') return null;
  if (!Number.isFinite(message.height)) return null;
  return Math.min(HOME_HTML_IFRAME_MAX_HEIGHT, Math.max(HOME_HTML_IFRAME_MIN_HEIGHT, Math.ceil(message.height)));
};
