import { describe, expect, it } from 'vitest';

import {
  getMaestroLanguageName,
  getMaestroLanguageOptions,
  normalizeMaestroLanguages,
  setMaestroPrimaryLanguage
} from './maestroLanguages';

describe('Maestro language picker helpers', () => {
  it('shows localized language names instead of API codes', () => {
    expect(getMaestroLanguageName('zh-cn', 'zh-CN')).toBe('简体中文');
    expect(getMaestroLanguageName('zh-cn', 'en')).toBe('Simplified Chinese');
    expect(getMaestroLanguageOptions('zh-CN').map((option) => option.label)).toEqual([
      '简体中文',
      '英语',
      '日语',
      '韩语',
      '西班牙语',
      '法语',
      '德语'
    ]);
  });

  it('selects one output language', () => {
    expect(setMaestroPrimaryLanguage(['zh-cn', 'en', 'ja'], 'en')).toEqual(['en']);
  });

  it('normalizes empty, duplicate, and unsupported persisted languages', () => {
    expect(normalizeMaestroLanguages()).toEqual(['zh-cn']);
    expect(normalizeMaestroLanguages(['it', 'en', 'en', 'ja'])).toEqual(['en']);
  });
});
