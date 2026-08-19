import { describe, expect, it } from 'vitest';
import { IApplicationScope, IApplicationType, IPackageType } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router/constants';
import { canPurchaseApplication, getApplicationPurchaseRoute } from './applicationPurchase';

const usageApplication = { id: 'usage-app', type: IApplicationType.USAGE, scope: IApplicationScope.INDIVIDUAL };

describe('application purchase routing', () => {
  it('routes Usage applications to credit top-up', () => {
    expect(getApplicationPurchaseRoute(usageApplication)).toEqual({
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

  it('allows supported owner applications when recharge is enabled', () => {
    expect(canPurchaseApplication(usageApplication, { features: {} })).toBe(true);
  });

  it('blocks grantees and recharge-disabled sites', () => {
    expect(canPurchaseApplication({ ...usageApplication, role: 'grantee' }, { features: {} })).toBe(false);
    expect(canPurchaseApplication(usageApplication, { metadata: { disable_recharge: true } })).toBe(false);
  });

  it('applies the existing iOS purchase availability rules', () => {
    expect(
      canPurchaseApplication({ ...usageApplication, scope: IApplicationScope.GLOBAL }, { features: {} }, { ios: true })
    ).toBe(true);
    expect(
      canPurchaseApplication(
        { id: 'period-app', type: IApplicationType.PERIOD, scope: IApplicationScope.INDIVIDUAL },
        { features: {} },
        { ios: true }
      )
    ).toBe(false);
    expect(canPurchaseApplication(usageApplication, { features: {} }, { ios: true })).toBe(false);
    expect(
      canPurchaseApplication(
        {
          ...usageApplication,
          packages: [
            {
              id: 'apple-package',
              amount: 10,
              price: 1,
              type: IPackageType.USAGE,
              metadata: { apple_product_id: 'credits.10' }
            }
          ]
        },
        { features: {} },
        { ios: true }
      )
    ).toBe(true);
  });
});
