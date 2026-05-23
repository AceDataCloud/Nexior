import type { IConsentRequestPayload, IConsentRequestRequirement } from '@/models';

/**
 * Returns the deduplicated list of unconnected connector ids across all
 * requirements that haven't been satisfied yet. These are the candidates
 * the user is being asked to consent to.
 */
export function unsatisfiedConnectors(payload: IConsentRequestPayload): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const req of payload.requirements ?? []) {
    if (req.satisfied) continue;
    for (const entry of req.entries ?? []) {
      if (entry.status === 'unconnected' && !seen.has(entry.connector)) {
        seen.add(entry.connector);
        out.push(entry.connector);
      }
    }
  }
  return out;
}

/**
 * Build the JSON-string `output` that the consent card sends back to the
 * worker as the resume `tool_results[0].output`. Shape:
 *
 *   { "consent_request_id": "<id>", "authorized": [...], "skipped": [...] }
 *
 * The worker correlates this back to the paused tool_use block via
 * `tool_use_id`; `consent_request_id` is echoed for cross-check.
 */
export function buildConsentOutput(payload: IConsentRequestPayload, authorized: string[], skipped: string[]): string {
  return JSON.stringify({
    consent_request_id: payload.consent_request_id,
    authorized,
    skipped
  });
}

/**
 * Returns true iff every requirement in the payload is already satisfied —
 * i.e., the model could have skipped the consent card entirely. We still
 * render the card in this case (for the collapsed "all set" affordance),
 * but the Skip button is hidden because there's nothing to skip.
 */
export function isAllSatisfied(payload: IConsentRequestPayload): boolean {
  const reqs = payload.requirements ?? [];
  if (reqs.length === 0) return true;
  return reqs.every((r: IConsentRequestRequirement) => r.satisfied);
}
