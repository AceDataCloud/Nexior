// @vitest-environment jsdom
import { mount, shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HOME_HTML_IFRAME_RESIZE_MESSAGE } from '@/utils/homeHtmlIframe';
import HomeCustomSections from './HomeCustomSections.vue';
import HomeHtmlSection from './custom/HomeHtmlSection.vue';
import HomeMarkdownSection from './custom/HomeMarkdownSection.vue';
import HomeWebsiteSection from './custom/HomeWebsiteSection.vue';

const site = { id: 'site-1', features: {} };
afterEach(() => document.documentElement.classList.remove('dark'));

describe('HomeCustomSections', () => {
  it('dispatches the Markdown, HTML, and Website renderers', () => {
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        sections: [
          { id: 'markdown', kind: 'markdown', title: 'Markdown', body: '# Content' },
          { id: 'html', kind: 'html', title: 'HTML', body: '<strong>Content</strong>' },
          { id: 'website', kind: 'website', title: 'Website', body: 'https://example.com' }
        ]
      }
    });

    expect(wrapper.findAllComponents({ name: 'HomeMarkdownSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeHtmlSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeWebsiteSection' })).toHaveLength(1);
  });

  it('passes live locale and effective theme to HTML and Website sections', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        locale: 'zh-CN',
        sections: [
          { id: 'html', kind: 'html', title: 'HTML', body: '<p>Hi</p>' },
          { id: 'website', kind: 'website', title: 'Website', body: 'https://example.com' }
        ]
      }
    });
    expect(wrapper.findComponent(HomeHtmlSection).props()).toMatchObject({ locale: 'zh-CN', theme: 'light' });
    expect(wrapper.findComponent(HomeWebsiteSection).props()).toMatchObject({ locale: 'zh-CN', theme: 'light' });

    document.documentElement.classList.add('dark');
    await Promise.resolve();
    await nextTick();
    expect(wrapper.findComponent(HomeHtmlSection).props('theme')).toBe('dark');
    expect(wrapper.findComponent(HomeWebsiteSection).props('theme')).toBe('dark');
    await wrapper.setProps({ locale: 'ar' });
    expect(wrapper.findComponent(HomeWebsiteSection).props('locale')).toBe('ar');
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });

  it('does not render an unknown kind', () => {
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        sections: [{ id: 'bad', kind: 'unknown' as any, title: 'Bad', body: '<script>alert(1)</script>' }]
      }
    });

    expect(wrapper.find('.custom-sections').exists()).toBe(false);
    expect(wrapper.html()).not.toContain('<script>');
  });

  it('forces sanitized Markdown rendering', () => {
    const wrapper = shallowMount(HomeMarkdownSection, {
      props: { section: { kind: 'markdown', title: 'Markdown', body: '<img src=x onerror=alert(1)>' } }
    });

    const markdown = wrapper.getComponent({ name: 'VueMarkdown' });
    expect(markdown.props('sanitize')).toBe(true);
    expect(markdown.props('source')).toBe('<img src=x onerror=alert(1)>');
  });

  it('renders administrator-authored HTML directly', async () => {
    const body = '<section data-custom="yes"><strong>Raw HTML</strong></section>';
    const wrapper = mount(HomeHtmlSection, {
      props: { section: { kind: 'html', title: 'HTML', body } }
    });

    expect(wrapper.get('.tenant-home-content').html()).toContain(body);
    expect(wrapper.get('[data-custom="yes"]').text()).toBe('Raw HTML');
    await wrapper.setProps({ locale: 'ar', theme: 'dark' });
    expect(wrapper.get('.tenant-home-content').attributes()).toMatchObject({
      lang: 'ar',
      dir: 'rtl',
      'data-lang': 'ar',
      'data-theme': 'dark'
    });
  });

  it('scrolls overflowing Markdown and direct HTML within their configured height', () => {
    const markdown = shallowMount(HomeMarkdownSection, {
      props: { section: { kind: 'markdown', title: 'Markdown', body: '# Content', height: 320 } }
    });
    const markdownStyle = markdown.getComponent({ name: 'VueMarkdown' }).attributes('style');
    expect(markdownStyle).toContain('height: 320px');
    expect(markdownStyle).toContain('overflow-y: auto');

    const html = mount(HomeHtmlSection, {
      props: { section: { kind: 'html', title: 'HTML', body: '<p>Content</p>', height: 480 } }
    });
    const contentStyle = html.get('.tenant-home-content').attributes('style');
    expect(contentStyle).toContain('height: 480px');
    expect(contentStyle).toContain('overflow-y: auto');
    expect(html.find('iframe').exists()).toBe(false);
  });

  it('renders Website URLs in a sandboxed iframe with an external fallback', () => {
    const url = 'https://example.com/embed';
    const wrapper = mount(HomeWebsiteSection, {
      props: { section: { kind: 'website', title: 'Website', body: url, render_in_iframe: true } },
      global: { mocks: { $t: (_key: string, values: { host: string }) => `Open ${values.host}` } }
    });
    const iframe = wrapper.get('iframe');
    const link = wrapper.get('a');

    expect(iframe.attributes('src')).toBe(`${url}?lang=en&theme=light`);
    expect(iframe.attributes('srcdoc')).toBeUndefined();
    expect(iframe.attributes('sandbox')).toContain('allow-scripts');
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.attributes('loading')).toBe('lazy');
    expect(iframe.attributes('referrerpolicy')).toBe('no-referrer');
    expect(link.attributes('href')).toBe(`${url}?lang=en&theme=light`);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.text()).toContain('example.com');
  });

  it('replaces stale Website context while preserving other parameters and hash', async () => {
    const body = 'https://example.com/embed?ref=a%20b&lang=old&theme=dark#section';
    const wrapper = mount(HomeWebsiteSection, {
      props: { section: { kind: 'website', title: 'Website', body }, locale: 'zh-CN', theme: 'light' },
      global: { mocks: { $t: () => 'Open externally' } }
    });
    const current = new URL(wrapper.get('iframe').attributes('src')!);
    expect(current.searchParams.get('ref')).toBe('a b');
    expect(current.searchParams.getAll('lang')).toEqual(['zh-CN']);
    expect(current.searchParams.getAll('theme')).toEqual(['light']);
    expect(current.hash).toBe('#section');
    expect(wrapper.get('a').attributes('href')).toBe(current.toString());
    await wrapper.setProps({ locale: 'ar', theme: 'dark' });
    expect(new URL(wrapper.get('iframe').attributes('src')!).searchParams.get('lang')).toBe('ar');
    expect(new URL(wrapper.get('iframe').attributes('src')!).searchParams.get('theme')).toBe('dark');
  });

  it('does not navigate to invalid Website URLs', () => {
    for (const body of ['javascript:alert(1)', '/relative', 'not a url']) {
      const wrapper = mount(HomeWebsiteSection, {
        props: { section: { kind: 'website', title: 'Website', body } }
      });
      expect(wrapper.find('iframe').exists()).toBe(false);
      expect(wrapper.find('a').exists()).toBe(false);
      wrapper.unmount();
    }
  });

  it('runs opted-in HTML in a sandboxed iframe and accepts its resize messages', async () => {
    const body = '<button onclick="document.body.dataset.clicked=\'yes\'">Run</button><script>run()</script>';
    const wrapper = mount(HomeHtmlSection, {
      props: { section: { kind: 'html', title: 'HTML', body, render_in_iframe: true }, locale: 'zh-CN' }
    });
    const iframe = wrapper.get('iframe');

    expect(iframe.attributes('sandbox')).toContain('allow-scripts');
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.attributes('srcdoc')).toContain(body);
    expect(iframe.attributes('srcdoc')).toContain('<html lang="zh-CN" dir="ltr" data-lang="zh-CN" data-theme="light">');
    expect(iframe.attributes('srcdoc')).toContain('"locale":"zh-CN"');

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 640 },
        source: (iframe.element as HTMLIFrameElement).contentWindow
      })
    );
    await nextTick();

    expect(iframe.attributes('style')).toContain('height: 640px');
  });

  it('keeps configured HTML height and ignores automatic resize messages', async () => {
    const wrapper = mount(HomeHtmlSection, {
      props: {
        section: {
          kind: 'html',
          title: 'Fixed HTML',
          body: '<p>Content</p>',
          render_in_iframe: true,
          height: 480
        },
        locale: 'en'
      }
    });
    const iframe = wrapper.get('iframe');

    expect(iframe.attributes('style')).toContain('height: 480px');
    expect(iframe.attributes('srcdoc')).not.toContain('data-acedatacloud-resize');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 900 },
        source: (iframe.element as HTMLIFrameElement).contentWindow
      })
    );
    await nextTick();
    expect(iframe.attributes('style')).toContain('height: 480px');
  });

  it('applies a configured Website height without weakening its sandbox', () => {
    const wrapper = mount(HomeWebsiteSection, {
      props: {
        section: {
          kind: 'website',
          title: 'Website',
          body: 'https://example.com/embed',
          render_in_iframe: true,
          height: 520
        }
      },
      global: { mocks: { $t: () => 'Open externally' } }
    });
    const iframe = wrapper.get('iframe');

    expect(iframe.attributes('style')).toContain('height: 520px');
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin');
  });
});
