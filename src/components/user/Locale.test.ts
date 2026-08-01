// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Locale from './Locale.vue';

describe('user/Locale', () => {
  it('shows only the languages enabled for the current site', () => {
    const wrapper = shallowMount(Locale, {
      global: {
        mocks: {
          $i18n: { locale: 'en' },
          $route: { query: {} },
          $router: { push: () => undefined },
          $store: {
            getters: {
              site: { supported_locales: ['zh-CN', 'en', 'ja'] }
            }
          }
        }
      }
    });

    expect((wrapper.vm as unknown as { locales: { value: string }[] }).locales.map((locale) => locale.value)).toEqual([
      'en',
      'zh-CN',
      'ja'
    ]);
  });
});
