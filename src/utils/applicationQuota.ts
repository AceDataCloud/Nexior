import { IApplication, IApplicationScope } from '@/models';

export function normalizeApplicationBalance(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function getEffectiveApplicationBalance(application: IApplication, globalApplications: IApplication[]): number {
  const selectedBalance = normalizeApplicationBalance(application.remaining_amount);
  if (application.scope === IApplicationScope.GLOBAL || !application.allow_consume_global) {
    return selectedBalance;
  }

  const globalApplication = globalApplications.find(
    (item) => item.scope === IApplicationScope.GLOBAL && item.user_id === application.user_id
  );
  return Math.max(selectedBalance, normalizeApplicationBalance(globalApplication?.remaining_amount));
}
