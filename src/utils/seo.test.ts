// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  official: true,
  site: { title: 'Ace Data Cloud', description: 'Official description' } as Record<string, unknown>
}));

vi.mock('@/store', () => ({
  default: {
    state: {
      get site() {
        return mocks.site;
      }
    }
  }
}));
vi.mock('@/utils/siteLocales', () => ({ getSiteLocaleOptions: () => [] }));
vi.mock('@/utils/is', () => ({ isMainOfficial: () => mocks.official }));

import { setOrganization } from './seo';

function organization(): Record<string, unknown> {
  const script = document.getElementById('seo-org-ld');
  expect(script?.textContent).toBeTruthy();
  return JSON.parse(script!.textContent!);
}

describe('Organization structured data ownership', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    mocks.official = true;
    mocks.site = { title: 'Ace Data Cloud', description: 'Official description' };
  });

  it('keeps official social identity on the first-party site', () => {
    setOrganization();
    expect(organization().sameAs).toEqual([
      'https://github.com/AceDataCloud',
      'https://x.com/AceDataCloud',
      'https://studio.acedata.cloud'
    ]);
  });

  it('does not attribute official social profiles to a white-label tenant', () => {
    mocks.official = false;
    mocks.site = { title: '知数云', description: '租户描述' };
    setOrganization();
    const data = organization();
    expect(data.name).toBe('知数云');
    expect(data.description).toBe('租户描述');
    expect(data).not.toHaveProperty('sameAs');
  });
});
