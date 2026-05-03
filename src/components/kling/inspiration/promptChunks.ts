/**
 * Append/remove helpers for joining preset chips with the user's free-text
 * prompt. Used by both InspirationDrawer (multi-toggle) and InspirationPills
 * (per-chip remove). Keeping the logic here avoids drift between the two.
 */
const SEPARATOR = ', ';

export function appendChunk(current: string, chunk: string): string {
  const trimmed = (current || '').trim();
  if (!trimmed) return chunk;
  // Avoid duplicating an already-present chunk.
  if (trimmed.includes(chunk)) return trimmed;
  return `${trimmed}${SEPARATOR}${chunk}`;
}

export function removeChunk(current: string, chunk: string): string {
  if (!current || !chunk) return current || '';
  // Remove the chunk plus any adjacent separator/space, preserving the rest.
  const variants = [`${chunk}${SEPARATOR}`, `${SEPARATOR}${chunk}`, chunk];
  let next = current;
  for (const v of variants) {
    if (next.includes(v)) {
      next = next.replace(v, '');
      break;
    }
  }
  // Tidy trailing/leading separators.
  return next.replace(/(?:,\s*)+$/, '').replace(/^(?:,\s*)+/, '');
}
