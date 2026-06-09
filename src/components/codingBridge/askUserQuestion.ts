import type { IAskUserQuestionPayload, ICodingBridgePermissionRequest } from '@/models';

/**
 * Claude Code's built-in interactive-questions tool. When the agent calls it,
 * the node relays a `permission.request` instead of a normal tool gate — the
 * user is meant to pick an option, not just allow/deny. We special-case it so
 * the transcript renders an `<AskUserQuestionCard>` rather than the generic
 * permission dialog with raw JSON.
 */
export const ASK_USER_QUESTION_TOOL = 'AskUserQuestion';

const hasQuestions = (input: Record<string, unknown> | undefined): boolean => {
  const questions = input?.questions;
  return (
    Array.isArray(questions) &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q &&
        typeof (q as { question?: unknown }).question === 'string' &&
        Array.isArray((q as { options?: unknown }).options)
    )
  );
};

/**
 * True when a permission request is really an `AskUserQuestion` call. We match
 * on the tool name (Claude Code) and fall back to a well-formed `questions`
 * array so a provider that names the tool differently still renders the card.
 */
export const isAskUserQuestionRequest = (request: ICodingBridgePermissionRequest | undefined): boolean => {
  if (!request) {
    return false;
  }
  if ((request.tool || '').toLowerCase() === ASK_USER_QUESTION_TOOL.toLowerCase()) {
    return true;
  }
  return hasQuestions(request.input);
};

/** Extract the question payload the `<AskUserQuestionCard>` renders. */
export const questionPayload = (request: ICodingBridgePermissionRequest): IAskUserQuestionPayload => ({
  questions: (request.input?.questions ?? []) as IAskUserQuestionPayload['questions']
});
