import { describe, expect, it } from 'vitest';
import { toWritableSitePayload } from './site';

describe('toWritableSitePayload', () => {
  it('keeps writable Site data and removes server-derived fields', () => {
    expect(
      toWritableSitePayload({
        id: 'site-1',
        title: 'Demo',
        logo: 'color.png',
        logo_light: 'light.png',
        logo_dark: 'dark.png',
        title_source: '源标题',
        description_source: '源描述',
        auto_translated_fields: ['title'],
        features: { chatgpt: { enabled: true } },
        capability_overrides: {
          chatgpt: { display_name: 'Custom Chat', icon_url: 'https://cdn.example.com/chat.png' }
        }
      })
    ).toEqual({
      id: 'site-1',
      title: 'Demo',
      logo: 'color.png',
      logo_light: 'light.png',
      logo_dark: 'dark.png',
      features: { chatgpt: { enabled: true } }
    });
  });
});
