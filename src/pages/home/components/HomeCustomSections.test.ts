// @vitest-environment jsdom
import { mount, shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { HOME_HTML_IFRAME_RESIZE_MESSAGE } from '@/utils/homeHtmlIframe';
import HomeCustomSections from './HomeCustomSections.vue';
import HomeHtmlSection from './custom/HomeHtmlSection.vue';
import HomeMarkdownSection from './custom/HomeMarkdownSection.vue';
import HomeWebsiteSection from './custom/HomeWebsiteSection.vue';

const site = { id: 'site-1', features: {} };

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

  it('renders administrator-authored HTML directly', () => {
    const body = '<section data-custom="yes"><strong>Raw HTML</strong></section>';
    const wrapper = mount(HomeHtmlSection, {
      props: { section: { kind: 'html', title: 'HTML', body } }
    });

    expect(wrapper.get('.tenant-home-content').html()).toContain(body);
    expect(wrapper.get('[data-custom="yes"]').text()).toBe('Raw HTML');
  });

  it('renders Website URLs in a sandboxed iframe with an external fallback', () => {
    const url = 'https://example.com/embed';
    const wrapper = mount(HomeWebsiteSection, {
      props: { section: { kind: 'website', title: 'Website', body: url, render_in_iframe: true } },
      global: { mocks: { $t: (_key: string, values: { host: string }) => `Open ${values.host}` } }
    });
    const iframe = wrapper.get('iframe');
    const link = wrapper.get('a');

    expect(iframe.attributes('src')).toBe(url);
    expect(iframe.attributes('srcdoc')).toBeUndefined();
    expect(iframe.attributes('sandbox')).toContain('allow-scripts');
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.attributes('loading')).toBe('lazy');
    expect(iframe.attributes('referrerpolicy')).toBe('no-referrer');
    expect(link.attributes('href')).toBe(url);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.text()).toContain('example.com');
  });

  it('runs opted-in HTML in a sandboxed iframe and accepts its resize messages', async () => {
    const body = '<button onclick="document.body.dataset.clicked=\'yes\'">Run</button><script>run()</script>';
    const wrapper = mount(HomeHtmlSection, {
      props: { section: { kind: 'html', title: 'HTML', body, render_in_iframe: true } }
    });
    const iframe = wrapper.get('iframe');

    expect(iframe.attributes('sandbox')).toContain('allow-scripts');
    expect(iframe.attributes('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.attributes('srcdoc')).toContain(body);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: HOME_HTML_IFRAME_RESIZE_MESSAGE, height: 640 },
        source: (iframe.element as HTMLIFrameElement).contentWindow
      })
    );
    await nextTick();

    expect(iframe.attributes('style')).toContain('height: 640px');
  });
});
