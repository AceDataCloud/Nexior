// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ActionConfirmationCard from './ActionConfirmationCard.vue';
import type { IActionConfirmationPayload } from '@/models';

const global = {
  mocks: {
    $t: (key: string) => key
  },
  stubs: {
    FontAwesomeIcon: { template: '<i />' },
    ExternalLinkIcon: { template: '<i />' },
    'el-button': {
      props: ['type', 'loading', 'disabled', 'text'],
      emits: ['click'],
      template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
    }
  }
};

const BASE: IActionConfirmationPayload = {
  action_confirmation_id: 'actconf_1',
  kind: 'generic',
  title: '删除文件',
  summary: '这个操作不可撤销',
  fields: [
    { label: '路径', value: '/tmp/a.txt' },
    { label: '大小', value: '12 KB' }
  ]
};

const mountCard = (payload: IActionConfirmationPayload, props: Record<string, unknown> = {}) =>
  mount(ActionConfirmationCard, { props: { payload, ...props }, global });

describe('ActionConfirmationCard', () => {
  it('renders the title and generic fields', () => {
    const wrapper = mountCard(BASE);
    expect(wrapper.text()).toContain('删除文件');
    expect(wrapper.text()).toContain('/tmp/a.txt');
    expect(wrapper.text()).toContain('12 KB');
  });

  it('emits confirmed=true with the id when confirming', async () => {
    const wrapper = mountCard(BASE);
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('submit')?.[0][0]).toEqual({
      action_confirmation_id: 'actconf_1',
      confirmed: true
    });
  });

  it('emits confirmed=false when cancelling', async () => {
    const wrapper = mountCard(BASE);
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('submit')?.[0][0]).toEqual({
      action_confirmation_id: 'actconf_1',
      confirmed: false
    });
  });

  it('submits at most once — a second click is ignored', async () => {
    const wrapper = mountCard(BASE);
    const confirm = wrapper.findAll('button')[1];
    await confirm.trigger('click');
    await confirm.trigger('click');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });

  it('does not emit once resolved', async () => {
    const wrapper = mountCard(BASE, { resolved: true });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(0);
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('falls back to the generic body for an unknown kind', () => {
    // The worker may ship a kind before the frontend knows it; a blank
    // card would be worse than a plain summary.
    const wrapper = mountCard({ ...BASE, kind: 'some.future.kind' });
    expect(wrapper.text()).toContain('这个操作不可撤销');
    expect(wrapper.text()).toContain('/tmp/a.txt');
  });

  it('shows the confirmed banner when replaying a resolved block', () => {
    const wrapper = mountCard(BASE, {
      resolved: true,
      previousOutput: JSON.stringify({ action_confirmation_id: 'actconf_1', confirmed: true })
    });
    expect(wrapper.text()).toContain('chat.actionConfirmation.resolvedConfirmed');
  });

  it('shows the cancelled banner for a cancelled block', () => {
    const wrapper = mountCard(BASE, {
      resolved: true,
      previousOutput: JSON.stringify({ action_confirmation_id: 'actconf_1', confirmed: false })
    });
    expect(wrapper.text()).toContain('chat.actionConfirmation.resolvedCancelled');
  });

  it('treats malformed previousOutput as cancelled rather than throwing', () => {
    const wrapper = mountCard(BASE, { resolved: true, previousOutput: '{not json' });
    expect(wrapper.text()).toContain('chat.actionConfirmation.resolvedCancelled');
  });

  it('uses a custom confirm label when supplied', () => {
    const wrapper = mountCard({ ...BASE, confirm_label: '发布' });
    expect(wrapper.findAll('button')[1].text()).toBe('发布');
  });

  it('formats the preview duration as m:ss', () => {
    const wrapper = mountCard({
      ...BASE,
      preview: { type: 'video', url: 'https://x/v.mp4', duration_sec: 95 }
    });
    expect(wrapper.text()).toContain('1:35');
  });

  it('uses an inline video player and replaces it with a safe fallback on error', async () => {
    const wrapper = mountCard({
      ...BASE,
      preview: { type: 'video', url: 'https://cdn.example.com/video.mp4', duration_sec: 10 }
    });
    const video = wrapper.find('video');
    expect(video.attributes('playsinline')).toBeDefined();
    await video.trigger('error');
    expect(wrapper.find('video').exists()).toBe(false);
    const link = wrapper.find('.preview-fallback a');
    expect(link.attributes('href')).toBe('https://cdn.example.com/video.mp4');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });

  it('renders malformed TikTok history as a blocked TikTok form instead of a generic blank card', () => {
    const wrapper = mountCard({
      action_confirmation_id: 'actconf_tiktok',
      kind: 'tiktok.publish',
      title: '发布到 TikTok',
      preview: { type: 'video', url: 'https://cdn.example.com/video.mp4' },
      detail: {}
    });
    expect(wrapper.findComponent({ name: 'TikTokPublishForm' }).exists()).toBe(true);
    expect(wrapper.text()).toContain('chat.actionConfirmation.tiktok.detailsUnavailable');
    expect((wrapper.vm as any).bodyValid).toBe(false);
  });
});
