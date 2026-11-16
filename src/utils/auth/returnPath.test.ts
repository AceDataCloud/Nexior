import { describe, expect, it } from 'vitest';
import { authReturnPath } from './returnPath';

describe('authReturnPath', () => {
  it('preserves local query and hash while removing only an install trigger on reauthentication', () => {
    expect(authReturnPath('/console/connectors?connect=github&tab=mine#devices', true)).toBe(
      '/console/connectors?tab=mine#devices'
    );
    expect(authReturnPath('/Console/Connectors/?connect=github&tab=mine', true)).toBe(
      '/Console/Connectors/?tab=mine'
    );
    expect(authReturnPath('/chat/123?connect=topic#draft', true)).toBe('/chat/123?connect=topic#draft');
    expect(authReturnPath('/console/connectors?connect=github')).toBe('/console/connectors?connect=github');
  });

  it.each([
    'https://outside.invalid/path',
    '//outside.invalid',
    '/\\outside.invalid',
    '/\noutside.invalid',
    'javascript:alert(1)',
    undefined
  ])('rejects unsafe return %s', (target) => expect(authReturnPath(target, true)).toBe('/'));
});
