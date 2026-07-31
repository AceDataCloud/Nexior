import { registry } from '../local/registry';
import { api, type ChatTurnResponse, type ClaimedRun } from './api';

/**
 * Execute one scheduled run locally.
 *
 * This is the frontend's client-tool loop (`Conversation.vue`
 * `_runClientTools` → `_resumeWithToolResults`) with the UI removed: the model
 * runs in the cloud, pauses when it wants a tool on this machine, we run it
 * here, and resume with the results. The only structural difference is that
 * nobody is watching — so consent is pre-authorized (`allowed_local_tools`)
 * rather than prompted, and a tool outside that list never reaches the model in
 * the first place (the worker refuses to register it).
 */

/** Tool names are dotted (`fs.list_dir`); OpenAI function names are not
 *  allowed to contain dots, so the wire name is sanitized and mapped back
 *  before invoking. Same rule as the renderer's `_wiredTools`. */
export function wireTools(names: string[]): { real: string; wire: string }[] {
  const used = new Set<string>();
  return names.map((real) => {
    let wire = real.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (used.has(wire)) {
      let i = 2;
      while (used.has(`${wire}_${i}`)) i += 1;
      wire = `${wire}_${i}`;
    }
    used.add(wire);
    return { real, wire };
  });
}

export interface RunOutcome {
  conversationId?: string;
  terminalReason?: string;
  answer?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  traceId?: string;
  errorCode?: string;
}

/**
 * A local run must terminate even if the model keeps asking for tools.
 *
 * The cloud path gets a wall-clock bound for free (one 15-minute loopback
 * call); a local run is N independent calls, so nothing bounds it but this.
 * Without it a looping task would hold its run row open until the reaper
 * eventually failed it 45 minutes later.
 */
const MAX_TOOL_ROUNDS = 24;
const MAX_RUN_MS = 20 * 60 * 1000;

export async function executeRun(
  claim: ClaimedRun,
  opts: { siteOrigin?: string; scheduledTaskId: string; signal?: { aborted: boolean } } = {
    scheduledTaskId: ''
  }
): Promise<RunOutcome> {
  const startedAt = Date.now();
  const allowed = claim.unattended_policy?.allowed_local_tools ?? [];
  // Declare only what the task pre-authorized. The worker enforces the same
  // list, so sending more would be pointless; sending exactly this keeps the
  // model's tool schema honest about what it can actually reach.
  const specs = registry.specs().filter((s) => allowed.includes(s.name));
  const wired = wireTools(specs.map((s) => s.name));
  const wireToReal = new Map(wired.map((w) => [w.wire, w.real]));
  const clientTools = specs.map((spec, i) => ({
    name: wired[i].wire,
    displayName: spec.name,
    description: spec.description,
    inputSchema: spec.input_schema
  }));

  let response: ChatTurnResponse;
  try {
    response = await api.chat(
      {
        action: 'chat',
        model: claim.model,
        message: claim.question,
        messages: [{ role: 'user', content: claim.question }],
        max_turns: claim.max_turns,
        memory_enabled: claim.memory_enabled,
        skills: claim.skills,
        mcp_servers: claim.mcp_servers,
        unattended_policy: claim.unattended_policy,
        stateful: true,
        title: claim.title,
        metadata: {
          source: 'scheduled_task',
          scheduled_task_id: opts.scheduledTaskId,
          run_id: claim.run_id
        },
        ...(clientTools.length ? { client_tools: clientTools } : {})
      },
      opts.siteOrigin
    );
  } catch (err) {
    return { errorCode: classifyError(err) };
  }

  let conversationId = response.conversation_id ?? response.id;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const pending = response.pending_client_tools ?? [];
    if (!pending.length) break;
    if (opts.signal?.aborted) return { conversationId, errorCode: 'run_cancelled' };
    if (Date.now() - startedAt > MAX_RUN_MS) {
      return { conversationId, traceId: response.trace_id, errorCode: 'run_timeout' };
    }

    const toolResults = [];
    for (const call of pending) {
      const realName = wireToReal.get(call.name) ?? call.name;
      let result: { output: string; is_error?: boolean; image?: string };
      try {
        result = await registry.invoke({
          name: realName,
          input: (call.input ?? {}) as Record<string, unknown>,
          sessionId: conversationId ?? claim.run_id
        });
      } catch (err) {
        // A thrown invoke (e.g. "path outside allowed roots") must come back as
        // a tool ERROR so the model can react, not abort the whole run.
        result = { output: err instanceof Error ? err.message : String(err), is_error: true };
      }
      toolResults.push({
        tool_use_id: call.tool_use_id,
        output: result.output,
        ...(result.is_error ? { is_error: true } : {})
        // Screenshots are deliberately dropped here: hosting them needs the
        // renderer's upload path, and an unattended task has no one to look at
        // one anyway. The model still gets the textual result.
      });
    }

    if (!conversationId) {
      // Cannot resume without one — the worker addresses the paused turn by
      // conversation id. Report rather than silently truncating the run.
      return { conversationId, terminalReason: response.terminal_reason, errorCode: 'missing_conversation_id' };
    }

    try {
      response = await api.chat(
        {
          id: conversationId,
          model: claim.model,
          stateful: true,
          tool_results: toolResults,
          unattended_policy: claim.unattended_policy,
          // Re-send: the worker registers client tools per request, so a resume
          // that omits them leaves the model unable to call one on the NEXT
          // turn of the same run.
          ...(clientTools.length ? { client_tools: clientTools } : {})
        },
        opts.siteOrigin
      );
    } catch (err) {
      return { conversationId, errorCode: classifyError(err) };
    }
    conversationId = response.conversation_id ?? response.id ?? conversationId;
  }

  // Still paused after the round cap: the loop is not converging.
  if ((response.pending_client_tools ?? []).length) {
    return { conversationId, traceId: response.trace_id, errorCode: 'tool_loop_limit' };
  }

  return {
    conversationId,
    terminalReason: response.terminal_reason,
    answer: response.answer,
    usage: response.usage,
    traceId: response.trace_id
  };
}

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (err instanceof Error && err.name === 'UnauthorizedError') return 'unauthorized';
  if (msg.includes('abort')) return 'timeout';
  if (/balance|insufficient/i.test(msg)) return 'balance_insufficient';
  return 'internal_error';
}
