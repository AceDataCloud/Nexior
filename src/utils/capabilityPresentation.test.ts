import { describe, expect, it } from 'vitest';
import { resolveCapabilityPresentation } from './capabilityPresentation';

describe('resolveCapabilityPresentation', () => {
  it('uses platform defaults when no override exists', () => {
    expect(resolveCapabilityPresentation(undefined, 'chatgpt', 'ChatGPT', '/chatgpt.png')).toEqual({
      displayName: 'ChatGPT',
      iconUrl: '/chatgpt.png',
      isOverridden: false
    });
  });

  it('resolves name and icon independently', () => {
    expect(
      resolveCapabilityPresentation(
        { capability_overrides: { chatgpt: { display_name: '  My Assistant  ', icon_url: null } } },
        'chatgpt',
        'ChatGPT',
        '/chatgpt.png'
      )
    ).toEqual({ displayName: 'My Assistant', iconUrl: '/chatgpt.png', isOverridden: true });

    expect(
      resolveCapabilityPresentation(
        { capability_overrides: { grok: { display_name: '', icon_url: 'https://cdn.example.com/grok.png' } } },
        'grok',
        'Grok',
        '/grok.png'
      )
    ).toEqual({ displayName: 'Grok', iconUrl: 'https://cdn.example.com/grok.png', isOverridden: true });
  });
});
