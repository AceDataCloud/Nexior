import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n, loadLocaleMessages, setBrandSiteResolver } from './index';

let site: { title: string } | undefined;

beforeAll(async () => {
  await loadLocaleMessages('zh-CN');
});

beforeEach(() => {
  site = undefined;
  setBrandSiteResolver(() => site as never);
  i18n.global.locale = 'zh-CN';
});

describe('brand post-translation', () => {
  it('uses the latest Site without rebuilding i18n', () => {
    expect(i18n.global.t('common.customers.comment3')).toContain('Ace Data Cloud');
    site = { title: '知数云' };
    expect(i18n.global.t('common.customers.comment3')).toContain('我喜欢知数云的服务');
  });

  it('normalizes Chinese boundaries but keeps Latin brands spaced', () => {
    site = { title: '知数云' };
    expect(i18n.global.t('common.customers.comment1')).toMatch(/^知数云为/);
    expect(i18n.global.t('common.settings.apiServiceTip')).toBe('本站 API 服务由知数云提供。');
    site = { title: 'Zhishu Cloud' };
    expect(i18n.global.t('common.settings.apiServiceTip')).toBe('本站 API 服务由 Zhishu Cloud 提供。');
  });
});
