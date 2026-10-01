// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import AnsweringMark from './AnsweringMark.vue';

const resources = import.meta.glob<Record<string, { message: string }>>('../../i18n/*/chat.json', {
  eager: true,
  import: 'default'
});
const messages = Object.fromEntries(
  Object.entries(resources).map(([path, content]) => [
    path.split('/').at(-2)!,
    { chat: { thinking: { inProgress: content['thinking.inProgress'].message } } }
  ])
);

describe('localized waiting label', () => {
  it.each(Object.keys(messages))('uses the %s application translation', (locale) => {
    const i18n = createI18n({ legacy: true, locale, messages });
    const wrapper = shallowMount(AnsweringMark, { global: { plugins: [i18n] } });
    expect(wrapper.get('span').text()).toBe(messages[locale].chat.thinking.inProgress);
    expect(wrapper.attributes('role')).toBe('status');
    wrapper.unmount();
  });
  it('updates existing waiting messages when the application language changes', async () => {
    const i18n = createI18n({ legacy: true, locale: 'en', messages });
    const wrapper = shallowMount(AnsweringMark, { global: { plugins: [i18n] } });
    expect(wrapper.get('span').text()).toBe('Thinking...');
    i18n.global.locale = 'zh-CN';
    await nextTick();
    expect(wrapper.get('span').text()).toBe('思考中...');
    wrapper.unmount();
  });
});
