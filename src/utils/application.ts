import { IApplication, IApplicationType } from '@/models';

/**
 * Get is application expired
 * @param application
 * @returns boolean
 */
export function isApplicationExpired(application: IApplication) {
  if (!application?.expired_at) {
    return false;
  }
  try {
    const expiredAt = new Date(application?.expired_at);
    return expiredAt < new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Get is application has balance
 * @param application
 * @returns boolean
 */
export function isApplicationExhausted(application: IApplication) {
  console.debug('application remaining amount', application, application?.remaining_amount);
  return application?.remaining_amount && application?.remaining_amount < 0;
}

/**
 * Get is application is valid, has balance and not expired
 * @param application
 * @returns boolean
 */
export function isApplicationUsable(application: IApplication) {
  const isExhausted = isApplicationExhausted(application);
  const isExpired = isApplicationExpired(application);
  console.debug('is application exhausted', isExhausted);
  console.debug('is application expired', isExpired);
  return !isExhausted && !isExpired;
}

/**
 * get final application from applications
 * @param applications
 * @returns application
 */
export function getFinalApplication(
  applications: IApplication[],
  currentApplication?: IApplication
): IApplication | undefined {
  console.debug('start to execute getFinalApplication', applications, currentApplication);
  if (
    currentApplication &&
    isApplicationUsable(currentApplication) &&
    applications?.some((app) => app.id === currentApplication.id)
  ) {
    console.debug('current application is usable', currentApplication);
    return currentApplication;
  }
  console.debug('get final application from applications', applications);
  // check if there is any application with 'Period' type firstly, if yes, use it
  const application = applications?.find((application) => application?.type === IApplicationType.PERIOD);
  console.debug('application with Period type', application);
  // else use the application with 'Usage' type
  const application2 = applications?.find((application) => application?.type === IApplicationType.USAGE);
  console.debug('application with Usage type', application2);
  const finalApplication = application && isApplicationUsable(application) ? application : application2;
  console.debug('final application', finalApplication);
  return finalApplication;
}
