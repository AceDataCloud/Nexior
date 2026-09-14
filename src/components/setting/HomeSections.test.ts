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

const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: messages };
});

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

  it('shows only actionable text from nested validation errors', async () => {
    const traceId = '53c5415d-c842-4fda-859f-9ec7ab475fd7';
    vi.mocked(siteHomeSectionOperator.create).mockRejectedValue({
      response: {
        data: {
          detail: { detail: 'rich_text body must not contain raw HTML' },
          code: 'invalid',
          trace_id: traceId
        }
      }
    });
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, { kind: 'rich_text', body: '<p>hello</p>' });

    await (wrapper.vm as any).submit();

    expect(messages.error).toHaveBeenCalledWith('rich_text body must not contain raw HTML');
    const rendered = String(messages.error.mock.calls[0]?.[0]);
    expect(rendered).not.toContain('[object Object]');
    expect(rendered).not.toContain('invalid');
    expect(rendered).not.toContain(traceId);
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
