// @vitest-environment jsdom
import { flushPromises, shallowMount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { distributionLevelOperator, distributionStatusOperator, shortUrlOperator, userOperator } from '@/operators';
import { Status } from '@/models';
import Composer from './Composer.vue';
import SidePanel from './SidePanel.vue';
import ConnectorStrip from './ConnectorStrip.vue';
import Distribution from '@/pages/distribution/Index.vue';
import { listEnabledConnectors } from './connectorCatalogCache';

vi.mock('./connectorCatalogCache', () => ({ listEnabledConnectors: vi.fn() }));

const originalLocation = window.location;
const wrappers: VueWrapper[] = [];
const push = vi.fn();
const global = {
  renderStubDefaultSlot: true,
  stubs: {
    ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' },
    ElDropdownItem: { template: '<button><slot /></button>' },
    ConversationActions: true
  },
  mocks: {
    $t: (key: string) => key,
    $router: { push },
    $route: { params: {}, query: {} },
    $store: {
      getters: { user: { id: 'user-1' } },
      state: {
        token: { access: 'test-token' },
        chat: {
          model: { name: 'chat-model', isFileSupported: true },
          conversations: [],
          status: { getConversations: Status.None }
        }
      }
    }
  }
};

beforeEach(() => {
  vi.stubEnv('VITE_SURFACE', 'web');
  push.mockReset();
  vi.mocked(listEnabledConnectors)
    .mockReset()
    .mockResolvedValue([
      { id: 'connector-1', identifier: 'drive', name: 'Drive', icon_url: 'https://example.com/drive.png' }
    ]);
  vi.spyOn(distributionStatusOperator, 'initialize').mockResolvedValue(undefined as never);
  vi.spyOn(distributionStatusOperator, 'getAll').mockResolvedValue({ data: { items: [] } } as never);
  vi.spyOn(distributionLevelOperator, 'getAll').mockResolvedValue({ data: { items: [] } } as never);
  vi.spyOn(userOperator, 'getInvitees').mockResolvedValue({ data: { items: [], count: 0 } } as never);
  vi.spyOn(shortUrlOperator, 'create').mockResolvedValue({ data: { data: {} } } as never);
});

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('official chat tool entry points', () => {
  it.each([
    ['web', 'studio.acedata.cloud', true],
    ['web', 'foytea.com', false],
    ['web', 'foy-ai.studio.acedata.cloud', false],
    ['web', 'studio.acedata.cloud.example.com', false],
    ['desktop', 'bundle', true],
    ['ios', 'localhost', true],
    ['android', 'localhost', true]
  ] as const)('%s %s shows official tools: %s', async (surface, host, allowed) => {
    vi.stubEnv('VITE_SURFACE', surface);
    Object.defineProperty(window, 'location', { configurable: true, value: new URL(`https://${host}`) });
    const composer = shallowMount(Composer, { props: { question: '' }, global });
    const sidebar = shallowMount(SidePanel, { global });
    const connectors = shallowMount(ConnectorStrip, { global });
    const distribution = shallowMount(Distribution, { global });
    wrappers.push(composer, sidebar, connectors, distribution);
    await flushPromises();

    expect(composer.text().includes('chat.composer.skills')).toBe(allowed);
    expect(composer.text().includes('chat.composer.connections')).toBe(allowed);
    expect(sidebar.text().includes('chat.scheduledTasks.navTitle')).toBe(allowed);
    expect(sidebar.text().includes('chat.artifacts.navTitle')).toBe(allowed);
    expect(connectors.find('.connector-strip').exists()).toBe(allowed);
    expect(distribution.find('.automation-card').exists()).toBe(allowed);
    expect(listEnabledConnectors).toHaveBeenCalledTimes(allowed ? 1 : 0);

    // Normal tenant chat and account features stay available.
    expect(composer.text()).toContain('chat.composer.addFiles');
    expect(sidebar.text()).toContain('chat.message.startNewChat');
    expect(distribution.text()).toContain('distribution.title.price');
    await sidebar.find('.conversation').trigger('click');
    expect(sidebar.emitted('change-conversation')).toEqual([[undefined]]);

    if (allowed) {
      const skills = composer.findAll('button').find((button) => button.text() === 'chat.composer.skills')!;
      await skills.trigger('click');
      expect(push).toHaveBeenLastCalledWith({ path: '/console/skills' });
      await connectors.find('.connector-chip').trigger('click');
      expect(push).toHaveBeenLastCalledWith({ path: '/console/connectors', query: undefined });
    } else {
      document.dispatchEvent(new Event('visibilitychange'));
      await connectors.vm.loadConnectors(true);
      expect(listEnabledConnectors).not.toHaveBeenCalled();
    }
  });
});
