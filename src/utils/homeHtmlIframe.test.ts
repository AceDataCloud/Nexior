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
  it('wraps fragments with locale context and an intrinsic resize bridge', () => {
    const source = '<button onclick="run()">Run</button>';
    const document = buildHomeHtmlIframeDocument(source, 'zh-CN');

    expect(document).toContain('<html lang="zh-CN" dir="ltr" data-lang="zh-CN" data-theme="light">');
    expect(document).toContain("Object.defineProperty(window, '__ACEDATACLOUD__'");
    expect(document).toContain('"locale":"zh-CN"');
    expect(document).toContain(HOME_HTML_IFRAME_RESIZE_MESSAGE);
    expect(document).toContain(HOME_HTML_IFRAME_MEASURE_MESSAGE);
    expect(document).toContain(source);
    expect(document).not.toContain('root?.scrollHeight');
    expect(document).not.toContain('document.documentElement');
  });

  it('updates locale attributes in a complete document without nesting it', () => {
    const source =
      '<!DOCTYPE html><html lang="en" dir="ltr"><head><style>.x{color:red}</style></head><body>正文</body></html>';
    const document = buildHomeHtmlIframeDocument(source, 'ar');

    expect(document.match(/<!DOCTYPE html>/gi)).toHaveLength(1);
    expect(document.match(/<html\b/gi)).toHaveLength(1);
    expect(document).toContain('<html lang="ar" dir="rtl" data-lang="ar" data-theme="light">');
    expect(document.indexOf('<base target="_top">')).toBeLessThan(document.indexOf('<style>.x{color:red}</style>'));
    expect(document).toContain('"dir":"rtl"');
  });

  it('overrides existing context attributes in a complete document', () => {
    const source = '<html lang="fr" data-lang="fr" data-theme="light" class="custom"><body>Hello</body></html>';
    const document = buildHomeHtmlIframeDocument(source, 'ar', false, 'dark');

    expect(document).toContain('<html class="custom" lang="ar" dir="rtl" data-lang="ar" data-theme="dark">');
    expect(document).toContain('"locale":"ar","dir":"rtl","theme":"dark"');
    expect(document).toContain('html { color-scheme: dark; }');
    expect(document).not.toContain('data-theme="light"');
  });

  it('falls back safely for invalid locales', () => {
    const document = buildHomeHtmlIframeDocument('<p>Body</p>', '</script><script>alert(1)</script>');

    expect(document).toContain('<html lang="en" dir="ltr" data-lang="en" data-theme="light">');
    expect(document).not.toContain('</script><script>alert(1)</script>');
  });

  it('omits the resize bridge for fixed-height frames', () => {
    const document = buildHomeHtmlIframeDocument('<p>Body</p>', 'en', false);

    expect(document).toContain('data-acedatacloud-context');
    expect(document).not.toContain('data-acedatacloud-resize');
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
