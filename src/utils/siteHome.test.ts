import { describe, expect, it } from 'vitest';
import {
  getHiddenCategoryIds,
  getHiddenDefaultBannerIds,
  isHomeSectionEnabled,
  withHiddenCategoryIds,
  withHiddenDefaultBannerIds,
  withHomeSectionEnabled
} from './siteHome';

describe('site home settings', () => {
  it('keeps sections enabled until explicitly disabled', () => {
    expect(isHomeSectionEnabled(undefined, 'showcase')).toBe(true);
    expect(isHomeSectionEnabled({ home: { sections: { showcase: {} } } }, 'showcase')).toBe(true);
    expect(isHomeSectionEnabled({ home: { sections: { showcase: { enabled: false } } } }, 'showcase')).toBe(false);
  });

  it('only reads canonical disabled item lists', () => {
    expect([
      ...getHiddenDefaultBannerIds({ home: { sections: { banner: { disabled_item_ids: ['maestro'] } } } })
    ]).toEqual(['maestro']);
    expect([
      ...getHiddenDefaultBannerIds({ metadata: { nexior: { hidden_default_banner_ids: ['legacy'] } } } as any)
    ]).toEqual([]);
    expect([
      ...getHiddenCategoryIds({
        home: { sections: { categories: { disabled_item_ids: ['music', 'other', 2 as any] } } }
      })
    ]).toEqual(['music']);
  });

  it('updates owned sections while preserving home siblings', () => {
    const site = { home: { sections: { banner: { enabled: true } } } };
    expect(withHomeSectionEnabled(site, 'showcase', false)).toEqual({
      sections: { banner: { enabled: true }, showcase: { enabled: false } }
    });
    expect(withHiddenDefaultBannerIds(site, ['maestro'])).toEqual({
      sections: { banner: { enabled: true, disabled_item_ids: ['maestro'] } }
    });
    expect(withHiddenCategoryIds(site, ['music', 'music'])).toEqual({
      sections: { banner: { enabled: true }, categories: { disabled_item_ids: ['music'] } }
    });
  });
});
