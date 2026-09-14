// @vitest-environment jsdom
import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HomeCustomSections from './HomeCustomSections.vue';
import HomeHtmlSection from './custom/HomeHtmlSection.vue';
import HomeMarkdownSection from './custom/HomeMarkdownSection.vue';

const site = { id: 'site-1', features: {} };

describe('HomeCustomSections', () => {
  it('dispatches exactly the Markdown and HTML renderers', () => {
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        sections: [
          { id: 'markdown', kind: 'markdown', title: 'Markdown', body: '# Content' },
          { id: 'html', kind: 'html', title: 'HTML', body: '<strong>Content</strong>' }
        ]
      }
    });

    expect(wrapper.findAllComponents({ name: 'HomeMarkdownSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeHtmlSection' })).toHaveLength(1);
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
});
