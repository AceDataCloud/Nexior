// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeShowcase } from './showcaseRecreate';
import { showcaseRecreateMixin } from './showcaseRecreateMixin';
import { taskDrawerState } from './taskDrawerMixin';

vi.mock('./showcaseRecreate', () => ({ consumeShowcase: vi.fn() }));

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
  beforeEach(() => {
    vi.mocked(consumeShowcase).mockReset().mockResolvedValue('absent');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    taskDrawerState.open = false;
  });

  afterEach(() => {
    taskDrawerState.open = false;
    vi.unstubAllGlobals();
  });

  it('opens the mobile creation drawer only after the showcase has been applied', async () => {
    let apply!: (result: 'applied') => void;
    vi.mocked(consumeShowcase).mockReturnValueOnce(new Promise((resolve) => (apply = resolve)));
    const { wrapper } = mountWithQuery('196387e7-f217-453f-a678-ed1165e0cbd9');
    expect(taskDrawerState.open).toBe(false);

    apply('applied');
    await flushPromises();
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(taskDrawerState.open).toBe(true);
    wrapper.unmount();
  });

  it('keeps the desktop drawer closed after applying a showcase', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
    vi.mocked(consumeShowcase).mockResolvedValueOnce('applied');
    const { wrapper } = mountWithQuery('196387e7-f217-453f-a678-ed1165e0cbd9');
    await flushPromises();
    expect(taskDrawerState.open).toBe(false);
    wrapper.unmount();
  });

  it.each(['absent', 'cancelled', 'invalid', 'failed'] as const)(
    'does not open the mobile drawer when the showcase result is %s',
    async (result) => {
      vi.mocked(consumeShowcase).mockResolvedValueOnce(result);
      const { wrapper } = mountWithQuery('196387e7-f217-453f-a678-ed1165e0cbd9');
      await flushPromises();
      expect(taskDrawerState.open).toBe(false);
      wrapper.unmount();
    }
  );

  it('consumes a showcase added to the current route after mount', async () => {
    vi.mocked(consumeShowcase).mockClear();
    const { wrapper, route } = mountWithQuery();
    await wrapper.vm.$nextTick();
    expect(consumeShowcase).toHaveBeenCalledTimes(1);

    expect(taskDrawerState.open).toBe(false);
    vi.mocked(consumeShowcase).mockResolvedValueOnce('applied');
    route.query = { showcase: '196387e7-f217-453f-a678-ed1165e0cbd9' };
    await (wrapper.vm as any).$options.watch['$route.query.showcase'].handler.call(
      wrapper.vm,
      route.query.showcase,
      undefined
    );
    expect(consumeShowcase).toHaveBeenCalledTimes(2);
    expect(taskDrawerState.open).toBe(true);
    wrapper.unmount();
  });
});
