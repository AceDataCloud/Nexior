// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChatLoadingPreviewMode, getChatParticlePreviewOptions } from './chatLoadingPreview';

afterEach(() => {
  vi.unstubAllEnvs();
  history.replaceState(null, '', '/');
});
describe('chat loading preview gate', () => {
  it('ignores the query in normal builds', () => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'false');
    history.replaceState(null, '', '/chatgpt/conversations?loading_preview=waiting');
    expect(getChatLoadingPreviewMode()).toBeUndefined();
  });
  it.each(['waiting', 'thinking'] as const)('enables %s only in an explicit preview build', (mode) => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'true');
    history.replaceState(null, '', `/chatgpt/conversations?loading_preview=${mode}`);
    expect(getChatLoadingPreviewMode()).toBe(mode);
  });
  it.each([
    '/claude/conversations?loading_preview=waiting',
    '/chatgpt/conversations',
    '/chatgpt/conversations?loading_preview=other'
  ])('ignores unrelated or invalid URLs: %s', (path) => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'true');
    history.replaceState(null, '', path);
    expect(getChatLoadingPreviewMode()).toBeUndefined();
  });
});

describe('particle style/speed preview options', () => {
  it('ignores style and speed outside the explicitly enabled fixture', () => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'false');
    history.replaceState(
      null,
      '',
      '/chatgpt/conversations?loading_preview=waiting&particle_style=helix&particle_speed=4'
    );
    expect(getChatParticlePreviewOptions()).toEqual({ variant: 'sphere', speed: 1 });
  });
  it.each(['sphere', 'orbit', 'helix'])('accepts the %s variant in preview', (variant) => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'true');
    history.replaceState(
      null,
      '',
      `/chatgpt/conversations?loading_preview=waiting&particle_style=${variant}&particle_speed=2`
    );
    expect(getChatParticlePreviewOptions()).toEqual({ variant, speed: 2 });
  });
  it.each(['NaN', '-2', '100'])('falls back for invalid speeds: %s', (speed) => {
    vi.stubEnv('VITE_CHAT_LOADING_PREVIEW', 'true');
    history.replaceState(
      null,
      '',
      `/chatgpt/conversations?loading_preview=waiting&particle_style=unknown&particle_speed=${speed}`
    );
    expect(getChatParticlePreviewOptions()).toEqual({ variant: 'sphere', speed: 1 });
  });
});
