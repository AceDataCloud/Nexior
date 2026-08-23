// @vitest-environment jsdom

import { effectScope, watchEffect } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gates = vi.hoisted(() => ({ web: true, enabled: true }));

vi.mock('@/utils/surface', () => ({ isWeb: () => gates.web }));
vi.mock('@/utils/featureFlag', () => ({ isFeatureEnabled: () => gates.enabled }));

const STORAGE_KEY = 'nexior:x402:payment-mode';
const loadModule = () => import('./scenarioPayment');

describe('scenario payment preference', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    localStorage.clear();
    gates.web = true;
    gates.enabled = true;
  });

  it('defaults to credits without a stored preference', async () => {
    const { scenarioPaymentState } = await loadModule();

    expect(scenarioPaymentState('openaiimage').mode).toBe('credits');
  });

  it('shares wallet mode across scenarios and restores it after reload', async () => {
    let payment = await loadModule();
    payment.setPreferredPaymentMode('wallet');

    expect(payment.scenarioPaymentState('openaiimage').mode).toBe('wallet');
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('wallet');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('wallet');

    vi.resetModules();
    payment = await loadModule();
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('wallet');
  });

  it('reactively updates already initialized scenarios', async () => {
    const payment = await loadModule();
    const nano = payment.scenarioPaymentState('nanobanana');
    const observed: string[] = [];
    const scope = effectScope();
    scope.run(() => watchEffect(() => observed.push(nano.mode)));

    payment.setPreferredPaymentMode('wallet');
    await Promise.resolve();

    expect(observed).toEqual(['credits', 'wallet']);
    scope.stop();
  });

  it('keeps quotes isolated and clears them when credits are selected', async () => {
    const payment = await loadModule();
    const openAI = payment.scenarioPaymentState('openaiimage');
    const nano = payment.scenarioPaymentState('nanobanana');
    openAI.quoteUsdc = '0.1';
    openAI.quoteLoading = true;

    expect(nano.quoteUsdc).toBeUndefined();
    expect(nano.quoteLoading).toBe(false);

    payment.setPreferredPaymentMode('credits');
    expect(openAI.quoteUsdc).toBeUndefined();
    expect(openAI.quoteLoading).toBe(false);
  });

  it('temporarily disables a scenario without changing the saved preference', async () => {
    const payment = await loadModule();
    payment.setPreferredPaymentMode('wallet');
    const kling = payment.scenarioPaymentState('kling');
    kling.quoteUsdc = '0.2';
    kling.quoteLoading = true;

    payment.setScenarioWalletAvailable('kling', false);
    expect(kling.walletAvailable).toBe(false);
    expect(kling.mode).toBe('credits');
    expect(kling.quoteUsdc).toBeUndefined();
    expect(kling.quoteLoading).toBe(false);
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('wallet');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('wallet');

    payment.setScenarioWalletAvailable('kling', true);
    expect(kling.walletAvailable).toBe(true);
    expect(kling.mode).toBe('wallet');
  });

  it('reactively applies wallet availability to the effective mode', async () => {
    const payment = await loadModule();
    payment.setPreferredPaymentMode('wallet');
    const openAI = payment.scenarioPaymentState('openaiimage');
    const observed: string[] = [];
    const scope = effectScope();
    scope.run(() => watchEffect(() => observed.push(`${openAI.walletAvailable}:${openAI.mode}`)));

    payment.setScenarioWalletAvailable('openaiimage', false);
    await Promise.resolve();
    payment.setScenarioWalletAvailable('openaiimage', true);
    await Promise.resolve();

    expect(observed).toEqual(['true:wallet', 'false:credits', 'true:wallet']);
    scope.stop();
  });

  it('centralizes supported scenarios and fails closed for unknown ones', async () => {
    const payment = await loadModule();
    payment.setPreferredPaymentMode('wallet');
    const supported = [
      'nanobanana',
      'openaiimage',
      'flux',
      'qrart',
      'luma',
      'pika',
      'pixverse',
      'hailuo',
      'veo',
      'seedance',
      'sora',
      'wan',
      'omni',
      'grokvideo',
      'minimax',
      'maestro',
      'kling',
      'digitalhuman',
      'serp',
      'suno',
      'midjourney',
      'producer',
      'chat'
    ];

    expect(supported.every(payment.isScenarioX402Supported)).toBe(true);
    expect(payment.isScenarioX402Supported('unknown')).toBe(false);
    expect(payment.scenarioPaymentState('unknown').walletAvailable).toBe(false);
    expect(payment.scenarioPaymentState('unknown').mode).toBe('credits');
  });

  it('falls back safely for invalid or unavailable storage', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid');
    let payment = await loadModule();
    expect(payment.scenarioPaymentState('openaiimage').mode).toBe('credits');

    vi.resetModules();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    payment = await loadModule();
    expect(payment.scenarioPaymentState('openaiimage').mode).toBe('credits');
  });

  it('keeps the in-memory preference when storage writes fail', async () => {
    const payment = await loadModule();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => payment.setPreferredPaymentMode('wallet')).not.toThrow();
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('wallet');
  });

  it('uses credits while x402 is unavailable without erasing wallet preference', async () => {
    const payment = await loadModule();
    payment.setPreferredPaymentMode('wallet');

    gates.enabled = false;
    expect(payment.scenarioPaymentState('openaiimage').mode).toBe('credits');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('wallet');

    gates.enabled = true;
    gates.web = false;
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('credits');

    gates.web = true;
    expect(payment.scenarioPaymentState('nanobanana').mode).toBe('wallet');
  });
});
