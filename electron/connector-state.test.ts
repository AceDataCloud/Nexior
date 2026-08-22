import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  _resetConnectorState,
  _resetConnectorStateCache,
  _setConnectorStateFileForTests,
  consumeConnectorState,
  isConsumedConnectorState,
  issueConnectorState
} from './connector-state';

describe('connector callback state', () => {
  const stateFile = path.join(os.tmpdir(), `connector-state-${process.pid}.json`);
  beforeEach(() => {
    fs.rmSync(stateFile, { force: true });
    _setConnectorStateFileForTests(stateFile);
    _resetConnectorState();
    vi.useRealTimers();
  });

  it('binds a connector to a single-use request', () => {
    const issued = issueConnectorState('google/drive');
    expect(consumeConnectorState(issued.state)).toEqual(issued.context);
    expect(consumeConnectorState(issued.state)).toBeNull();
    expect(isConsumedConnectorState(issued.state)).toBe(true);
  });

  it('expires after ten minutes', () => {
    vi.useFakeTimers();
    const issued = issueConnectorState('google/drive');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(consumeConnectorState(issued.state)).toBeNull();
  });
  it('rehydrates a pending callback after a process restart', () => {
    const issued = issueConnectorState('google/drive', 'consent-1:tool-1');
    _resetConnectorStateCache();
    expect(consumeConnectorState(issued.state)).toEqual(issued.context);
    expect(fs.statSync(stateFile).mode & 0o777).toBe(0o600);
  });
});
