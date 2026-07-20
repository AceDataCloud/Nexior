// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TabSwitcher from './TabSwitcher.vue';

describe('KlingTabSwitcher', () => {
  it('renders all scenario labels without replacing their text', () => {
    const labels: Record<string, string> = {
      'kling.tab.videoGeneration': 'Video Generation',
      'kling.tab.motionControl': 'Motion Control',
      'kling.tab.talkingPhoto': 'Talking Photo'
    };
    const wrapper = mount(TabSwitcher, {
      global: {
        mocks: { $t: (key: string) => labels[key] ?? key }
      }
    });

    expect(wrapper.text()).toContain('Video Generation');
    expect(wrapper.text()).toContain('Motion Control');
    expect(wrapper.text()).toContain('Talking Photo');
  });
});
