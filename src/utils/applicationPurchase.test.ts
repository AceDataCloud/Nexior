import { describe, expect, it } from 'vitest';
import { IApplicationType } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router/constants';
import { getApplicationPurchaseRoute } from './applicationPurchase';

describe('application purchase routing', () => {
  it('routes Usage applications to credit top-up', () => {
    expect(getApplicationPurchaseRoute({ id: 'usage-app', type: IApplicationType.USAGE })).toEqual({
      name: ROUTE_CONSOLE_APPLICATION_EXTRA,
      params: { id: 'usage-app' }
    });
  });

  it('routes Period applications to subscription checkout', () => {
    expect(getApplicationPurchaseRoute({ id: 'period-app', type: IApplicationType.PERIOD })).toEqual({
      name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
      params: { id: 'period-app' }
    });
  });

  it('fails closed without a supported type and id', () => {
    expect(getApplicationPurchaseRoute(undefined)).toBeUndefined();
    expect(getApplicationPurchaseRoute({ type: IApplicationType.USAGE })).toBeUndefined();
    expect(getApplicationPurchaseRoute({ id: 'unknown', type: 'Unknown' as IApplicationType })).toBeUndefined();
  });
});
