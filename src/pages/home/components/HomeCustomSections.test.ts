// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HomeCustomSections from './HomeCustomSections.vue';
import HomeRichTextSection from './custom/HomeRichTextSection.vue';

const site = { id: 'site-1', features: { chatgpt: { enabled: true } } };

describe('HomeCustomSections', () => {
  it('dispatches only known section kinds', () => {
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        sections: [
          { id: 'cta', kind: 'cta', title: 'Launch', button_label: 'Start', button_url: '/start' },
          { id: 'bad', kind: 'arbitrary_html' as any, body: '<script>alert(1)</script>' }
        ]
      }
    });
    expect(wrapper.findAllComponents({ name: 'HomeCtaSection' })).toHaveLength(1);
    expect(wrapper.html()).not.toContain('arbitrary_html');
    expect(wrapper.html()).not.toContain('<script>');
  });

  it('dispatches every supported renderer', () => {
    const wrapper = shallowMount(HomeCustomSections, {
      props: {
        site,
        sections: [
          { id: 'image', kind: 'image_text', title: 'Image', image_url: 'https://example.com/image.png' },
          { id: 'cta', kind: 'cta', title: 'CTA', button_label: 'Start', button_url: '/start' },
          { id: 'grid', kind: 'capability_grid', title: 'Tools', capability_keys: ['chatgpt'] },
          { id: 'rich', kind: 'rich_text', body: '# Rich' }
        ]
      }
    });
    expect(wrapper.findAllComponents({ name: 'HomeImageTextSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeCtaSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeCapabilityGridSection' })).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'HomeRichTextSection' })).toHaveLength(1);
  });

  it('forces safe Markdown rendering', () => {
    const wrapper = shallowMount(HomeRichTextSection, {
      props: { section: { kind: 'rich_text', body: '<img src=x onerror=alert(1)> [x](javascript:alert(1))' } }
    });
    const markdown = wrapper.getComponent({ name: 'VueMarkdown' });
    expect(markdown.props('sanitize')).toBe(true);
  });
});
