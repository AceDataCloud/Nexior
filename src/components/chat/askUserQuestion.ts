import type { IAskUserQuestion } from '@/models';

/**
 * Build the JSON-string `output` that the ask-user-question card sends back
 * to the worker as the resume `tool_results[0].output`. Shape matches the
 * frozen aichat2 contract:
 *
 *   { "answers": { "<question text>": "label" | ["label", "label"] }, "other": null | string }
 */
export function buildAskUserQuestionOutput(
  questions: IAskUserQuestion[],
  singleAnswers: Record<number, string>,
  multiAnswers: Record<number, string[]>,
  otherText: string
): string {
  const answers: Record<string, string | string[]> = {};
  questions.forEach((q, idx) => {
    if (q.multiSelect) {
      const arr = multiAnswers[idx] || [];
      if (arr.length > 0) answers[q.question] = [...arr];
    } else {
      const v = singleAnswers[idx];
      if (v) answers[q.question] = v;
    }
  });
  const other = otherText.trim();
  return JSON.stringify({
    answers,
    other: other || null
  });
}

/** Truncate a chip header to ≤12 chars per contract guidance. */
export function truncateHeader(header: string): string {
  const h = header ?? '';
  return h.length > 12 ? h.slice(0, 11) + '…' : h;
}

/**
 * True iff the user has provided enough input to enable Submit: at least
 * one option selected (single or multi) OR the free-text Other is filled.
 */
export function canSubmitAskUserQuestion(
  singleAnswers: Record<number, string>,
  multiAnswers: Record<number, string[]>,
  otherText: string
): boolean {
  const anySingle = Object.values(singleAnswers).some((v) => !!v);
  const anyMulti = Object.values(multiAnswers).some((arr) => Array.isArray(arr) && arr.length > 0);
  const hasOther = otherText.trim().length > 0;
  return anySingle || anyMulti || hasOther;
}
