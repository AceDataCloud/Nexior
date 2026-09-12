// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { siteOperator } from '@/operators';
import HomeSetting from './HomeSetting.vue';
vi.mock('@/operators', () => ({ siteOperator: { update: vi.fn().mockResolvedValue({ data: {} }) } }));
const mountSetting = () => {
  const dispatch = vi.fn().mockResolvedValue(undefined);
  const site = { id: 'site-1', home: { sections: { banner: { enabled: true } } } };
  return {
    dispatch,
    wrapper: shallowMount(HomeSetting, {
      global: { mocks: { $t: (key: string) => key, $store: { state: { site }, dispatch } } }
    })
  };
};
describe('setting/HomeSetting', () => {
  it('patches only home and preserves sibling sections', async () => {
    const { wrapper, dispatch } = mountSetting();
    await (wrapper.vm as any).toggleSection('showcase', false);
    expect(siteOperator.update).toHaveBeenCalledWith('site-1', {
      home: { sections: { banner: { enabled: true }, showcase: { enabled: false } } }
    });
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });
  it('writes canonical category disabled ids', async () => {
    const { wrapper } = mountSetting();
    await (wrapper.vm as any).toggleCategory('music', false);
    expect(vi.mocked(siteOperator.update).mock.calls.at(-1)?.[1]).toEqual({
      home: { sections: { banner: { enabled: true }, categories: { disabled_item_ids: ['music'] } } }
    });
  });
});
