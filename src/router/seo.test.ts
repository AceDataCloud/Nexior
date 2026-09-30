// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router, type RouteLocationResolved } from 'vue-router';
import type { ISite } from '@/models';

const mocks = vi.hoisted(() => ({ site: undefined as ISite | undefined }));
vi.mock('@/store', () => ({
  default: {
    state: {
      get site() {
        return mocks.site;
      }
    },
    getters: {},
    dispatch: vi.fn()
  }
}));
vi.mock('@/utils/siteAnalytics', () => ({ trackSitePageView: vi.fn() }));

import { routes, setupRouterGuards } from './index';

describe('capability route SEO titles', () => {
  let router: Router;
  let afterEach: (to: RouteLocationResolved) => void;

  beforeEach(() => {
    document.head.innerHTML = '';
    mocks.site = {
      title: 'FOYTEA',
      capability_overrides: {
        chatgpt: { display_name: '  FOYTEA-CHAT  ' },
        openaiimage: { display_name: 'FOYTEA-CONCEPT' },
        qwenimage: { display_name: 'FOYTEA-IMAGE' },
        grokvideo: { display_name: 'FOYTEA-VIDEO' },
        codingBridge: { display_name: 'FOYTEA-CODE' }
      }
    } as ISite;
    router = createRouter({ history: createMemoryHistory(), routes });
    setupRouterGuards({
      onError: vi.fn(),
      beforeEach: vi.fn(),
      afterEach: (hook: typeof afterEach) => {
        afterEach = hook;
      }
    } as unknown as Router);
  });

  it.each([
    ['/chatgpt/conversations', 'FOYTEA-CHAT'],
    ['/chatgpt/conversations/example', 'FOYTEA-CHAT'],
    ['/chatgpt/call', 'FOYTEA-CHAT'],
    ['/openai-image', 'FOYTEA-CONCEPT'],
    ['/qwen-image', 'FOYTEA-IMAGE'],
    ['/grok-video', 'FOYTEA-VIDEO'],
    ['/coding-bridge', 'FOYTEA-CODE']
  ])('uses the capability name for %s and all title metadata', (path, name) => {
    afterEach(router.resolve(path));
    const title = `${name} - FOYTEA`;
    expect(document.title).toBe(title);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(title);
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(title);
    expect(JSON.parse(document.getElementById('seo-webapp-ld')!.textContent!).name).toBe(name);
  });

  it.each([undefined, { display_name: '   ' }])(
    'keeps the default title for an unset or blank override',
    (override) => {
      mocks.site!.capability_overrides = override ? { chatgpt: override } : undefined;
      afterEach(router.resolve('/chatgpt/conversations'));
      expect(document.title).toBe('ChatGPT - FOYTEA');
    }
  );

  it('reads the current site configuration on the next navigation', () => {
    afterEach(router.resolve('/chatgpt/conversations'));
    mocks.site!.capability_overrides!.chatgpt!.display_name = 'FOYTEA-RESEARCH';
    afterEach(router.resolve('/chatgpt/conversations/example'));
    expect(document.title).toBe('FOYTEA-RESEARCH - FOYTEA');
  });

  it('preserves the site title on the home page', () => {
    afterEach(router.resolve('/'));
    expect(document.title).toBe('FOYTEA');
    expect(document.getElementById('seo-webapp-ld')).toBeNull();
  });
});
