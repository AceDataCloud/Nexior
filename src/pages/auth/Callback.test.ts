import { describe, expect, it, vi } from 'vitest';
import Callback from './Callback.vue';

describe('authentication callback', () => {
  it('clears the ceremony and returns without replaying a connector install', async () => {
    const commit = vi.fn();
    const push = vi.fn();
    await (Callback.mounted as () => Promise<void>).call({
      redirect: '/console/connectors?connect=github&tab=mine',
      $store: { state: { auth: { reauthenticate: true } }, commit },
      $router: { push }
    });
    expect(commit).toHaveBeenCalledWith('setAuth', { visible: false, reauthenticate: false });
    expect(push).toHaveBeenCalledWith('/console/connectors?tab=mine');
  });
});
