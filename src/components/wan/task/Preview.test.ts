// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));
vi.mock('@/components/common/ApiCodeButton.vue', () => ({
  default: { name: 'ApiCodeButton', template: '<div />' }
}));

import Preview from './Preview.vue';

const mountPreview = (response?: { state?: string; success?: boolean; error?: { message?: string } }) =>
  shallowMount(Preview, {
    props: {
      modelValue: {
        id: 'wan-task-0187',
        created_at: 1_721_234_567,
        request: {
          prompt: 'A paper kite gliding above terraced rice fields at sunrise',
          model: 'wan2.6-i2v'
        },
        response: response as any
      }
    },
    global: {
      stubs: {
        ElAlert: { template: '<div><div class="alert-template"><slot name="template" /></div><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' },
        $store: { state: { wan: { config: {} } } }
      }
    }
  });

describe('wan/task/Preview', () => {
  it.each([
    ['without a response', undefined, 'wan.status.pending'],
    ['with an unfinished pending response', { state: 'pending' }, 'wan.status.processing'],
    ['with an unfinished processing response', { state: 'processing' }, 'wan.status.processing'],
    ['with an unfinished running response', { state: 'running' }, 'wan.status.processing'],
    ['with a queued response', { state: 'queued' }, 'wan.status.processing']
  ])('labels tasks %s with waiting semantics', (_name, response, expectedStatus) => {
    const wrapper = mountPreview(response);

    expect(wrapper.find('.alert-template').text()).toContain(expectedStatus);
    expect(wrapper.find('.prompt').text()).toContain(`- (${expectedStatus})`);
    expect(wrapper.find('.alert-template').text()).not.toContain('wan.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });

  it('preserves explicit failure semantics', () => {
    const wrapper = mountPreview({ success: false, error: { message: 'Input video could not be decoded' } });

    expect(wrapper.find('.alert-template').text()).toContain('wan.name.failure');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });

  it.each([{ state: 'failed', error: { message: 'Generation failed' } }, { state: 'cancelled' }])(
    'keeps terminal response %s on failure semantics',
    (response) => {
      const wrapper = mountPreview(response);

      expect(wrapper.find('.alert-template').text()).toContain('wan.name.failure');
      expect(wrapper.text()).not.toContain('wan.status.processing');
      expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
    }
  );

  it('renders a successful response without a state as complete', () => {
    const wrapper = mountPreview({ success: true });

    expect(wrapper.find('.success').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('wan.status.processing');
  });

  it('keeps a success-flagged processing response on waiting semantics', () => {
    const wrapper = mountPreview({ success: true, state: 'processing' });

    expect(wrapper.text()).toContain('wan.status.processing');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('gives failure semantics priority over a contradictory success flag', () => {
    const wrapper = mountPreview({ success: true, error: { message: 'Provider marked the task failed' } });

    expect(wrapper.text()).toContain('wan.name.failure');
    expect(wrapper.find('.success').exists()).toBe(false);
  });
});
