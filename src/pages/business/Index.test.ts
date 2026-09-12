import { describe, expect, it } from 'vitest';

import Index from './Index.vue';

const heroHeadline = (site: Record<string, unknown>, fallback = 'Default marketing headline') =>
  (Index as any).computed.heroHeadline.call({
    site,
    $t: () => fallback
  });

describe('/business Site subtitle', () => {
  it('uses the configured Site description', () => {
    expect(
      heroHeadline({
        description: 'Create cinematic AI videos with Seedance 2.0.'
      })
    ).toBe('Create cinematic AI videos with Seedance 2.0.');
  });

  it('falls back to the default marketing headline when the description is empty', () => {
    expect(heroHeadline({ description: '   ' })).toBe('Default marketing headline');
    expect(heroHeadline({})).toBe('Default marketing headline');
  });
});

describe('/business referral visibility', () => {
  const resolveShowcase = (item: unknown) => item;

  it('removes the distribution story when referral entries are hidden', () => {
    const showcases = (Index as any).computed.businessShowcases.call({
      isMainSite: false,
      referralEntryVisible: false,
      resolveShowcase
    });

    expect(showcases.map((item: { key: string }) => item.key)).not.toContain('distribution');
  });

  it('keeps the distribution story for visible sites and administrators', () => {
    const showcases = (Index as any).computed.businessShowcases.call({
      isMainSite: false,
      referralEntryVisible: true,
      resolveShowcase
    });

    expect(showcases.map((item: { key: string }) => item.key)).toContain('distribution');
  });
});
