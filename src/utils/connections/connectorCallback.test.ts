import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearConnectorCallbacks,
  consumeConnectorCallback,
  publishConnectorCallback,
  waitForConnectorCallback
} from './connectorCallback';

const result = {
  requestId: 'request-1',
  connector: 'google/drive',
  flowKey: 'consent-1:tool-1',
  status: 'success' as const
};

describe('connector callback inbox', () => {
  beforeEach(clearConnectorCallbacks);

  it('delivers a callback that arrives before its waiter', async () => {
    publishConnectorCallback(result);
    await expect(waitForConnectorCallback('request-1')).resolves.toEqual(result);
  });

  it('delivers a callback to an existing waiter', async () => {
    const pending = waitForConnectorCallback('request-1');
    publishConnectorCallback(result);
    await expect(pending).resolves.toEqual(result);
  });

  it('lets a restored conversation consume by connector', () => {
    publishConnectorCallback(result);
    expect(consumeConnectorCallback('consent-1:tool-1')).toEqual(result);
    expect(consumeConnectorCallback('consent-1:tool-1')).toBeUndefined();
  });
  it('does not deliver one connector callback to another consent flow', () => {
    publishConnectorCallback(result);
    expect(consumeConnectorCallback('consent-2:tool-2')).toBeUndefined();
    expect(consumeConnectorCallback('consent-1:tool-1')).toEqual(result);
  });
});
