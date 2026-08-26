// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { ResolvedShowcase } from '@/models';
import InspirationMasonry from './InspirationMasonry.vue';

const item = (id: string): ResolvedShowcase => ({
  id,
  service: 'openai',
  capability: 'openaiimage',
  routeName: 'openaiimage-index',
  name: 'GPT Image',
  description: `Prompt ${id}`,
  icon: 'gpt.png',
  defaultIcon: 'gpt.png',
  title: `Work ${id}`,
  altText: `Work ${id}`,
  mediaType: 'Image',
  posterUrl: `${id}.webp`,
  previewUrl: '',
  layout: 'Square',
  prompt: `Prompt ${id}`,
  model: 'gpt-image-2',
  parameters: [],
  canCreateSimilar: true
});

describe('InspirationMasonry', () => {
  it('renders every item as a lazy media card and forwards selection', async () => {
    const items = [item('one'), item('two')];
    const wrapper = mount(InspirationMasonry, {
      props: { items },
      global: { mocks: { $t: (key: string) => key } }
    });

    expect(wrapper.findAll('.inspiration-card')).toHaveLength(2);
    expect(wrapper.findAll('img')[0].attributes()).toMatchObject({ loading: 'lazy', decoding: 'async' });
    await wrapper.findAll('.inspiration-card')[1].trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual([items[1]]);
  });
});
