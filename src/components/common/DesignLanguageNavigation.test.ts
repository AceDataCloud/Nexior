// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import NotFound from '@/pages/error/NotFound.vue';
import StudioHeader from '@/components/poivelle/StudioHeader.vue';
import BYOKBadge from '@/components/chat/BYOKBadge.vue';

vi.mock('@/operators', () => ({ byokCredentialOperator: { list: vi.fn() } }));

const wrappers: VueWrapper[] = [];
const translate = (key: string) => key;

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});

describe('shared controls preserve Nexior navigation intent', () => {
  it('uses browser history for the error-page return when a previous entry exists', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    const router = { back: vi.fn(), push: vi.fn() };
    const wrapper = mount(NotFound, { global: { mocks: { $t: translate, $router: router, $route: {} } } });
    wrappers.push(wrapper);

    await wrapper.get('.adc-back-navigation').trigger('click');

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('keeps the error-page home fallback for a direct entry', async () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    const router = { back: vi.fn(), push: vi.fn() };
    const wrapper = mount(NotFound, { global: { mocks: { $t: translate, $router: router, $route: {} } } });
    wrappers.push(wrapper);

    await wrapper.get('.adc-back-navigation').trigger('click');

    expect(router.push).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('returns the film workspace to discovery through its existing home event', async () => {
    const wrapper = mount(StudioHeader, {
      props: { canRun: false, canEdit: false },
      global: { mocks: { $t: translate } }
    });
    wrappers.push(wrapper);

    const back = wrapper.get('.adc-back-navigation');
    expect(back.attributes('aria-label')).toBe('poivelle.discovery.back');
    await back.trigger('click');

    expect(wrapper.emitted('home')).toHaveLength(1);
  });

  it('keeps BYOK as a named management action without filter pressed semantics', async () => {
    const wrapper = mount(BYOKBadge, {
      global: {
        mocks: { $t: translate, $store: { state: { chat: { modelGroup: { name: 'chatgpt' } } } } },
        stubs: { ElTooltip: { template: '<span><slot /></span>' } }
      }
    });
    wrappers.push(wrapper);
    await wrapper.setData({
      loaded: true,
      credentials: [{ id: 'credential', provider: 'openai', provider_label: 'OpenAI', is_active: true }]
    });
    const received = vi.fn();
    window.addEventListener('open-user-settings', received);
    try {
      const action = wrapper.get('button');
      expect(action.attributes('aria-label')).toBe('byok.badge.manage');
      expect(action.attributes('aria-pressed')).toBeUndefined();
      await action.trigger('click');
      expect(received).toHaveBeenCalledOnce();
      expect((received.mock.calls[0][0] as CustomEvent).detail).toEqual({ tab: 'apiKey' });
    } finally {
      window.removeEventListener('open-user-settings', received);
    }
  });
});
