// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import CopyToClipboard from './CopyToClipboard.vue';

const copy = vi.hoisted(() => vi.fn());
vi.mock('copy-to-clipboard', () => ({ default: copy }));

const mountCopyControl = () =>
  shallowMount(CopyToClipboard, {
    props: { content: 'copy me' },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        ElTooltip: { template: '<div><slot /></div>' },
        CopyIcon: { template: '<svg data-testid="copy-icon" />' },
        SuccessIcon: { template: '<svg data-testid="success-icon" />' }
      }
    }
  });

describe('CopyToClipboard', () => {
  afterEach(() => {
    vi.useRealTimers();
    copy.mockReset();
  });

  it('keeps the button and shows the shared success icon after copying', async () => {
    vi.useFakeTimers();
    copy.mockResolvedValue(true);
    const wrapper = mountCopyControl();
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('common.button.copy');
    expect(wrapper.find('[data-testid="copy-icon"]').exists()).toBe(true);

    await button.trigger('click');

    expect(copy).toHaveBeenCalledWith('copy me', { debug: true });
    expect(wrapper.get('button').attributes('aria-label')).toBe('common.message.copied');
    expect(wrapper.find('[data-testid="success-icon"]').exists()).toBe(true);
    expect(wrapper.get('[role="status"]').text()).toBe('common.message.copied');

    vi.advanceTimersByTime(3000);
    await nextTick();

    expect(wrapper.get('button').attributes('aria-label')).toBe('common.button.copy');
    expect(wrapper.find('[data-testid="copy-icon"]').exists()).toBe(true);
  });

  it('does not report success when the clipboard helper fails', async () => {
    copy.mockResolvedValue(false);
    const wrapper = mountCopyControl();

    await wrapper.get('button').trigger('click');

    expect(wrapper.get('button').attributes('aria-label')).toBe('common.button.copy');
    expect(wrapper.find('[data-testid="success-icon"]').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('');
  });

  it('restarts the reset timer after a repeated copy', async () => {
    vi.useFakeTimers();
    copy.mockResolvedValue(true);
    const wrapper = mountCopyControl();

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(2000);
    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.get('button').attributes('aria-label')).toBe('common.message.copied');

    vi.advanceTimersByTime(2000);
    await nextTick();

    expect(wrapper.get('button').attributes('aria-label')).toBe('common.button.copy');
  });
});
