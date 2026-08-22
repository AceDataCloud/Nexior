// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Banners from './Banners.vue';
import { siteBannerOperator, siteOperator } from '@/operators';

vi.mock('@/operators', () => ({
  siteBannerOperator: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  siteOperator: { update: vi.fn() }
}));

const site = {
  id: 'site-1',
  admins: ['u1'],
  features: { maestro: { enabled: true }, openaiimage: { enabled: true }, seedance: { enabled: true } },
  metadata: { pricing: { markup_ratio: 1 }, nexior: { keep: true } }
};

const banner = {
  id: 'banner-1',
  site: 'site-1',
  image_url: 'https://cdn.example.com/banner.webp',
  title: { 'zh-CN': '发布' },
  subtitle: { 'zh-CN': '试试看' },
  title_source: '发布',
  subtitle_source: '试试看',
  auto_translated_fields: ['title'],
  visible: true,
  sort_order: 2
};

function mountBanners() {
  return shallowMount(Banners, {
    props: { site },
    global: {
      mocks: {
        $t: (key: string) => key,
        $i18n: { locale: 'en' },
        $store: { state: { site }, dispatch: vi.fn().mockResolvedValue(undefined) }
      },
      stubs: {
        AutoTranslateToggle: {
          name: 'AutoTranslateToggle',
          props: ['model', 'field', 'objectId', 'enabled', 'currentValue'],
          template: '<button class="translate-stub" />'
        }
      }
    }
  });
}

describe('setting/Banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(siteBannerOperator.getAll).mockResolvedValue({ data: { count: 1, items: [banner] } } as any);
    vi.mocked(siteBannerOperator.update).mockResolvedValue({ data: banner } as any);
    vi.mocked(siteBannerOperator.create).mockResolvedValue({ data: banner } as any);
    vi.mocked(siteBannerOperator.delete).mockResolvedValue({ data: undefined } as any);
    vi.mocked(siteOperator.update).mockResolvedValue({ data: site } as any);
  });

  it('loads every custom row for management, including hidden and scheduled records', async () => {
    const wrapper = mountBanners();
    await vi.waitFor(() => expect(siteBannerOperator.getAll).toHaveBeenCalled());
    expect(siteBannerOperator.getAll).toHaveBeenCalledWith({
      site: 'site-1',
      ordering: 'sort_order,created_at',
      limit: 100
    });
    expect((wrapper.vm as any).rows).toEqual([banner]);
  });

  it('hides one system banner without disabling its capability or clobbering metadata', async () => {
    const wrapper = mountBanners();
    await (wrapper.vm as any).onToggleDefault('maestro', false);
    const payload = vi.mocked(siteOperator.update).mock.calls[0][1] as any;
    expect(payload.features.maestro.enabled).toBe(true);
    expect(payload.metadata).toEqual({
      pricing: { markup_ratio: 1 },
      nexior: { keep: true, hidden_default_banner_ids: ['maestro'] }
    });
  });

  it('patches only custom visibility', async () => {
    const wrapper = mountBanners();
    await (wrapper.vm as any).onToggleCustom(banner, false);
    expect(siteBannerOperator.update).toHaveBeenCalledWith('banner-1', { visible: false });
  });

  it('creates a localized custom banner for the current Site', async () => {
    const wrapper = mountBanners();
    (wrapper.vm as any).openCreate();
    await wrapper.setData({
      form: {
        imageUrl: 'https://cdn.example.com/new.webp',
        linkUrl: '/seedance',
        titleSource: '创建',
        subtitleSource: '立即体验',
        visible: true,
        sortOrder: 3,
        startAt: '',
        endAt: ''
      }
    });
    await (wrapper.vm as any).onSubmit();
    expect(siteBannerOperator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        site: 'site-1',
        link_url: '/seedance',
        title: { 'zh-CN': '创建' },
        subtitle: { 'zh-CN': '立即体验' },
        sort_order: 3
      })
    );
  });

  it('hydrates one source input and configures both translation toggles', async () => {
    const wrapper = mountBanners();
    await vi.waitFor(() => expect(siteBannerOperator.getAll).toHaveBeenCalled());
    (wrapper.vm as any).openEdit(banner);
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).form.titleSource).toBe('发布');
    expect((wrapper.vm as any).form.subtitleSource).toBe('试试看');
    expect((wrapper.vm as any).translationEnabled('title')).toBe(true);
    expect((wrapper.vm as any).translationEnabled('subtitle')).toBe(false);
    const source = (wrapper.vm as any).$options.template || '';
    expect(source).not.toContain('locale-rows');
  });

  it('keeps the editor open on the saved record so translation can be enabled', async () => {
    const wrapper = mountBanners();
    (wrapper.vm as any).openCreate();
    await wrapper.setData({ form: { ...(wrapper.vm as any).form, titleSource: '创建' } });
    await (wrapper.vm as any).onSubmit();
    expect((wrapper.vm as any).editorVisible).toBe(true);
    expect((wrapper.vm as any).editing?.id).toBe('banner-1');
  });
});
