import { describe, expect, it } from 'vitest';
import {
  BROWSER_TOOL_EXECUTION_STATES,
  isBrowserToolExecutionState,
  reduceBrowserToolExecution,
  sanitizeBrowserOrigin
} from './browserToolExecution';

describe('reduceBrowserToolExecution', () => {
  it('advances through durable browser execution phases without regressing', () => {
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'executing', origin: 'https://example.com' },
        { execution_state: 'awaiting_device', origin: 'https://example.com/late-event?secret=1' }
      )
    ).toEqual({ execution_state: 'executing', origin: 'https://example.com' });
  });

  it.each(['completed', 'denied', 'expired', 'cancel_too_late'] as const)(
    'keeps terminal state %s immutable',
    (executionState) => {
      expect(
        reduceBrowserToolExecution(
          { execution_state: executionState, origin: 'https://original.example' },
          { execution_state: 'executing', origin: 'https://example.com/path' }
        )
      ).toEqual({ execution_state: executionState, origin: 'https://original.example' });
    }
  );

  it('allows state changes within a pre-execution phase', () => {
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'device_offline' },
        { execution_state: 'awaiting_device', origin: 'https://example.com/path' }
      )
    ).toEqual({ execution_state: 'awaiting_device', origin: 'https://example.com' });
  });

  it('rejects peer-state regressions without a newer forward transition', () => {
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'awaiting_device' },
        { execution_state: 'device_offline', origin: 'https://late.example' }
      )
    ).toEqual({ execution_state: 'awaiting_device' });
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'takeover_required' },
        { execution_state: 'awaiting_local_approval' }
      )
    ).toEqual({ execution_state: 'takeover_required' });
  });

  it('rejects stale sequence updates and accepts newer forward transitions', () => {
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'awaiting_device', execution_sequence: 4, origin: 'https://original.example' },
        { execution_state: 'executing', execution_sequence: 3, origin: 'https://stale.example' }
      )
    ).toEqual({
      execution_state: 'awaiting_device',
      execution_sequence: 4,
      origin: 'https://original.example'
    });
    expect(
      reduceBrowserToolExecution(
        { execution_state: 'awaiting_device', execution_sequence: 4 },
        { execution_state: 'executing', execution_sequence: 5 }
      )
    ).toEqual({ execution_state: 'executing', execution_sequence: 5 });
  });
});

describe('isBrowserToolExecutionState', () => {
  it.each(BROWSER_TOOL_EXECUTION_STATES)('accepts durable state %s', (state) => {
    expect(isBrowserToolExecutionState(state)).toBe(true);
  });

  it.each(['failed', 'running', '', null])('rejects unsupported state %s', (state) => {
    expect(isBrowserToolExecutionState(state)).toBe(false);
  });
});

describe('sanitizeBrowserOrigin', () => {
  it('keeps only the HTTP origin', () => {
    expect(sanitizeBrowserOrigin('https://user:password@Example.com:8443/private?q=secret#fragment')).toBe(
      'https://example.com:8443'
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,secret', 'not a URL', ''])('rejects unsafe origin %s', (origin) => {
    expect(sanitizeBrowserOrigin(origin)).toBeUndefined();
  });
});
