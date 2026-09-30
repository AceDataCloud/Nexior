// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { getCookie } from 'typescript-cookie';
import Locale from './Locale.vue';

vi.mock('@/i18n', () => ({ setI18nLanguage: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/utils', () => ({ getDomain: () => undefined }));

describe('user/Locale', () => {
  it('refreshes translated site copy with the newly selected language cookie', async () => {
    const site = { supported_locales: ['zh-CN', 'en'], home: { scenes: [{ title: 'Brand Launch' }] } };
    const requestedLocales: (string | undefined)[] = [];
    const store = {
      getters: { site },
      dispatch: vi.fn(async () => {
        const locale = getCookie('LOCALE');
        requestedLocales.push(locale);
        site.home.scenes[0].title = locale === 'zh-CN' ? '品牌启动' : 'Brand Launch';
      })
    };
    const wrapper = shallowMount(Locale, {
      global: {
        mocks: {
          $i18n: { locale: 'en' },
          $route: { query: {} },
          $router: { push: vi.fn() },
          $store: store
        }
      }
    });
    const vm = wrapper.vm as unknown as { onSelectLocale: (locale: string) => Promise<void> };

    await vm.onSelectLocale('zh-CN');
    expect(site.home.scenes[0].title).toBe('品牌启动');
    await vm.onSelectLocale('en');
    expect(site.home.scenes[0].title).toBe('Brand Launch');
    expect(requestedLocales).toEqual(['zh-CN', 'en']);
    expect(store.dispatch).toHaveBeenCalledWith('getSite');
    wrapper.unmount();
  });

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
