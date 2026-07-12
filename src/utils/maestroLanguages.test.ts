import { describe, expect, it } from 'vitest';

import {
  getMaestroLanguageName,
  getMaestroLanguageOptions,
  normalizeMaestroLanguages,
  setMaestroAdditionalLanguages,
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

  it('promotes a language to primary without dropping the previous primary', () => {
    expect(setMaestroPrimaryLanguage(['zh-cn', 'en', 'ja'], 'en')).toEqual(['en', 'zh-cn', 'ja']);
  });

  it('normalizes empty, duplicate, and unsupported persisted languages', () => {
    expect(normalizeMaestroLanguages()).toEqual(['zh-cn']);
    expect(normalizeMaestroLanguages(['it', 'en', 'en', 'ja'])).toEqual(['en', 'ja']);
  });

  it('keeps the primary first and de-duplicates additional languages', () => {
    expect(setMaestroAdditionalLanguages(['zh-cn', 'en'], ['ja', 'en', 'ja', 'zh-cn', 'it'])).toEqual([
      'zh-cn',
      'ja',
      'en'
    ]);
  });
});
