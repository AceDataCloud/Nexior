import type { IAskUserQuestion } from '@/models';

/**
 * Sentinel value used as the v-model value for the "Other" pseudo-option
 * on each question. Picking this option reveals an inline free-text input
 * for that specific question. It is NEVER surfaced to the worker as-is —
 * `buildAskUserQuestionOutput` rewrites it into a `Other: <text>` string.
 *
 * The string is intentionally Nexior-namespaced so it cannot collide with
 * a real option label produced by the LLM.
 */
export const OTHER_VALUE = '__nexior_other__';

/**
 * Build the JSON-string `output` that the wizard sends back to the worker
 * as the resume `tool_results[0].output`. Shape:
 *
 *   { "answers": { "<question text>": "label" | ["label", "Other: <text>"] } }
 *
 * Questions with no selection are omitted. When the user picks "Other"
 * and types text, the answer becomes `Other: <text>` (single-select) or
 * appends that string to the array (multi-select). "Other" with no text
 * is treated as no selection — the wizard prevents this via
 * `canAdvanceQuestion` but we filter defensively too.
 */
export function buildAskUserQuestionOutput(
  questions: IAskUserQuestion[],
  singleAnswers: Record<number, string>,
  multiAnswers: Record<number, string[]>,
  otherTexts: Record<number, string>
): string {
  const answers: Record<string, string | string[]> = {};
  questions.forEach((q, idx) => {
    const otherText = (otherTexts[idx] || '').trim();
    if (q.multiSelect) {
      const picked = multiAnswers[idx] || [];
      const result: string[] = [];
      for (const v of picked) {
        if (v === OTHER_VALUE) {
          if (otherText) result.push(`Other: ${otherText}`);
        } else if (v) {
          result.push(v);
        }
      }
      if (result.length > 0) answers[q.question] = result;
    } else {
      const v = singleAnswers[idx];
      if (v === OTHER_VALUE) {
        if (otherText) answers[q.question] = `Other: ${otherText}`;
      } else if (v) {
        answers[q.question] = v;
      }
    }
  });
  return JSON.stringify({ answers });
}

/** Truncate a chip header to ≤12 chars per contract guidance. */
export function truncateHeader(header: string): string {
  const h = header ?? '';
  return h.length > 12 ? h.slice(0, 11) + '…' : h;
}

/**
 * True iff the user has provided enough input on the question at `idx`
 * to enable the Next / Submit button. Single-select needs an option
 * (and the Other text when "Other" is chosen); multi-select needs at
 * least one box ticked (with Other text when applicable).
 */
export function canAdvanceQuestion(
  question: IAskUserQuestion,
  idx: number,
  singleAnswers: Record<number, string>,
  multiAnswers: Record<number, string[]>,
  otherTexts: Record<number, string>
): boolean {
  const otherText = (otherTexts[idx] || '').trim();
  if (question.multiSelect) {
    const picked = multiAnswers[idx] || [];
    if (picked.length === 0) return false;
    if (picked.includes(OTHER_VALUE) && !otherText) return false;
    return true;
  }
  const v = singleAnswers[idx];
  if (!v) return false;
  if (v === OTHER_VALUE && !otherText) return false;
  return true;
}
