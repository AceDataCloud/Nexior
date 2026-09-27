import type { IChatModel } from '@/models';
import type { IRequestAccessResult } from '@/operators/apiRequestAccess';

export function resolveChatModelAccess(
  model: IChatModel,
  access: Record<string, IRequestAccessResult> = {}
): IRequestAccessResult {
  return access[model.name] ?? { allowed: true, restricted: false };
}
