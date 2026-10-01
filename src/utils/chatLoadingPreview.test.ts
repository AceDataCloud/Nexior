// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChatLoadingPreviewMode } from './chatLoadingPreview';

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
