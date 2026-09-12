// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { siteOperator } from '@/operators';
import Distribution from './Distribution.vue';

vi.mock('@/operators', () => ({
  siteOperator: { update: vi.fn() }
}));

const site = {
  id: 'site-1',
  features: {
    chatgpt: { enabled: true, service_id: 'service-1' },
    referral: { enabled: true, campaign: 'custom' }
  },
  distribution: { default_inviter_id: 'admin-1' }
};

const mountSetting = () => {
  const dispatch = vi.fn().mockResolvedValue(site);
  const wrapper = shallowMount(Distribution, {
    global: {
      stubs: { SectionNotice: true, UserChip: true, EditUser: true, ElSwitch: true },
      mocks: {
        $t: (key: string) => key,
        $store: { getters: { site }, dispatch }
      }
    }
  });
  return { wrapper, dispatch };
};

describe('Distribution settings referral switch', () => {
  beforeEach(() => {
    vi.mocked(siteOperator.update)
      .mockReset()
      .mockResolvedValue(site as never);
  });

  it('deep-merges the referral toggle without replacing other features or referral keys', async () => {
    const { wrapper, dispatch } = mountSetting();

    await (wrapper.vm as any).onToggleReferralEntry(false);

    expect(siteOperator.update).toHaveBeenCalledWith(
      'site-1',
      expect.objectContaining({
        features: {
          chatgpt: { enabled: true, service_id: 'service-1' },
          referral: { enabled: false, campaign: 'custom' }
        }
      })
    );
    expect(dispatch).toHaveBeenCalledWith('getSite');
    expect((wrapper.vm as any).referralEntrySaving).toBe(false);
  });

  it('treats a missing flag as enabled for legacy sites', () => {
    const computed = (Distribution as any).computed.referralEntryEnabled;

    expect(computed.call({ site: { features: {} } })).toBe(true);
    expect(computed.call({ site: { features: { referral: { enabled: false } } } })).toBe(false);
  });
});
