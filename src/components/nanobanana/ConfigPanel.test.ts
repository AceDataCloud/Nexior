// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  walletMode: true,
  paymentState: {
    mode: 'wallet' as 'wallet' | 'credits',
    quoteUsdc: undefined as string | undefined,
    quoteLoading: false
  }
}));

vi.mock('@/operators', () => ({ nanobananaOperator: { quote: mocks.quote } }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => true,
  scenarioPaymentState: () => ({
    ...mocks.paymentState,
    get mode() {
      return mocks.walletMode ? 'wallet' : 'credits';
    },
    set quoteUsdc(value: string | undefined) {
      mocks.paymentState.quoteUsdc = value;
    },
    get quoteUsdc() {
      return mocks.paymentState.quoteUsdc;
    },
    set quoteLoading(value: boolean) {
      mocks.paymentState.quoteLoading = value;
    },
    get quoteLoading() {
      return mocks.paymentState.quoteLoading;
    }
  })
}));

import ConfigPanel from './ConfigPanel.vue';

const mountPanel = (prompt = '') => {
  const config = reactive({ model: 'nano-banana', prompt });
  const wrapper = shallowMount(ConfigPanel, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            nanobanana: {
              config,
              service: { cost: [] }
            }
          }
        }
      }
    }
  });
  return { config, wrapper };
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('nanobanana/ConfigPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.walletMode = true;
    mocks.paymentState.quoteUsdc = undefined;
    mocks.paymentState.quoteLoading = false;
  });

  it('disables generation and skips wallet quotes for blank prompts', async () => {
    const { wrapper } = mountPanel(' \t\n ');

    await vi.advanceTimersByTimeAsync(400);

    expect((wrapper.vm as any).canGenerate).toBe(false);
    expect(wrapper.findComponent({ name: 'ElButton' }).props('disabled')).toBe(true);
    expect(mocks.quote).not.toHaveBeenCalled();
  });

  it('quotes a trimmed valid prompt once', async () => {
    mocks.quote.mockResolvedValue({ amountUsdc: '0.0123' });
    const { wrapper } = mountPanel('  banana  ');

    await vi.advanceTimersByTimeAsync(400);
    await flushPromises();

    expect(mocks.quote).toHaveBeenCalledOnce();
    expect(mocks.quote).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'banana', action: 'generate', async: true }),
      undefined
    );
    expect(mocks.paymentState.quoteUsdc).toBe('0.0123');
    expect(mocks.paymentState.quoteLoading).toBe(false);
    expect(wrapper.findComponent({ name: 'ElButton' }).props('disabled')).toBe(false);
  });

  it('cancels a scheduled quote when the prompt is cleared', async () => {
    const { config } = mountPanel('banana');
    config.prompt = '   ';
    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.quote).not.toHaveBeenCalled();
    expect(mocks.paymentState.quoteUsdc).toBeUndefined();
    expect(mocks.paymentState.quoteLoading).toBe(false);
  });

  it('does not apply a stale quote after the prompt changes', async () => {
    const first = deferred<{ amountUsdc: string }>();
    mocks.quote.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ amountUsdc: '0.0222' });
    const { config } = mountPanel('first prompt');

    await vi.advanceTimersByTimeAsync(400);
    expect(mocks.quote).toHaveBeenCalledOnce();

    config.prompt = 'second prompt';
    await Promise.resolve();
    first.resolve({ amountUsdc: '0.0111' });
    await flushPromises();

    expect(mocks.paymentState.quoteUsdc).toBeUndefined();

    await vi.advanceTimersByTimeAsync(400);
    await flushPromises();

    expect(mocks.quote).toHaveBeenCalledTimes(2);
    expect(mocks.quote).toHaveBeenLastCalledWith(expect.objectContaining({ prompt: 'second prompt' }), undefined);
    expect(mocks.paymentState.quoteUsdc).toBe('0.0222');
  });

  it('does not apply a stale quote after the prompt is cleared', async () => {
    const pending = deferred<{ amountUsdc: string }>();
    mocks.quote.mockReturnValue(pending.promise);
    const { config } = mountPanel('banana');

    await vi.advanceTimersByTimeAsync(400);
    expect(mocks.quote).toHaveBeenCalledOnce();
    expect(mocks.paymentState.quoteLoading).toBe(true);

    config.prompt = '';
    await Promise.resolve();
    pending.resolve({ amountUsdc: '0.0999' });
    await flushPromises();

    expect(mocks.paymentState.quoteUsdc).toBeUndefined();
    expect(mocks.paymentState.quoteLoading).toBe(false);
  });

  it('never quotes in credits mode', async () => {
    mocks.walletMode = false;
    mountPanel('banana');

    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.quote).not.toHaveBeenCalled();
  });
});
