// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { siteHomeSectionOperator } from '@/operators';
import HomeSections from './HomeSections.vue';

vi.mock('@/operators', () => ({
  siteHomeSectionOperator: {
    getAll: vi.fn().mockResolvedValue({ data: { items: [] } }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const mountSetting = () =>
  shallowMount(HomeSections, {
    props: { site: { id: 'site-1' } },
    global: { mocks: { $t: (key: string) => key }, stubs: { Teleport: true } }
  });

describe('setting/HomeSections', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears fields that are forbidden by the selected kind', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'capability_grid',
      title: 'Tools',
      body: 'old',
      imageUrl: 'https://example.com/x.png',
      buttonLabel: 'old',
      buttonUrl: '/old',
      capabilityKeys: ['chatgpt']
    });
    expect((wrapper.vm as any).buildPayload()).toMatchObject({
      kind: 'capability_grid',
      title: 'Tools',
      body: null,
      image_url: null,
      button_label: null,
      button_url: null,
      capability_keys: ['chatgpt']
    });
  });

  it('creates a section for the current site', async () => {
    vi.mocked(siteHomeSectionOperator.create).mockResolvedValue({
      data: { id: 'new', kind: 'cta', title: 'Launch', button_label: 'Start', button_url: '/start' }
    } as any);
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'cta',
      title: 'Launch',
      buttonLabel: 'Start',
      buttonUrl: '/start'
    });
    await (wrapper.vm as any).submit();
    expect(siteHomeSectionOperator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        site: 'site-1',
        kind: 'cta',
        title: 'Launch',
        button_label: 'Start',
        button_url: '/start'
      })
    );
  });
});
