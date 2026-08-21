import { IApplication, IApplicationScope, IApplicationType, IPackageType, ISite } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router/constants';
import { isRechargeDisabled } from './site';

export interface ApplicationPurchaseRoute {
  name: string;
  params: { id: string };
}

export interface ApplicationPurchaseOptions {
  ios?: boolean;
}

export function getApplicationPurchaseRoute(
  application: IApplication | undefined
): ApplicationPurchaseRoute | undefined {
  if (!application?.id) return undefined;

  if (application.type === IApplicationType.USAGE) {
    return { name: ROUTE_CONSOLE_APPLICATION_EXTRA, params: { id: application.id } };
  }
  if (application.type === IApplicationType.PERIOD) {
    return { name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE, params: { id: application.id } };
  }
  return undefined;
}

export function canPurchaseApplication(
  application: IApplication | undefined,
  site?: ISite | null,
  options: ApplicationPurchaseOptions = {}
): boolean {
  if (!getApplicationPurchaseRoute(application)) return false;
  if (application?.role === 'grantee' || isRechargeDisabled(site)) return false;
  if (!options.ios) return true;
  if (application?.scope === IApplicationScope.GLOBAL) return true;
  if (application?.type === IApplicationType.PERIOD) return false;
  return (application?.packages || []).some(
    (item) => item.type === IPackageType.USAGE && Boolean(item.metadata?.apple_product_id)
  );
}
