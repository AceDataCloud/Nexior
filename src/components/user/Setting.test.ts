// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control `isMainOfficial()` (normally derived from window.location.host) so we
// can exercise BOTH the official main host (where Subsites shows) and a subsite
// host (where Custom Domain shows) without touching jsdom's location.
const hostState = vi.hoisted(() => ({ official: false }));
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>();
  return { ...actual, isMainOfficial: () => hostState.official };
});

import Setting from './Setting.vue';
import SiteSetting from '@/components/setting/Site.vue';
import SeoSetting from '@/components/setting/Seo.vue';
import DistributionSetting from '@/components/setting/Distribution.vue';
import FunctionSetting from '@/components/setting/Function.vue';
import AuthSetting from '@/components/setting/Auth.vue';
import SubsiteSetting from '@/components/setting/Subsite.vue';
import CustomDomainSetting from '@/components/setting/CustomDomain.vue';

/**
 * Operator / white-label settings tabs (Site, SEO, Distribution, Function,
 * Auth, Subsites, Custom Domain) manage a web deployment, so they must only
 * appear on the web surface — never inside the native iOS/Android shell or
 * the desktop (Electron) app. Consumer tabs (General, API Key, About) stay
 * available on every surface.
 */
const CONSUMER_TABS = ['general', 'apiKey', 'about'];
const ALL_OPERATOR_TABS = ['site', 'seo', 'distribution', 'function', 'auth', 'subsites', 'customDomain'];
// activeTab key -> the child component its <main> v-if branch renders.
const OPERATOR_CONTENT = {
  site: SiteSetting,
  seo: SeoSetting,
  distribution: DistributionSetting,
  function: FunctionSetting,
  auth: AuthSetting,
  subsites: SubsiteSetting,
  customDomain: CustomDomainSetting
} as const;

const mountSetting = () =>
  shallowMount(Setting, {
    props: { visible: true },
    global: {
      mocks: {
        $t: (key: string) => key,
        // Make the current user a site admin so the admin-gated operator
        // tabs WOULD show if the surface allowed them — this isolates the
        // surface gate as the only thing hiding them off-web.
        $store: { state: { site: { admins: ['u1'] } }, getters: { user: { id: 'u1' } } }
      },
      // shallowMount auto-stubs ElDialog without rendering its slot, which
      // would hide the <main> content branches and make the content-gating
      // assertions pass vacuously. Render the slot so the v-if branches and
      // their (still auto-stubbed) child components actually mount.
      stubs: { ElDialog: { template: '<div class="el-dialog-stub"><slot /></div>' } }
    }
  });

const tabKeys = (wrapper: ReturnType<typeof mountSetting>): string[] =>
  (wrapper.vm as unknown as { visibleNavItems: { key: string }[] }).visibleNavItems.map((i) => i.key);

describe('user/Setting surface gating', () => {
  beforeEach(() => {
    hostState.official = false;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('web + subsite host: shows admin tabs and Custom Domain, hides Subsites', () => {
    vi.stubEnv('VITE_SURFACE', 'web');
    hostState.official = false;
    const keys = tabKeys(mountSetting());
    for (const tab of ['site', 'seo', 'distribution', 'function', 'auth', 'customDomain']) {
      expect(keys).toContain(tab);
    }
    expect(keys).not.toContain('subsites'); // Subsites is main-official-host only
    for (const tab of CONSUMER_TABS) expect(keys).toContain(tab);
  });

  it('web + official main host: shows admin tabs and Subsites, hides Custom Domain', () => {
    vi.stubEnv('VITE_SURFACE', 'web');
    hostState.official = true;
    const keys = tabKeys(mountSetting());
    for (const tab of ['site', 'seo', 'distribution', 'function', 'auth', 'subsites']) {
      expect(keys).toContain(tab);
    }
    expect(keys).not.toContain('customDomain'); // main host never binds extra domains
    for (const tab of CONSUMER_TABS) expect(keys).toContain(tab);
  });

  it('web: operator content branches render in their host context', async () => {
    vi.stubEnv('VITE_SURFACE', 'web');
    // Subsites is the official-main-host operator tab.
    hostState.official = true;
    const official = mountSetting();
    await official.setData({ activeTab: 'subsites' });
    expect(official.findComponent(SubsiteSetting).exists()).toBe(true);
    // Custom Domain is the subsite-host operator tab.
    hostState.official = false;
    const subsite = mountSetting();
    await subsite.setData({ activeTab: 'customDomain' });
    expect(subsite.findComponent(CustomDomainSetting).exists()).toBe(true);
  });

  it.each(['ios', 'android', 'desktop'])('non-web surface %s hides every operator tab on both hosts', (surface) => {
    vi.stubEnv('VITE_SURFACE', surface);
    for (const official of [false, true]) {
      hostState.official = official;
      const keys = tabKeys(mountSetting());
      for (const tab of ALL_OPERATOR_TABS) expect(keys).not.toContain(tab);
      for (const tab of CONSUMER_TABS) expect(keys).toContain(tab);
    }
  });

  // Defense in depth: even if a deep-link forces `activeTab` onto a gated tab
  // off-web, the <main> content branch (not just the nav menu) must refuse it.
  it.each(['ios', 'android', 'desktop'])(
    'non-web surface %s renders no operator content via forced activeTab',
    async (surface) => {
      vi.stubEnv('VITE_SURFACE', surface);
      // Cover BOTH hosts so each tab is checked where it WOULD be web-visible:
      // Subsites on the official host, Custom Domain on a subsite host — so the
      // surface gate (not the host condition) is what hides each one off-web.
      for (const official of [false, true]) {
        hostState.official = official;
        const wrapper = mountSetting();
        for (const [tab, component] of Object.entries(OPERATOR_CONTENT)) {
          await wrapper.setData({ activeTab: tab });
          expect(wrapper.findComponent(component).exists()).toBe(false);
        }
      }
    }
  );
});
