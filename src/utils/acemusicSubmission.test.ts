import { createStore } from 'vuex';
import { describe, expect, it } from 'vitest';
import mutations from '@/store/acemusic/mutations';
import { prepareAcemusicSubmission, pendingAcemusicSubmission, settleAcemusicSubmission } from './acemusicSubmission';
const create = (saved = {}) =>
  createStore({
    state: { user: { id: 'user-one' }, acemusic: { application: { id: 'app-one' }, submissions: saved } },
    mutations: {
      'acemusic/setSubmission': (state, value) => mutations.setSubmission(state.acemusic as any, value),
      'acemusic/clearSubmission': (state, value) => mutations.clearSubmission(state.acemusic as any, value)
    }
  });
describe('ACE Music lost-response recovery', () => {
  it('restores the same key and original request after a reload and ignores edited form values', () => {
    const store = create();
    const original = prepareAcemusicSubmission(store, 'audios', {
      action: 'generate',
      custom: false,
      prompt: 'First idea',
      async: true
    });
    const reloaded = create(JSON.parse(JSON.stringify(store.state.acemusic.submissions)));
    expect(
      prepareAcemusicSubmission(reloaded, 'audios', {
        action: 'generate',
        custom: false,
        prompt: 'Edited idea',
        async: true
      })
    ).toEqual(original);
    settleAcemusicSubmission(reloaded, original);
    expect(pendingAcemusicSubmission(reloaded, 'audios')).toBeUndefined();
    expect(
      prepareAcemusicSubmission(reloaded, 'audios', { action: 'generate', prompt: 'A new song', async: true }).key
    ).not.toBe(original.key);
  });
  it('isolates keys by authenticated user, original application and operation', () => {
    const store = create();
    const original = prepareAcemusicSubmission(store, 'lyrics', { prompt: 'Home' });
    expect(pendingAcemusicSubmission(store, 'audios')).toBeUndefined();
    store.state.acemusic.application.id = 'app-two';
    expect(pendingAcemusicSubmission(store, 'lyrics')).toBeUndefined();
    const second = prepareAcemusicSubmission(store, 'lyrics', { prompt: 'Elsewhere' });
    expect(second.key).not.toBe(original.key);
    store.state.acemusic.application.id = 'app-one';
    expect(pendingAcemusicSubmission(store, 'lyrics')).toEqual(original);
    store.state.user.id = 'user-two';
    expect(pendingAcemusicSubmission(store, 'lyrics')).toBeUndefined();
  });
});
