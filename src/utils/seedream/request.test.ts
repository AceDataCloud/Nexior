import { describe, expect, it } from 'vitest';
import { buildSeedreamRequest } from './request';
import { getCompatibleSeedreamAction } from './capabilities';

describe('buildSeedreamRequest', () => {
  it('does not send UI action or saved references in generate mode', () => {
    expect(
      buildSeedreamRequest({ action: 'generate', prompt: 'A lighthouse', image: ['https://cdn.example/ref.png'] })
    ).toEqual({ prompt: 'A lighthouse', async: true });
  });

  it('sends saved references after switching back to edit mode', () => {
    expect(buildSeedreamRequest({ action: 'edit', image: ['https://cdn.example/ref.png'] })).toEqual({
      image: ['https://cdn.example/ref.png'],
      async: true
    });
  });

  it('normalizes actions for text-only and edit-only models', () => {
    expect(getCompatibleSeedreamAction('edit', 'doubao-seedream-3-0-t2i-250415')).toBe('generate');
    expect(getCompatibleSeedreamAction('generate', 'doubao-seededit-3-0-i2i-250628')).toBe('edit');
  });
});
