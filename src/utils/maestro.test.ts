import { describe, expect, it } from 'vitest';
import { buildMaestroGenerateRequest } from './maestro';

describe('buildMaestroGenerateRequest', () => {
  it('defaults to omitting customization fields when the toggle is unset', () => {
    expect(
      buildMaestroGenerateRequest({
        prompt: 'Launch video',
        scenario: 'avatar',
        style: 'cinematic',
        voice: 'warm-female'
      })
    ).toEqual({ prompt: 'Launch video' });
  });

  it('omits customization fields while customization is disabled', () => {
    expect(
      buildMaestroGenerateRequest({
        customization_enabled: false,
        prompt: 'Launch video',
        scenario: 'avatar',
        style: 'cinematic',
        voice: 'warm-female'
      })
    ).toEqual({ prompt: 'Launch video' });
  });

  it('includes customization fields while customization is enabled', () => {
    expect(
      buildMaestroGenerateRequest({
        customization_enabled: true,
        prompt: 'Launch video',
        scenario: 'avatar',
        style: 'cinematic',
        voice: 'warm-female'
      })
    ).toEqual({
      prompt: 'Launch video',
      scenario: 'avatar',
      style: 'cinematic',
      voice: 'warm-female'
    });
  });
});
