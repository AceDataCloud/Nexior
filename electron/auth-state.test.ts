import { afterEach, describe, expect, it } from 'vitest';
import { issueState, consumeState, _resetAuthState } from './auth-state';

/**
 * The state nonce binds login initiation to its callback. Key properties:
 *  - single-use (a state can't be consumed twice → no replay)
 *  - unknown candidates are rejected WITHOUT clearing other pending logins
 *    (so a local attacker can't grief a real login with a garbage callback)
 *  - multiple concurrent logins are independent
 */
describe('auth-state', () => {
  afterEach(() => _resetAuthState());

  it('accepts a freshly issued state exactly once', () => {
    const s = issueState();
    expect(consumeState(s)).toBe(true);
    expect(consumeState(s)).toBe(false); // single-use
  });

  it('rejects an unknown / foreign candidate', () => {
    expect(consumeState('not-a-real-state')).toBe(false);
    expect(consumeState(null)).toBe(false);
    expect(consumeState(undefined)).toBe(false);
    expect(consumeState('')).toBe(false);
  });

  it('a foreign candidate does NOT clear a legitimate pending login', () => {
    const real = issueState();
    expect(consumeState('attacker-garbage')).toBe(false);
    // The real login must still be valid afterwards.
    expect(consumeState(real)).toBe(true);
  });

  it('supports multiple concurrent outstanding logins independently', () => {
    const a = issueState();
    const b = issueState();
    expect(consumeState(b)).toBe(true);
    expect(consumeState(a)).toBe(true); // consuming b didn't touch a
  });

  it('issues unique states', () => {
    const states = new Set(Array.from({ length: 50 }, () => issueState()));
    expect(states.size).toBe(50);
  });
});
