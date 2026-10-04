// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({
  list: vi.fn(),
  categories: vi.fn(),
  externalList: vi.fn(),
  install: vi.fn(),
  externalInstall: vi.fn()
}));
vi.mock('@/operators/skill', () => ({
  skillCatalogOperator: { list: api.list, install: api.install, categories: api.categories },
  skillMarketplaceOperator: { list: api.externalList, install: api.externalInstall }
}));
vi.mock('@/i18n', () => ({ default: { global: { t: (key: string) => key, locale: 'en' } } }));
vi.mock('@/utils/skills/surfaceGate', () => ({ isSurfaceSupported: () => true }));
vi.mock('@/components/common/VueMarkdown.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@acedatacloud/core/components', () => ({
  MetaTag: { template: '<span><slot /></span>' },
  FilterChip: { template: '<button><slot /></button>' }
}));
vi.mock('@acedatacloud/core/icons/components', () => ({
  MarketplaceIcon: { template: '<svg />' },
  SearchIcon: { template: '<svg />' }
}));
vi.mock('element-plus', () => {
  const pass = { template: '<div><slot /></div>' };
  return {
    ElButton: { template: '<button><slot /></button>' },
    ElDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>' },
    ElInput: pass,
    ElOption: pass,
    ElPagination: pass,
    ElSelect: pass,
    ElMessage: { success: vi.fn() }
  };
});
import SkillMarketplace from './SkillMarketplace.vue';
const catalog = {
  id: 'catalog1',
  identifier: 'a/tool',
  publisher: 'Example',
  name: 'Tool',
  slug: 'tool',
  description: 'Task workflow',
  installed: false,
  installable: true,
  install_count: 5,
  frontmatter: {},
  content: 'Instructions',
  source_url: 'https://github.com/example/skills',
  source_repo: 'example/skills',
  last_synced_at: '2026-10-04T10:00:00Z'
};
const external = {
  id: 'external1',
  marketplace: 'skillsmp',
  publisher: 'Community',
  name: 'External',
  slug: 'external',
  description: 'Community workflow',
  installed: false,
  metric: 'stars',
  metric_count: 90,
  source_url: 'https://github.com/example/skills',
  source_repo: 'example/skills',
  marketplace_url: 'https://skillsmp.com/skills/external',
  reference: 'signed-listing',
  upstream_updated_at: '2026-10-04T10:00:00Z'
};
const mountMarket = () => mount(SkillMarketplace, { global: { mocks: { $t: (key: string) => key } } });
beforeEach(() => {
  vi.clearAllMocks();
  api.categories.mockResolvedValue({ data: { namespaces: [] } });
  api.list.mockResolvedValue({ data: { items: [structuredClone(catalog)], total: 1 } });
  api.externalList.mockResolvedValue({ data: { items: [structuredClone(external)], page: 1, has_more: false } });
});
describe('SkillMarketplace', () => {
  it('keeps a slow catalog response from replacing the selected external source', async () => {
    let resolveCatalog!: (value: unknown) => void;
    api.list.mockReturnValue(
      new Promise((resolve) => {
        resolveCatalog = resolve;
      })
    );
    const wrapper = mountMarket();
    await wrapper.get('.source-card.skillsmp').trigger('click');
    await flushPromises();
    resolveCatalog({ data: { items: [catalog], total: 1 } });
    await flushPromises();
    expect(wrapper.get('.skill-title').text()).toBe('External');
    expect(wrapper.text()).toContain('skill.marketplace.repoStars');
    wrapper.unmount();
  });
  it('shows an unconfigured source without fake skills', async () => {
    api.externalList.mockRejectedValue({ response: { data: { code: 'not_configured' } } });
    const wrapper = mountMarket();
    await flushPromises();
    await wrapper.get('.source-card.skills-sh').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('skill.marketplace.notConnected');
    expect(wrapper.findAll('.skill-card')).toHaveLength(0);
    wrapper.unmount();
  });
  it('passes site ownership to catalog browsing and install', async () => {
    api.install.mockResolvedValue({ data: { id: 'installed1' } });
    const wrapper = mount(SkillMarketplace, {
      props: { siteId: 'site-a' },
      global: { mocks: { $t: (key: string) => key } }
    });
    await flushPromises();
    expect(api.list.mock.calls[0][0].site_id).toBe('site-a');
    await wrapper.get('.skill-title').trigger('click');
    await wrapper.get('.detail-actions button').trigger('click');
    await flushPromises();
    expect(api.install).toHaveBeenCalledWith('catalog1', { site_id: 'site-a' });
    expect(wrapper.emitted('installed')).toEqual([['installed1']]);
    wrapper.unmount();
  });
  it('requests the all-time feed when All is selected', async () => {
    const wrapper = mountMarket();
    await flushPromises();
    await wrapper.get('.source-card.skills-sh').trigger('click');
    await flushPromises();
    await wrapper.findAll('.market-collections button').at(-1)!.trigger('click');
    await flushPromises();
    expect(api.externalList.mock.lastCall?.[0].collection).toBe('all-time');
    wrapper.unmount();
  });
  it('clears old rows and shows a retry on request failure', async () => {
    const wrapper = mountMarket();
    await flushPromises();
    api.externalList.mockRejectedValue(new Error('unavailable'));
    await wrapper.get('.source-card.skillsmp').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.skill-card')).toHaveLength(0);
    expect(wrapper.get('[role="alert"]').text()).toContain('skill.marketplace.retry');
    wrapper.unmount();
  });
});
