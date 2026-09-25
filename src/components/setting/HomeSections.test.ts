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

  it('offers exactly Markdown and HTML and defaults to Markdown', () => {
    const wrapper = mountSetting();

    expect((wrapper.vm as any).kinds).toEqual(['markdown', 'html']);
    expect((wrapper.vm as any).form.kind).toBe('markdown');
    expect((wrapper.vm as any).form.renderInIframe).toBe(false);
  });

  it('builds a payload with only content and operational fields', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'html',
      title: 'Custom HTML',
      body: '<section data-kind="custom">Body</section>',
      renderInIframe: true,
      visible: false,
      sortOrder: 9,
      startAt: '2026-09-14T08:00:00',
      endAt: '2026-09-15T08:00:00'
    });

    expect((wrapper.vm as any).buildPayload()).toEqual({
      kind: 'html',
      title: 'Custom HTML',
      body: '<section data-kind="custom">Body</section>',
      render_in_iframe: true,
      visible: false,
      sort_order: 9,
      start_at: '2026-09-14T08:00:00Z',
      end_at: '2026-09-15T08:00:00Z'
    });
  });

  it('shows only actionable text from nested validation errors', async () => {
    const traceId = '53c5415d-c842-4fda-859f-9ec7ab475fd7';
    vi.mocked(siteHomeSectionOperator.create).mockRejectedValue({
      response: {
        data: {
          detail: { detail: 'markdown body must not contain raw HTML' },
          code: 'invalid',
          trace_id: traceId
        }
      }
    });
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'markdown',
      title: 'Markdown',
      body: '<p>hello</p>'
    });

    await (wrapper.vm as any).submit();

    expect(messages.error).toHaveBeenCalledWith('markdown body must not contain raw HTML');
    const rendered = String(messages.error.mock.calls[0]?.[0]);
    expect(rendered).not.toContain('[object Object]');
    expect(rendered).not.toContain('invalid');
    expect(rendered).not.toContain(traceId);
  });

  it('creates raw HTML for the current site without rewriting it', async () => {
    const body = '  \n<iframe src="https://example.com"></iframe><img onerror="run()">\n  ';
    vi.mocked(siteHomeSectionOperator.create).mockResolvedValue({
      data: { id: 'new', kind: 'html', title: 'Custom HTML', body }
    } as any);
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'html',
      title: 'Custom HTML',
      body,
      renderInIframe: true
    });

    await (wrapper.vm as any).submit();

    expect(siteHomeSectionOperator.create).toHaveBeenCalledWith({
      site: 'site-1',
      kind: 'html',
      title: 'Custom HTML',
      body,
      render_in_iframe: true,
      visible: true,
      sort_order: 0,
      start_at: null,
      end_at: null
    });
  });

  it('never enables iframe rendering for Markdown payloads', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'markdown',
      title: 'Markdown',
      body: '# Body',
      renderInIframe: true
    });

    expect((wrapper.vm as any).buildPayload().render_in_iframe).toBe(false);
  });
});
