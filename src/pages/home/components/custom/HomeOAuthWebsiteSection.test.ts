// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://studio.example/"}
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeOAuthWebsiteSection from './HomeOAuthWebsiteSection.vue';

const section = {
  kind: 'website' as const,
  title: 'ABC',
  body: 'https://abc.example/embed',
  oauth: { client_id: 'abc-client', redirect_uri: 'https://abc.example/callback' }
};
const request = {
  type: 'acedatacloud:oauth:authorize',
  state: 'random_state_123456',
  code_challenge: 'a'.repeat(43),
  code_challenge_method: 'S256'
};
const wrappers: ReturnType<typeof mount>[] = [];
const setup = (loggedIn = true) => {
  const store = createStore({
    state: { token: loggedIn ? { access: 'studio-session' } : null, user: { id: 'alice' } },
    getters: { token: (state) => state.token, user: (state) => state.user }
  });
  const wrapper = mount(HomeOAuthWebsiteSection, {
    attachTo: document.body,
    props: { section },
    global: { plugins: [store], mocks: { $t: (key: string) => key } }
  });
  wrappers.push(wrapper);
  return { wrapper, store, app: wrapper.get('iframe').element as HTMLIFrameElement };
};
const send = (source: Window | null, origin: string, data: unknown) =>
  window.dispatchEvent(new MessageEvent('message', { source, origin, data }));
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});

describe('Studio OAuth website', () => {
  it('rejects messages from a different origin or window', async () => {
    const { wrapper, app } = setup();
    send(app.contentWindow, 'https://evil.example', request);
    send(window, 'https://abc.example', request);
    await nextTick();
    expect(wrapper.findAll('iframe')).toHaveLength(1);
  });
  it('requires login without handing the third party a session', async () => {
    const { wrapper, app } = setup(false);
    const post = vi.spyOn(app.contentWindow!, 'postMessage');
    send(app.contentWindow, 'https://abc.example', request);
    await nextTick();
    expect(post).toHaveBeenCalledWith(
      { type: 'acedatacloud:oauth:result', state: request.state, error: 'login_required' },
      'https://abc.example'
    );
    expect(wrapper.findAll('iframe')).toHaveLength(1);
  });
  it('sends the session only to AuthFrontend and returns only the authorization code to ABC', async () => {
    const { wrapper, app } = setup();
    const appPost = vi.spyOn(app.contentWindow!, 'postMessage');
    send(app.contentWindow, 'https://abc.example', request);
    await nextTick();
    const auth = wrapper.findAll('iframe')[1].element as HTMLIFrameElement;
    const authPost = vi.spyOn(auth.contentWindow!, 'postMessage');
    const ready = { type: 'acedatacloud:oauth:session-ready', state: request.state };
    send(auth.contentWindow, 'https://evil.example', ready);
    send(app.contentWindow, 'https://auth.acedata.cloud', ready);
    expect(authPost).not.toHaveBeenCalled();
    send(auth.contentWindow, 'https://auth.acedata.cloud', ready);
    expect(authPost).toHaveBeenCalledWith(
      { type: 'acedatacloud:oauth:session', state: request.state, access_token: 'studio-session' },
      'https://auth.acedata.cloud'
    );
    expect(appPost).not.toHaveBeenCalled();
    send(auth.contentWindow, 'https://auth.acedata.cloud', {
      type: 'acedatacloud:oauth:result',
      state: request.state,
      code: 'one-time-code',
      redirect_uri: section.oauth.redirect_uri
    });
    await nextTick();
    expect(appPost).toHaveBeenCalledWith(
      {
        type: 'acedatacloud:oauth:result',
        state: request.state,
        code: 'one-time-code',
        redirect_uri: section.oauth.redirect_uri
      },
      'https://abc.example'
    );
    expect(JSON.stringify(appPost.mock.calls)).not.toContain('studio-session');
    expect(wrapper.findAll('iframe')).toHaveLength(1);
  });
  it('cancels pending consent on an account change and rejects late results', async () => {
    const { wrapper, store, app } = setup();
    const appPost = vi.spyOn(app.contentWindow!, 'postMessage');
    send(app.contentWindow, 'https://abc.example', request);
    await nextTick();
    const auth = wrapper.findAll('iframe')[1].element as HTMLIFrameElement;
    store.state.user.id = 'bob';
    await nextTick();
    send(auth.contentWindow, 'https://auth.acedata.cloud', {
      type: 'acedatacloud:oauth:result',
      state: request.state,
      code: 'late-code',
      redirect_uri: section.oauth.redirect_uri
    });
    expect(appPost).not.toHaveBeenCalled();
    expect(wrapper.findAll('iframe')).toHaveLength(1);
  });
  it('rejects wrong state or callback and reports cancellation without a code', async () => {
    const { wrapper, app } = setup();
    const post = vi.spyOn(app.contentWindow!, 'postMessage');
    send(app.contentWindow, 'https://abc.example', request);
    await nextTick();
    const auth = wrapper.findAll('iframe')[1].element as HTMLIFrameElement;
    const result = {
      type: 'acedatacloud:oauth:result',
      state: request.state,
      code: 'code',
      redirect_uri: section.oauth.redirect_uri
    };
    send(auth.contentWindow, 'https://auth.acedata.cloud', { ...result, state: 'other-state' });
    send(auth.contentWindow, 'https://auth.acedata.cloud', { ...result, redirect_uri: 'https://evil.example' });
    expect(post).not.toHaveBeenCalled();
    await wrapper.get('.oauth-cancel').trigger('click');
    expect(post).toHaveBeenCalledWith(
      {
        type: 'acedatacloud:oauth:result',
        state: request.state,
        redirect_uri: section.oauth.redirect_uri,
        error: 'access_denied'
      },
      'https://abc.example'
    );
  });
});
