import { describe, expect, it } from 'vitest';
import type { IChatModel } from '@/models';
import { resolveChatModelAccess } from './chatModelAccess';

const model = { name: 'claude-opus-5-5' } as IChatModel;

describe('chat model request access', () => {
  it('does not lock models when advisory data is unavailable', () => {
    expect(resolveChatModelAccess(model)).toEqual({ allowed: true, restricted: false });
  });

  it('uses generic keyed eligibility results', () => {
    const result = { allowed: false, restricted: true, minimum_ace_tier: 1, message: 'Tier 1 preview' };
    expect(resolveChatModelAccess(model, { 'claude-opus-5-5': result })).toEqual(result);
  });
});
