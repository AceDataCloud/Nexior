import { v4 as uuid } from 'uuid';
import type { Store } from 'vuex';
import type { IAcemusicSubmission } from '@/models';

type Operation = IAcemusicSubmission['operation'];
function scopeFor(store: Store<any>, operation: Operation): string | undefined {
  const user = store.state.user?.id;
  const application = store.state.acemusic?.application?.id;
  return user && application ? JSON.stringify([user, application, operation]) : undefined;
}
export function pendingAcemusicSubmission(store: Store<any>, operation: Operation): IAcemusicSubmission | undefined {
  const scope = scopeFor(store, operation);
  return scope ? store.state.acemusic?.submissions?.[scope] : undefined;
}
/** Persist the original body and key before sending. A retry never adopts edited form values. */
export function prepareAcemusicSubmission(
  store: Store<any>,
  operation: Operation,
  request: IAcemusicSubmission['request']
): IAcemusicSubmission {
  const previous = pendingAcemusicSubmission(store, operation);
  if (previous) return previous;
  const scope = scopeFor(store, operation);
  if (!scope) throw new Error('An application must be selected');
  const submission: IAcemusicSubmission = {
    key: uuid(),
    scope,
    operation,
    request: JSON.parse(JSON.stringify(request))
  };
  store.commit('acemusic/setSubmission', submission);
  return submission;
}
export function settleAcemusicSubmission(store: Store<any>, submission: IAcemusicSubmission): void {
  store.commit('acemusic/clearSubmission', submission);
}
/** Definite input/auth/limit rejections did not create an unknown upstream task. */
export function isDefiniteAcemusicRejection(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status !== undefined && [400, 401, 403, 404, 422, 429].includes(status);
}
