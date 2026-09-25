import { describe, expect, it } from 'vitest';
import {
  buildHomeHtmlIframeDocument,
  HOME_HTML_IFRAME_MAX_HEIGHT,
  HOME_HTML_IFRAME_MEASURE_MESSAGE,
  HOME_HTML_IFRAME_MIN_HEIGHT,
  HOME_HTML_IFRAME_RESIZE_MESSAGE,
  HOME_HTML_IFRAME_SANDBOX,
  homeHtmlIframeHeight
} from './homeHtmlIframe';

describe('homeHtmlIframe', () => {
  it('wraps HTML fragments with an isolated document and resize bridge', () => {
    const source = '<button onclick="document.body.dataset.clicked=\'yes\'">Run</button><script>run()</script>';
    const document = buildHomeHtmlIframeDocument(source);

    expect(document).toContain('<base target="_top">');
    expect(document).toContain(HOME_HTML_IFRAME_RESIZE_MESSAGE);
    expect(document).toContain(HOME_HTML_IFRAME_MEASURE_MESSAGE);
    expect(document).toContain(source);
  });

  it('injects the bridge into a complete document without nesting it', () => {
    const source =
      '<!DOCTYPE html><html lang="zh-CN"><head><style>.x{color:red}</style></head><body>正文</body></html>';
    const document = buildHomeHtmlIframeDocument(source);

    expect(document.match(/<!DOCTYPE html>/gi)).toHaveLength(1);
    expect(document.match(/<html\b/gi)).toHaveLength(1);
    expect(document.indexOf('<base target="_top">')).toBeLessThan(document.indexOf('<style>.x{color:red}</style>'));
    expect(document).toContain('<body>正文</body>');
  });

  it('allows scripts without granting access to the parent origin', () => {
    expect(HOME_HTML_IFRAME_SANDBOX).toContain('allow-scripts');
    expect(HOME_HTML_IFRAME_SANDBOX).toContain('allow-top-navigation-by-user-activation');
    expect(HOME_HTML_IFRAME_SANDBOX).not.toContain('allow-same-origin');
  });

  it('accepts only bounded resize messages', () => {
    expect(homeHtmlIframeHeight({ type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 640.2 })).toBe(641);
    expect(homeHtmlIframeHeight({ type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 1 })).toBe(
      HOME_HTML_IFRAME_MIN_HEIGHT
    );
    expect(homeHtmlIframeHeight({ type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 99_999 })).toBe(
      HOME_HTML_IFRAME_MAX_HEIGHT
    );
    expect(homeHtmlIframeHeight({ type: 'other', height: 640 })).toBeNull();
    expect(homeHtmlIframeHeight({ type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: '640' })).toBeNull();
  });
});
