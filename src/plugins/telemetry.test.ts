import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  initTelemetry: vi.fn(),
  setUser: vi.fn(),
  captureError: vi.fn(),
  trackApiFailure: vi.fn(),
  isInitialized: vi.fn()
}));

vi.mock('@acedatacloud/core/telemetry', () => ({
  createTelemetry: () => mocks
}));

vi.mock('@/utils/requestAuth', () => ({
  isAuthTransitionError: () => false
}));

import {
  instrumentGeneration,
  isVerifiedSubsite,
  trackGenerationTerminal,
  trackVerifiedSubsiteLoaded
} from './telemetry';

describe('generation telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves the legacy generation_success event for accepted submissions', async () => {
    await expect(instrumentGeneration('flux', Promise.resolve({ data: { id: 'accepted-task' } }))).resolves.toEqual({
      data: { id: 'accepted-task' }
    });

    expect(mocks.track).toHaveBeenNthCalledWith(1, 'generation_submit', { service: 'flux' });
    expect(mocks.track).toHaveBeenNthCalledWith(2, 'generation_success', {
      service: 'flux',
      task_id: 'accepted-task'
    });
    expect(mocks.track).not.toHaveBeenCalledWith('generation_terminal_success', expect.anything());
  });

  it('emits terminal success once only after a correlated successful terminal state', async () => {
    await instrumentGeneration('veo', Promise.resolve({ data: { task_id: 'terminal-task' } }));
    mocks.track.mockClear();

    trackGenerationTerminal('terminal-task', true);
    trackGenerationTerminal('terminal-task', true);

    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith('generation_terminal_success', {
      service: 'veo',
      task_id: 'terminal-task'
    });
  });

  it('does not turn an explicit terminal failure into later success', async () => {
    await instrumentGeneration('kling', Promise.resolve({ id: 'failed-task' }));
    mocks.track.mockClear();

    trackGenerationTerminal('failed-task', false);
    trackGenerationTerminal('failed-task', true);

    expect(mocks.track).not.toHaveBeenCalled();
  });
});

describe('verified subsite telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires a server site id and an exact matching Studio subdomain', () => {
    const site = { id: 'site-1', origin: 'brand.studio.acedata.cloud' };

    expect(isVerifiedSubsite(site, 'brand.studio.acedata.cloud')).toBe(true);
    expect(isVerifiedSubsite(site, 'studio.acedata.cloud')).toBe(false);
    expect(isVerifiedSubsite(site, 'other.studio.acedata.cloud')).toBe(false);
    expect(isVerifiedSubsite({ origin: site.origin }, site.origin)).toBe(false);
    expect(isVerifiedSubsite({ id: 'custom', origin: 'brand.example.com' }, 'brand.example.com')).toBe(false);
  });

  it('emits loaded only for the verified destination', () => {
    const site = { id: 'site-2', origin: 'loaded.studio.acedata.cloud' };

    trackVerifiedSubsiteLoaded(site, 'loaded.studio.acedata.cloud');
    trackVerifiedSubsiteLoaded(site, 'different.studio.acedata.cloud');

    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith('subsite_loaded', {
      site_id: 'site-2',
      site_origin: 'loaded.studio.acedata.cloud'
    });
  });
});
