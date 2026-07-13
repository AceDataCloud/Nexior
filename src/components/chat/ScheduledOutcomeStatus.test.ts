// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ScheduledOutcomeStatus from './ScheduledOutcomeStatus.vue';

describe('ScheduledOutcomeStatus', () => {
  it.each([
    ['success', 'fa-solid fa-circle-check'],
    ['failed', 'fa-solid fa-circle-exclamation'],
    ['needs_user_input', 'fa-solid fa-triangle-exclamation'],
    ['unknown', 'fa-solid fa-clock'],
    ['unverified', 'fa-solid fa-circle-info'],
    ['running', 'fa-solid fa-spinner']
  ] as const)('renders a distinct icon for %s', (status, icon) => {
    const wrapper = shallowMount(ScheduledOutcomeStatus, {
      props: { status, reason: 'Reason from server' },
      global: { mocks: { $t: (key: string) => key } }
    });
    expect(wrapper.findComponent({ name: 'FontAwesomeIcon' }).attributes('icon')).toBe(icon);
    expect(wrapper.text()).toContain('Reason from server');
  });
});
