import { describe, expect, it } from 'vitest';
import type { IChatModel, IConfigResponse } from '@/models';
import { resolveChatModelAccess } from './chatModelAccess';

const ordinary = { name: 'claude-opus-5' } as IChatModel;
const gated = { name: 'claude-opus-5-5', earlyAccessFeature: 'STUDIO_CLAUDE_OPUS_5_5_EARLY_ACCESS' } as IChatModel;

function config(enabled: boolean): IConfigResponse {
  return { features: { STUDIO_CLAUDE_OPUS_5_5_EARLY_ACCESS: enabled } };
}

describe('chat model early access', () => {
  it('always allows ordinary models', () => {
    expect(resolveChatModelAccess(ordinary).allowed).toBe(true);
  });

  it('fails closed without config', () => {
    expect(resolveChatModelAccess(gated)).toEqual({ allowed: false, reason: 'config_unavailable' });
  });

  it('uses the server-evaluated feature boolean', () => {
    expect(resolveChatModelAccess(gated, config(true)).allowed).toBe(true);
    expect(resolveChatModelAccess(gated, config(false))).toEqual({ allowed: false, reason: 'holder_required' });
  });
});
