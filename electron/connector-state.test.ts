import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetConnectorState, consumeConnectorState, issueConnectorState } from './connector-state';

describe('connector callback state', () => {
  beforeEach(() => {
    _resetConnectorState();
    vi.useRealTimers();
  });

  it('accepts a state exactly once', () => {
    const issued = issueConnectorState();
    expect(consumeConnectorState(issued.state)).toBe(issued.requestId);
    expect(consumeConnectorState(issued.state)).toBeNull();
  });

  it('rejects an expired state', () => {
    vi.useFakeTimers();
    const issued = issueConnectorState();
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(consumeConnectorState(issued.state)).toBeNull();
  });
});
