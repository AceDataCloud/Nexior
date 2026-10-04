// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { siteOperator } from '@/operators';
import Distribution from './Distribution.vue';

vi.mock('@/operators', () => ({
  siteOperator: { get: vi.fn(), update: vi.fn() }
}));

const site = {
  id: 'site-1',
  features: {
    chatgpt: { enabled: true, service_id: 'service-1', assistant_configured: true },
    referral: { enabled: true, campaign: 'custom' }
  },
  distribution: { default_inviter_id: 'admin-1' }
};

const managementSite = {
  ...site,
  configuration_revision: 7,
  features: {
    chatgpt: {
      enabled: true,
      service_id: 'service-1',
      assistant: { instructions: 'Private site guidance', skills: [{ id: 'skill-1' }] }
    },
    referral: { enabled: true, campaign: 'latest' }
  }
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
    vi.mocked(siteOperator.get)
      .mockReset()
      .mockResolvedValue({ data: managementSite } as never);
    vi.mocked(siteOperator.update)
      .mockReset()
      .mockResolvedValue(site as never);
  });

  it('preserves private assistants and latest referral settings using the management revision', async () => {
    const { wrapper, dispatch } = mountSetting();

    await (wrapper.vm as any).onToggleReferralEntry(false);

    expect(siteOperator.get).toHaveBeenCalledWith('site-1');
    expect(siteOperator.update).toHaveBeenCalledWith(
      'site-1',
      expect.objectContaining({
        features: {
          chatgpt: managementSite.features.chatgpt,
          referral: { enabled: false, campaign: 'latest' }
        }
      }),
      7
    );
    expect(dispatch).toHaveBeenCalledWith('getSite');
    expect((wrapper.vm as any).referralEntrySaving).toBe(false);
  });

  it('does not fall back to public configuration when the management read fails', async () => {
    vi.mocked(siteOperator.get).mockRejectedValue(new Error('Unavailable'));
    const { wrapper } = mountSetting();

    await (wrapper.vm as any).onToggleReferralEntry(false);

    expect(siteOperator.update).not.toHaveBeenCalled();
    expect((wrapper.vm as any).referralEntrySaving).toBe(false);
  });

  it('does not retry a revision conflict with stale configuration', async () => {
    vi.mocked(siteOperator.update).mockRejectedValue({ response: { status: 409 } });
    const { wrapper, dispatch } = mountSetting();

    await (wrapper.vm as any).onToggleReferralEntry(false);

    expect(siteOperator.update).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
    expect((wrapper.vm as any).referralEntrySaving).toBe(false);
  });

  it('treats a missing flag as enabled for legacy sites', () => {
    const computed = (Distribution as any).computed.referralEntryEnabled;

    expect(computed.call({ site: { features: {} } })).toBe(true);
    expect(computed.call({ site: { features: { referral: { enabled: false } } } })).toBe(false);
  });
});
