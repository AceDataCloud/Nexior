// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { siteOperator } from '@/operators';
import HomeSetting from './HomeSetting.vue';
vi.mock('@/operators', () => ({
  siteOperator: {
    get: vi.fn().mockResolvedValue({
      data: { id: 'site-1', home: { sections: { banner: { enabled: true } } }, configuration_revision: 3 }
    }),
    update: vi.fn().mockResolvedValue({ data: {} })
  }
}));
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
    expect(siteOperator.update).toHaveBeenCalledWith(
      'site-1',
      {
        home: { sections: { banner: { enabled: true }, showcase: { enabled: false } } }
      },
      3
    );
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });
});
