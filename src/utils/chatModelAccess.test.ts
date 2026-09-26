import { describe, expect, it } from 'vitest';
import type { IChatModel, IConfigResponse } from '@/models';
import { resolveChatModelAccess } from './chatModelAccess';

const ordinary = { name: 'claude-opus-5', earlyAccessFeature: undefined } as IChatModel;
const gated = { name: 'claude-opus-5-5', earlyAccessFeature: 'STUDIO_CLAUDE_OPUS_5_5_EARLY_ACCESS' } as IChatModel;

function config(overrides: Partial<NonNullable<IConfigResponse['early_access']>[string]> = {}): IConfigResponse {
  return {
    server_time: '2026-09-27T00:00:00Z',
    client_received_at: 1_000,
    early_access: {
      'claude-opus-5-5': {
        eligible: false,
        phase: 'holder_access',
        reason: 'tier_too_low',
        ga_at: '2026-09-29T00:00:00Z',
        minimum_ace_tier: 1,
        current_ace_tier: 0,
        ...overrides
      }
    }
  };
}

describe('chat model early access', () => {
  it('always allows ordinary models', () => {
    expect(resolveChatModelAccess(ordinary).allowed).toBe(true);
  });

  it('fails closed without trusted config', () => {
    expect(resolveChatModelAccess(gated).allowed).toBe(false);
    expect(resolveChatModelAccess(gated).reason).toBe('config_unavailable');
  });

  it('uses server-evaluated holder eligibility during the window', () => {
    expect(resolveChatModelAccess(gated, config({ eligible: true, reason: 'eligible' }), 2_000).allowed).toBe(true);
    expect(resolveChatModelAccess(gated, config(), 2_000).allowed).toBe(false);
  });

  it('keeps the kill switch authoritative after GA', () => {
    const access = resolveChatModelAccess(
      gated,
      config({ phase: 'disabled', reason: 'disabled' }),
      1_000 + 72 * 60 * 60 * 1000
    );
    expect(access.allowed).toBe(false);
  });

  it('opens at the trusted GA boundary without a second config response', () => {
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const access = resolveChatModelAccess(gated, config(), 1_000 + fortyEightHours);
    expect(access.allowed).toBe(true);
    expect(access.phase).toBe('general_availability');
  });
});
