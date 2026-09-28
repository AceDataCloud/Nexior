import { describe, expect, it } from 'vitest';
import { withHomeScenes } from './siteHome';

describe('withHomeScenes', () => {
  it('preserves banners and showcase controls while updating scenes', () => {
    const home = withHomeScenes(
      { home: { sections: { banner: { disabled_item_ids: ['maestro'] }, showcase: { enabled: false } } } },
      [{ id: 'video', title: 'Product ad', description: '', tools: [{ capability: 'seedance' }] }],
      'Start here'
    );
    expect(home.sections?.banner?.disabled_item_ids).toEqual(['maestro']);
    expect(home.sections?.showcase?.enabled).toBe(false);
    expect(home.scenes?.[0].tools[0].capability).toBe('seedance');
    expect(home.heading).toBe('Start here');
  });
});
