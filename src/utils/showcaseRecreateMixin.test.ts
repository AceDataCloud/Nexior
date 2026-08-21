// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { describe, expect, it, vi } from 'vitest';
import { consumeShowcase } from './showcaseRecreate';
import { showcaseRecreateMixin } from './showcaseRecreateMixin';

vi.mock('./showcaseRecreate', () => ({ consumeShowcase: vi.fn().mockResolvedValue('applied') }));

const Component = { mixins: [showcaseRecreateMixin('seedance')], template: '<div />' };

function mountWithQuery(showcase?: string) {
  const route = { path: '/seedance', query: showcase ? { showcase } : {}, hash: '' };
  const wrapper = shallowMount(Component, {
    global: {
      plugins: [createStore({ state: { site: { features: { seedance: { enabled: true } } } } })],
      mocks: { $route: route, $router: { replace: vi.fn() }, $i18n: { locale: 'en' }, $t: (key: string) => key }
    }
  });
  return { wrapper, route };
}

describe('showcaseRecreateMixin', () => {
  it('consumes a showcase added to the current route after mount', async () => {
    vi.mocked(consumeShowcase).mockClear();
    const { wrapper, route } = mountWithQuery();
    await wrapper.vm.$nextTick();
    expect(consumeShowcase).toHaveBeenCalledTimes(1);

    route.query = { showcase: '196387e7-f217-453f-a678-ed1165e0cbd9' };
    await (wrapper.vm as any).$options.watch['$route.query.showcase'].handler.call(
      wrapper.vm,
      route.query.showcase,
      undefined
    );
    expect(consumeShowcase).toHaveBeenCalledTimes(2);
  });
});
