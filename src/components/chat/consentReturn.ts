import type { IChatMessage, IChatMessageContentItem, IConsentRequestPayload } from '@/models';
// Direct subpath import (bypasses the `@/constants` barrel) so this
// module — and its consumer ``Conversation.vue`` — can be unit-tested
// under Node's default vitest environment. The barrel pulls in
// ``endpoint.ts`` which references ``window.location.origin`` at load,
// requiring a jsdom env for any importer otherwise.
import { ROLE_ASSISTANT } from '@/constants/chat';
import { buildConsentOutput } from './connectorConsent';

/**
 * Parsed pair of deep-link query params left over after AuthBackend
 * completes an OAuth round-trip initiated from the consent card:
 *
 *   /chat/c/<conversation>?consent=<request-id>&connector=<identifier>
 *
 * `consent` is the original `consent_request_id` emitted by PR-3's
 * `request_user_consent` tool; `connector` is the canonical catalog
 * identifier of the connector the user just authorized — stamped onto
 * `return_to` by AuthFrontend's `/connections/install/:id` page (the
 * worker omits it because the OAuth state machine doesn't round-trip
 * the identifier).
 */
export interface IConsentReturn {
  consentRequestId: string;
  connector: string;
}

function pickStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim().length > 0) return v;
  if (Array.isArray(v) && typeof v[0] === 'string' && (v[0] as string).trim().length > 0) {
    return v[0] as string;
  }
  return null;
}

/**
 * Read `?consent=` + `?connector=` from a Vue Router query bag and
 * return them as a `{ consentRequestId, connector }` pair. Returns
 * `null` when either is missing or non-string so the caller can short
 * the auto-resume path cleanly.
 */
export function parseConsentReturnFromQuery(
  query: Record<string, string | string[] | undefined | null>
): IConsentReturn | null {
  const consent = pickStr(query.consent);
  const connector = pickStr(query.connector);
  if (!consent || !connector) return null;
  return { consentRequestId: consent, connector };
}

/**
 * Walk backwards through `messages` looking for the assistant message
 * whose last tool_use block:
 *   - was called via `request_user_consent`,
 *   - is still `awaiting_input` (i.e. not yet folded by a prior
 *     resume),
 *   - and whose `pending_consent_request.consent_request_id` matches
 *     `consentRequestId`.
 *
 * Returns `null` when no such block exists (already resolved, never
 * existed, or messages haven't loaded yet — the caller treats that as
 * "try again on the next messages mutation"). Only the latest
 * assistant message can carry an awaiting consent block — the worker
 * pauses the turn — so we break after the first assistant scan.
 */
export function findPendingConsentBlock(
  messages: IChatMessage[],
  consentRequestId: string
): { toolUseId: string; payload: IConsentRequestPayload } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== ROLE_ASSISTANT) continue;
    if (!Array.isArray(m.content)) continue;
    for (let j = m.content.length - 1; j >= 0; j--) {
      const block = m.content[j] as IChatMessageContentItem;
      if (block.type !== 'tool_use') continue;
      if (block.tool_name !== 'request_user_consent') continue;
      if (block.status !== 'awaiting_input') continue;
      const payload = block.pending_consent_request;
      if (!payload || payload.consent_request_id !== consentRequestId) continue;
      if (!block.tool_id) continue;
      return { toolUseId: block.tool_id, payload };
    }
    break;
  }
  return null;
}

/**
 * Build the `tool_results[0].output` JSON that resumes the paused
 * `request_user_consent` block after a successful OAuth round-trip.
 * Marks the just-authorized `connector` as ``authorized`` and leaves
 * ``skipped`` empty — if other unsatisfied requirements remain, the
 * worker will re-pause with a fresh consent card so the user can
 * authorize them one at a time. The worker dedupes resumes by
 * `tool_use_id`, so an idempotent retry from a refresh is safe.
 */
export function buildAuthorizedConsentOutput(payload: IConsentRequestPayload, authorizedConnector: string): string {
  return buildConsentOutput(payload, [authorizedConnector], []);
}
