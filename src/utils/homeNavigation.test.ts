import { describe, expect, it } from 'vitest';
import { resolveHomeNavigation } from './homeNavigation';

describe('resolveHomeNavigation', () => {
  it('accepts site routes and credential-free HTTPS links', () => {
    expect(resolveHomeNavigation('/seedance')).toEqual({ kind: 'route', to: '/seedance' });
    expect(resolveHomeNavigation('https://example.com/path')).toEqual({
      kind: 'external',
      href: 'https://example.com/path'
    });
  });

  it.each([
    '//evil.example',
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,x',
    'https://u:p@example.com',
    'https://exa mple.com',
    '\\evil'
  ])('rejects unsafe navigation %s', (value) => {
    expect(resolveHomeNavigation(value)).toBeNull();
  });
});
