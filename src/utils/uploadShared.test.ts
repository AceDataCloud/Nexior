import { describe, expect, it } from 'vitest';
import { matchesAccept, renameForDedup } from './uploadShared';

const makeFile = (name: string, type = ''): File => new File([new Uint8Array([1, 2, 3])], name, { type });

describe('matchesAccept', () => {
  it('accepts anything when the hint is empty', () => {
    expect(matchesAccept(makeFile('a.png'), undefined)).toBe(true);
    expect(matchesAccept(makeFile('a.png'), '')).toBe(true);
    expect(matchesAccept(makeFile('a.png'), '  ,  ')).toBe(true);
  });

  it('matches by file extension case-insensitively', () => {
    const accept = '.png,.jpg,.jpeg';
    expect(matchesAccept(makeFile('photo.PNG'), accept)).toBe(true);
    expect(matchesAccept(makeFile('photo.jpeg'), accept)).toBe(true);
    expect(matchesAccept(makeFile('clip.mp4'), accept)).toBe(false);
  });

  it('matches wildcard mime hints like image/*', () => {
    expect(matchesAccept(makeFile('x', 'image/webp'), 'image/*')).toBe(true);
    expect(matchesAccept(makeFile('x', 'video/mp4'), 'image/*')).toBe(false);
  });

  it('matches an exact mime hint', () => {
    expect(matchesAccept(makeFile('x', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(matchesAccept(makeFile('x', 'image/png'), 'application/pdf')).toBe(false);
  });
});

describe('renameForDedup', () => {
  it('keeps the extension but changes the base name', () => {
    const out = renameForDedup(makeFile('image.png', 'image/png'));
    expect(out.name).not.toBe('image.png');
    expect(out.name.endsWith('.png')).toBe(true);
    expect(out.type).toBe('image/png');
  });

  it('produces distinct names for repeated files', () => {
    const a = renameForDedup(makeFile('image.png'));
    const b = renameForDedup(makeFile('image.png'));
    expect(a.name).not.toBe(b.name);
  });

  it('gives extension-less files a .png fallback', () => {
    const out = renameForDedup(makeFile('clipboard'));
    expect(out.name.endsWith('.png')).toBe(true);
  });
});
