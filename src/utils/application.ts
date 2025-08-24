import { IApplication, IApplicationScope, IApplicationType } from '@/models';

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
export function isApplicationUsable(application: IApplication | undefined): boolean {
  if (!application) {
    console.debug('application is undefined, return false');
    return false;
  }
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
  // check if there is any application with 'Global' scope and 'Period' type, if yes, use it
  const application1 = applications?.find(
    (application) => application.scope === IApplicationScope.GLOBAL && application.type === IApplicationType.PERIOD
  );
  console.debug('application1', application1);
  if (isApplicationUsable(application1)) {
    console.debug('application with global scope and Period type', application1);
    return application1;
  }
  // check if there is any application with 'Global' scope and 'Usage' type, if yes, use it
  const application2 = applications?.find(
    (application) => application.scope === IApplicationScope.GLOBAL && application.type === IApplicationType.USAGE
  );
  console.debug('application2', application2);
  if (isApplicationUsable(application2)) {
    console.debug('application with global scope and Usage type', application2);
    return application2;
  }
  // check if there is any application with 'Period' type, if yes, use it
  const application3 = applications?.find(
    (application) =>
      (application.scope === IApplicationScope.INDIVIDUAL && application?.type) === IApplicationType.PERIOD
  );
  console.debug('application3', application3);
  if (isApplicationUsable(application3)) {
    console.debug('application with Period type', application3);
    return application3;
  }
  // check if there is any application with 'Usage' type, if yes, use it
  const application4 = applications?.find(
    (application) =>
      (application.scope === IApplicationScope.INDIVIDUAL && application?.type) === IApplicationType.USAGE
  );
  console.debug('application4', application4);
  if (isApplicationUsable(application4)) {
    console.debug('application with Usage type', application4);
    return application4;
  }
  return application1 || application2 || application3 || application4;
}
