// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VueMarkdown, { MARKDOWN_SANITIZE_KEY } from './VueMarkdown.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';

vi.mock('@/utils', () => ({ highlight: () => undefined }));

describe('Studio shared Markdown adapter', () => {
  it('keeps new-tab links and renders a growing streamed answer', async () => {
    const wrapper = mount(VueMarkdown, { props: { source: '**Answer** [source](https://example.com)' } });
    expect(wrapper.find('a').attributes('target')).toBe('_blank');
    await wrapper.setProps({
      source: '**Answer** [source](https://example.com)\n\n$x^2$\n\n<audio src="https://example.com/a.mp3"></audio>'
    });
    expect(wrapper.find('strong').text()).toBe('Answer');
    expect(wrapper.find('.katex').exists()).toBe(true);
    expect(wrapper.find('audio').attributes('controls')).toBeDefined();
    wrapper.unmount();
  });
  it('keeps anonymous/shared messages in the inherited escape mode', () => {
    const wrapper = mount(VueMarkdown, {
      props: { source: '<audio src="https://example.com/a.mp3"></audio>\n\n**safe**' },
      global: { provide: { [MARKDOWN_SANITIZE_KEY]: true } }
    });
    expect(wrapper.find('audio').exists()).toBe(false);
    expect(wrapper.text()).toContain('<audio');
    expect(wrapper.find('strong').text()).toBe('safe');
    wrapper.unmount();
  });
  it('reveals citation chips when streamed metadata arrives and strips unsafe citation URLs', async () => {
    const wrapper = mount(MarkdownRenderer, {
      props: { content: 'A backed claim [^acite:one]', citations: {} },
      global: { stubs: { ElPopover: true, CitationCard: true } }
    });
    expect(wrapper.text()).not.toContain('[^acite:one]');
    expect(wrapper.find('.citation-chip').exists()).toBe(false);
    await wrapper.setProps({
      citations: { one: { id: 'one', url: 'https://example.com', title: 'Source', source: 'Example' } }
    });
    expect(wrapper.find('.citation-chip').attributes('data-citation-id')).toBe('one');
    expect(wrapper.find('.citation-chip a').attributes('href')).toBe('https://example.com');
    await wrapper.setProps({
      citations: { one: { id: 'one', url: 'javascript:alert(1)', title: 'Source', source: 'Example' } }
    });
    expect(wrapper.find('.citation-chip a').attributes('href')).toBeUndefined();
    wrapper.unmount();
  });
});
