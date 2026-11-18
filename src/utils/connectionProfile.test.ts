import { describe, expect, it } from 'vitest';
import { connectionProfile } from './connectionProfile';

describe('connection profile display', () => {
  it('resolves cookie and personal-token identity aliases without requiring OAuth fields', () => {
    expect(
      connectionProfile({
        display_name: '技术博客',
        username: 'writer',
        avatar_url: '//images.example.com/avatar.jpg',
        profile_url: 'https://blog.example.com/writer'
      })
    ).toMatchObject({
      name: '技术博客',
      login: 'writer',
      subtext: 'writer',
      avatar: 'https://images.example.com/avatar.jpg',
      url: 'https://blog.example.com/writer'
    });
  });

  it('keeps canonical display fields and embedded raster avatars', () => {
    const avatar = 'data:image/png;base64,aGVsbG8=';
    expect(connectionProfile({ name: 'Author', login: 'writer', email: 'author@example.com', avatar })).toMatchObject({
      name: 'Author',
      subtext: 'author@example.com',
      avatar
    });
  });

  it('uses a public account ID when no name is available and ignores malformed fields', () => {
    expect(
      connectionProfile({ id: 123, name: {}, email: [], avatar: { url: 'https://example.com/a.png' } } as any)
    ).toMatchObject({ name: '123', avatar: '', subtext: '' });
    expect(connectionProfile(undefined).name).toBe('');
  });

  it('discards unsafe links, credential-bearing URLs and non-image data', () => {
    expect(
      connectionProfile({
        name: 'Writer',
        avatar: 'data:image/svg+xml;base64,aGVsbG8=',
        picture: 'javascript:alert(1)',
        profile_url: 'https://token@example.com/me',
        url: 'javascript:alert(1)'
      })
    ).toMatchObject({ avatar: '', url: '' });
  });
});
