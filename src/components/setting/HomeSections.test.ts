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

  it('offers Markdown, HTML, and Website and defaults to Markdown', () => {
    const wrapper = mountSetting();

    expect((wrapper.vm as any).kinds).toEqual(['markdown', 'html', 'website']);
    expect((wrapper.vm as any).form.kind).toBe('markdown');
    expect((wrapper.vm as any).form.renderInIframe).toBe(false);
    expect((wrapper.vm as any).form.fixedHeight).toBe(false);
    expect((wrapper.vm as any).form.heightValue).toBe(480);
  });

  it('shows the numeric input only when custom height is enabled', async () => {
    const wrapper = shallowMount(HomeSections, {
      props: { site: { id: 'site-1' } },
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          Teleport: true,
          ElDialog: { template: '<div><slot /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' }
        }
      }
    });
    (wrapper.vm as any).openCreate();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.iframe-height-option').find('el-input-number-stub').exists()).toBe(false);
    expect((wrapper.vm as any).buildPayload().height).toBeNull();

    (wrapper.vm as any).form.fixedHeight = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.iframe-height-option').find('el-input-number-stub').exists()).toBe(true);
    expect((wrapper.vm as any).buildPayload().height).toBe(480);
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
      height: null,
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
      height: null,
      visible: true,
      sort_order: 0,
      start_at: null,
      end_at: null
    });
  });

  it('keeps height for Markdown while never enabling iframe rendering', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'markdown',
      title: 'Markdown',
      body: '# Body',
      renderInIframe: true,
      fixedHeight: true,
      heightValue: 640
    });

    expect((wrapper.vm as any).buildPayload()).toMatchObject({ render_in_iframe: false, height: 640 });
  });

  it('saves a fixed height for direct HTML without enabling an iframe', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'html',
      body: '<p>Content</p>',
      renderInIframe: false,
      fixedHeight: true,
      heightValue: 480
    });
    expect((wrapper.vm as any).buildPayload()).toMatchObject({ render_in_iframe: false, height: 480 });
  });

  it('restores and saves a fixed section height', () => {
    const wrapper = mountSetting();
    (wrapper.vm as any).openEdit({
      id: 'html-1',
      kind: 'html',
      title: 'HTML',
      body: '<p>Body</p>',
      render_in_iframe: true,
      height: 720
    });

    expect((wrapper.vm as any).form.fixedHeight).toBe(true);
    expect((wrapper.vm as any).form.heightValue).toBe(720);
    expect((wrapper.vm as any).buildPayload().height).toBe(720);
  });

  it('trims Website URLs and always enables iframe rendering', () => {
    const wrapper = mountSetting();
    Object.assign((wrapper.vm as any).form, {
      kind: 'website',
      title: 'Website',
      body: '  https://example.com/embed  ',
      renderInIframe: false
    });

    expect((wrapper.vm as any).buildPayload()).toMatchObject({
      kind: 'website',
      body: 'https://example.com/embed',
      render_in_iframe: true
    });
  });
});
