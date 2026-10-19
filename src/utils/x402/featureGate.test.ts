import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ cookie: '', flags: {} as Record<string, boolean>, post: vi.fn(), get: vi.fn() }));
vi.mock('typescript-cookie', () => ({
  getCookie: () => state.cookie,
  setCookie: (_: string, value: string) => {
    state.cookie = value;
  },
  removeCookie: () => {
    state.cookie = '';
  }
}));
vi.mock('@/store', () => ({
  default: {
    getters: {
      get config() {
        return { features: state.flags };
      }
    }
  }
}));
vi.mock('@/operators/common', () => ({ httpClient: { post: state.post }, anonymousHttpClient: { get: state.get } }));

import { setFeatureConfigReader, syncFeaturesFromUrl } from '../featureFlag';
import { EVM_PAYMENT_NETWORKS } from './networks';
import {
  assertX402NetworkEnabled,
  filterX402Requirements,
  isX402NetworkEnabled
} from './featureGate';
import { activeEvmWallet, connectEvmWallet, setActiveEvmWallet, setActiveWalletRail } from './evmWallet';
import { buildEVMPaymentSignatureHeader } from '@/operators/x402';
import type { EvmWalletRail } from './networks';
import { orderOperator } from '@/operators/order';
import { configOperator } from '@/operators/config';

function url(features: string) {
  vi.stubGlobal('window', { location: { search: `?features=${encodeURIComponent(features)}`, protocol: 'https:' } });
  syncFeaturesFromUrl();
}

beforeEach(() => {
  vi.stubGlobal('document', {});
  state.cookie = '';
  state.flags = {};
  setFeatureConfigReader(() => ({ features: state.flags }));
  vi.clearAllMocks();
  url('none');
});

describe.each(Object.entries(EVM_PAYMENT_NETWORKS).filter(([alias]) => alias !== 'base'))(
  '%s feature flag',
  (alias, config) => {
    const network = `eip155:${parseInt(config.chainId, 16)}`;
    const flag = `x402-${alias}`;
    it('is off by default; opt-in, negative override and clear share the existing cookie contract', () => {
      expect(isX402NetworkEnabled(network)).toBe(false);
      expect(() => assertX402NetworkEnabled(network)).toThrow();
      url(flag);
      expect(isX402NetworkEnabled(network)).toBe(true);
      expect(isX402NetworkEnabled(alias)).toBe(true);
      url(`all,-${flag}`);
      expect(isX402NetworkEnabled(network)).toBe(false);
      state.flags[flag] = true;
      expect(isX402NetworkEnabled(network)).toBe(false);
      url('none');
      expect(isX402NetworkEnabled(network)).toBe(false);
      state.flags = {};
      expect(isX402NetworkEnabled(network)).toBe(false);
    });
    it('blocks a cached wallet and refuses signing after the flag closes', async () => {
      const provider = { request: vi.fn() };
      await expect(connectEvmWallet(provider, alias as EvmWalletRail)).rejects.toMatchObject({
        code: 'payment_requirements_unavailable'
      });
      expect(provider.request).not.toHaveBeenCalled();
      url(flag);
      setActiveWalletRail(alias as EvmWalletRail);
      setActiveEvmWallet({ address: '0xpayer', provider, network });
      expect(activeEvmWallet()?.address).toBe('0xpayer');
      url(`-${flag}`);
      expect(activeEvmWallet()).toBeUndefined();
      await expect(buildEVMPaymentSignatureHeader({ network } as never, provider, '0xpayer')).rejects.toMatchObject({
        code: 'payment_requirements_unavailable',
        charged: false
      });
      expect(provider.request).not.toHaveBeenCalled();
    });
    it('filters session and cached quotes and preserves existing chains', () => {
      const accepts = [{ network: 'eip155:8453' }, { network }, { network: 'solana:mainnet' }];
      expect(filterX402Requirements(accepts)).toEqual([accepts[0], accepts[2]]);
      url(flag);
      expect(filterX402Requirements(accepts)).toEqual(accepts);
      url(`-${flag}`);
      expect(filterX402Requirements([accepts[1]])).toEqual([]);
    });
    it('keeps config and payment request headers independent of UI flags', async () => {
      url(flag);
      await configOperator.get();
      await orderOperator.pay('test', { pay_way: 'X402' } as never);
      await orderOperator.payX402WithHeader('test', {} as never, 'signed');
      expect(state.get.mock.calls[0]).toEqual(['/config/']);
      expect(state.post.mock.calls[0]).toEqual(['/orders/test/pay/', { pay_way: 'X402' }]);
      expect(state.post.mock.calls[1][2].headers).toEqual({
        'PAYMENT-SIGNATURE': 'signed'
      });
    });
  }
);
