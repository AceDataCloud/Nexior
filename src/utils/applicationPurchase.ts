import { IApplication, IApplicationType } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router/constants';

export interface ApplicationPurchaseRoute {
  name: string;
  params: { id: string };
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
