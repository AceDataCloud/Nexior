// @vitest-environment node
import { describe, expect, it } from 'vitest';
import Navigator from './Navigator.vue';
import { CHAT_MODEL_ICON_CHATGPT } from '@/constants';

function buildLinks(failed = false) {
  const computed = Navigator.computed as unknown as { links: () => Array<Record<string, unknown>> };
  return computed.links.call({
    $t: (key: string) => (key === 'common.nav.chatgpt' ? 'ChatGPT' : key),
    $store: {
      state: {
        site: {
          features: { chatgpt: { enabled: true } },
          capability_overrides: {
            chatgpt: {
              display_name: 'My Assistant',
              icon_url: 'https://cdn.example.com/chatgpt.png'
            }
          }
        }
      }
    },
    failedCapabilityIcons: failed ? { chatgpt: true } : {}
  });
}

describe('Navigator capability overrides', () => {
  it('uses the localized custom name and icon without changing the route', () => {
    const [link] = buildLinks();
    expect(link.displayName).toBe('My Assistant');
    expect(link.logo).toBe('https://cdn.example.com/chatgpt.png');
    expect(link.defaultLogo).toBe(CHAT_MODEL_ICON_CHATGPT);
    expect(link.capability).toBe('chatgpt');
  });

  it('falls back to the bundled icon after a custom icon load failure', () => {
    const [link] = buildLinks(true);
    expect(link.displayName).toBe('My Assistant');
    expect(link.logo).toBe(CHAT_MODEL_ICON_CHATGPT);
  });
});
