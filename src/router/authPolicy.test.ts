import { describe, expect, it } from 'vitest';
import { requiresLogin } from './authPolicy';

describe('requiresLogin', () => {
  it.each([
    '/console',
    '/console/connectors',
    '/distribution',
    '/settings/profile',
    '/coding-bridge',
    '/poivelle',
    '/chatgpt/call',
    '/chatgpt/scheduled',
    '/chatgpt/artifacts'
  ])('protects account-owned route %s', (path) => {
    expect(requiresLogin(path)).toBe(true);
  });

  it.each([
    '/',
    '/chatgpt/conversations',
    '/chatgpt/conversations/example',
    '/nanobanana',
    '/seedance',
    '/openaiimage'
  ])('keeps guest-browsable route %s public', (path) => {
    expect(requiresLogin(path)).toBe(false);
  });

  it('does not match lookalike prefixes', () => {
    expect(requiresLogin('/consolex')).toBe(false);
    expect(requiresLogin('/chatgpt/callback')).toBe(false);
  });
});
