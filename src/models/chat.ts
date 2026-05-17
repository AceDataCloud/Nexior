import {
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_USER,
  CHAT_MODEL_NAME_DEEPSEEK_CHAT,
  CHAT_MODEL_NAME_DEEPSEEK32_CHAT,
  CHAT_MODEL_NAME_DEEPSEEK_V4_FLASH,
  CHAT_MODEL_NAME_DEEPSEEK_REASONER,
  CHAT_MODEL_NAME_GROK_3,
  CHAT_MODEL_NAME_GPT_5_5,
  CHAT_MODEL_NAME_GPT_5_4,
  CHAT_MODEL_NAME_GPT_5_4_MINI,
  CHAT_MODEL_NAME_GPT_5_4_NANO,
  CHAT_MODEL_NAME_GROK_4,
  CHAT_MODEL_NAME_GEMINI_2_5_FLASH,
  CHAT_MODEL_NAME_GEMINI_2_5_PRO,
  CHAT_MODEL_NAME_GEMINI_3_0_PRO,
  CHAT_MODEL_NAME_CLAUDE_OPUS_4_7,
  CHAT_MODEL_NAME_CLAUDE_SONNET_4_6,
  CHAT_MODEL_NAME_CLAUDE_HAIKU_4_5,
  CHAT_MODEL_NAME_KIMI_K2_5,
  CHAT_MODEL_NAME_KIMI_K2_THINKING,
  CHAT_MODEL_NAME_KIMI_K2_THINKING_TURBO,
  CHAT_MODEL_NAME_GLM_5_1,
  CHAT_MODEL_NAME_GLM_4_7
} from '@/constants';

export type IChatModelName =
  | typeof CHAT_MODEL_NAME_GPT_5_5
  | typeof CHAT_MODEL_NAME_GPT_5_4
  | typeof CHAT_MODEL_NAME_GPT_5_4_MINI
  | typeof CHAT_MODEL_NAME_GPT_5_4_NANO
  | typeof CHAT_MODEL_NAME_DEEPSEEK_CHAT
  | typeof CHAT_MODEL_NAME_DEEPSEEK32_CHAT
  | typeof CHAT_MODEL_NAME_DEEPSEEK_V4_FLASH
  | typeof CHAT_MODEL_NAME_DEEPSEEK_REASONER
  | typeof CHAT_MODEL_NAME_GROK_4
  | typeof CHAT_MODEL_NAME_GROK_3
  | typeof CHAT_MODEL_NAME_GEMINI_3_0_PRO
  | typeof CHAT_MODEL_NAME_GEMINI_2_5_PRO
  | typeof CHAT_MODEL_NAME_GEMINI_2_5_FLASH
  | typeof CHAT_MODEL_NAME_CLAUDE_OPUS_4_7
  | typeof CHAT_MODEL_NAME_CLAUDE_SONNET_4_6
  | typeof CHAT_MODEL_NAME_CLAUDE_HAIKU_4_5
  | typeof CHAT_MODEL_NAME_KIMI_K2_5
  | typeof CHAT_MODEL_NAME_KIMI_K2_THINKING
  | typeof CHAT_MODEL_NAME_KIMI_K2_THINKING_TURBO
  | typeof CHAT_MODEL_NAME_GLM_5_1
  | typeof CHAT_MODEL_NAME_GLM_4_7;

export interface IChatModel {
  enabled?: boolean;
  name: IChatModelName;
  icon: string;
  modelGroup?: 'chatgpt' | 'deepseek' | 'grok' | 'gemini' | 'claude' | 'kimi' | 'glm';
  getDisplayName: () => string;
  getDescription: () => string;
  isSearchSupported?: boolean;
  isImageSupported?: boolean;
  isFileSupported?: boolean;
  isReasoningSupported?: boolean;
  isDeepSearchSupported?: boolean;
  isFree?: boolean;
}

export interface IChatModelGroup {
  name: 'chatgpt' | 'deepseek' | 'grok' | 'gemini' | 'claude' | 'kimi' | 'glm';
  icon: string;
  getDisplayName: () => string;
  getDescription: () => string;
  models: IChatModel[];
}

interface IError {
  code: string;
  message?: string;
}

export enum IChatMessageState {
  PENDING = 'pending',
  ANSWERING = 'answering',
  FINISHED = 'finished',
  FAILED = 'failed'
}

export interface IChatMessageContentItem {
  type: string;
  text?: string;
  image_url?: { url: string } | string;
  file_url?: { url: string } | string;
  name?: string;
  mimeType?: string;
  // Tool-calling fields (type='tool_use')
  tool_id?: string;
  tool_name?: string;
  tool_display_name?: string;
  input?: Record<string, unknown>;
  output?: string;
  is_error?: boolean;
  duration_ms?: number;
  // `awaiting_input` is set on a `tool_use` block when the worker pauses the
  // turn for a user reply (see `ask_user_question` tool). `output` is absent
  // until the user submits an answer, which folds the block back to `done`.
  status?: 'running' | 'awaiting_input' | 'done';
  // Present iff `status === 'awaiting_input'` and `tool_name === 'ask_user_question'`.
  // The card UI renders this; on submit, it's stripped and `output` is set.
  pending_question?: IAskUserQuestionPayload;
  // Rich-output entity card (type='card') — payload mirrors the
  // worker's `CardData` SSE event. `type` inside `card` is open-ended:
  // 'audio' | 'video' | 'image' | 'file' today, with room for future
  // entity types (e.g. 'task', 'location', 'code-canvas') that the
  // EntityCard component can dispatch on without changing this shape.
  card?: IChatCard;
}

// ===== ask_user_question tool payload =====
// Mirrors aichat2 worker contract (frozen). When the model calls the
// `ask_user_question` tool, the worker pauses the turn and emits a single
// SSE event of type `ask_user_question` carrying this payload, followed by
// a terminal `done` with `terminal_reason: 'awaiting_user_input'`.

export interface IAskUserQuestionOption {
  /** Display label, 1–5 words. */
  label: string;
  /** Free-text explanation; what choosing this means / its trade-off. */
  description: string;
}

export interface IAskUserQuestion {
  /** Complete question, ends with '?'. */
  question: string;
  /** Very short chip/tag label, ≤12 chars. */
  header: string;
  /** 2–4 distinct options. */
  options: IAskUserQuestionOption[];
  /** When true, multiple options can be selected. Default false. */
  multiSelect?: boolean;
}

export interface IAskUserQuestionPayload {
  /** 1–4 questions. */
  questions: IAskUserQuestion[];
}

/**
 * A user-attached reference (image or file) carried alongside the
 * composer prompt. The chat API only needs the URL on the wire, but
 * the chat UI also wants the original display filename so the message
 * bubble can render `report.pdf` instead of an opaque CDN URL.
 */
export interface IChatReference {
  url: string;
  name?: string;
}

export interface IChatMessage {
  state?: IChatMessageState;
  content?: string | IChatMessageContentItem[];
  /**
   * Streamed chain-of-thought emitted by the model on the aichat2
   * `type:"thinking"` SSE channel. Accumulated by `Conversation.vue`
   * across deltas and rendered by `<thinking-block>` above the visible
   * answer. Empty string / undefined means the model didn't reason
   * (or the upstream doesn't expose it).
   */
  thinking?: string;
  /**
   * Sidecar map of source citations referenced by `[^acite:<id>]`
   * marker tokens embedded in the rendered text. Populated from the
   * worker's streaming `citation` SSE events (one entry per unique
   * `<acite>` tag the model emitted in this assistant turn). The
   * markdown renderer swaps each marker for an inline `[N]` chip
   * whose hover card / click target are looked up in this map by id.
   * Reused on reload so historical conversations re-render the same
   * chips without a refetch. Empty / undefined for messages produced
   * before this protocol shipped.
   */
  citations?: Record<string, IChatCitation>;
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}

export interface IChatConversation {
  id?: string;
  model?: string;
  /**
   * Provider bucket the conversation belongs to (chatgpt | claude | gemini |
   * grok | kimi | glm | deepseek | other). Filled by aichat2 from the model
   * name; relied on by the side-panel to know which scenario page should
   * own each row without having to look up the model registry.
   */
  model_group?: string;
  messages?: IChatMessage[];
  /**
   * Short text preview of the last user/assistant turn, returned by
   * `retrieve_batch` so the side panel can show context without loading
   * the entire `messages` array. Absent on full `retrieve` responses
   * (which carry `messages` instead).
   */
  last_message_preview?: string;
  title?: string;
  deleting?: boolean;
  editing?: boolean;
  new?: boolean;
  updated_at?: number;
}

export interface IChatConversationOptions {
  stream?: (response: IChatConversationResponse) => void;
  token: string;
  signal?: AbortController['signal'];
}

export interface IChatConversationRequest {
  id?: string;
  question?: string;
  message?: string | IChatMessageContentItem[];
  references?: string[];
  stateful?: boolean;
  messages?: IChatMessage[];
  action?: IChatConversationAction;
  model: IChatModelName;
  tools_enabled?: boolean;
  tools_filter?: string[];
  mcp_servers?: string[];
  connectors?: string[];
  skills?: string[];
  // Resume payload for a paused conversation. When present, the conversation
  // MUST be in `awaiting_user_input` state and `tool_results` MUST contain
  // exactly one entry whose `tool_use_id` matches the pending `tool_use`
  // block. `question` / `message` / `references` are ignored when this is set.
  tool_results?: { tool_use_id: string; output: string; is_error?: boolean }[];
}

export interface IChatConversationResponse {
  answer: string;
  delta_answer: string;
  id?: string;
  // aichat2 tool-calling event fields
  type?: string;
  message?: string;
  tool_id?: string;
  tool_name?: string;
  tool_display_name?: string;
  input?: Record<string, unknown>;
  output?: string;
  is_error?: boolean;
  duration_ms?: number;
  content?: string;
  artifact?: {
    type: string;
    url: string;
    name: string;
    mimeType: string;
    size?: number;
  };
  // Rich-output entity card (`type === 'card'`). See `IChatCard` below.
  card?: IChatCard;
  // Source citation footnote (`type === 'citation'`). See `IChatCitation`
  // below. The worker streams one event per unique `<acite>` tag during
  // the assistant turn; the frontend merges them into
  // `IChatMessage.citations` keyed by `id`.
  citation?: IChatCitation;
  // ask_user_question SSE event (`type === 'ask_user_question'`). The worker
  // pauses the turn and asks the user one or more multi-choice questions; the
  // payload is rendered as a card (see AskUserQuestionCard.vue).
  payload?: IAskUserQuestionPayload;
}

export interface IChatConversationsResponse {
  items: IChatConversation[];
  count: number;
}

export enum IChatConversationAction {
  CHAT = 'chat',
  RETRIEVE = 'retrieve',
  UPDATE = 'update',
  DELETE = 'delete',
  RETRIEVE_BATCH = 'retrieve_batch'
}

// ===== Tool Calling Types (aichat2 orchestrator) =====

export type IChatToolCallState = 'running' | 'completed' | 'failed';

export interface IChatArtifact {
  type: 'image' | 'file' | 'audio' | 'video' | 'code';
  url: string;
  name: string;
  mimeType: string;
}

/**
 * Rich-output entity card emitted by aichat2 whenever the assistant
 * surfaces a media artifact (audio / video / image / file). The
 * worker streams `card` SSE events while parsing `<acard>` tags out of
 * the LLM text deltas, and persists the same payload as a
 * `{ type: 'card', card: IChatCard }` content block on the assistant
 * message. `type` is intentionally open-ended so future entity types
 * (e.g. 'task', 'location', 'code-canvas') only need a renderer on the
 * frontend — protocol shape stays the same.
 */
export interface IChatCard {
  type: string;
  url: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  mimeType?: string;
  alt?: string;
}

/**
 * Source citation footnote emitted by aichat2 whenever the assistant
 * grounds a factual claim in a tool result (web search hit, MCP
 * response, file listing, email, etc.). The worker streams `citation`
 * SSE events while parsing `<acite>` tags out of the LLM text deltas
 * and replaces each tag in the live text stream with a stable marker
 * token `[^acite:<id>]`. The frontend's markdown renderer swaps the
 * marker for an inline `[N]` chip; clicking the chip opens `url`,
 * hovering it surfaces a preview card built from `title` /
 * `source` / `icon` / `snippet`. The citation metadata is persisted on
 * the message's `citations` map (a sidecar lookup table keyed by
 * `id`) — NOT as a content block — so reuse across multiple sentences
 * costs one row, and reload re-renders chips in place.
 *
 * `type` is intentionally open-ended (`file` | `page` | `issue` |
 * `email` | `message` | `web` | …) so future surfaces only need a
 * renderer hint, not a protocol change.
 */
export interface IChatCitation {
  /** Stable identifier within a single assistant message. Same source
   *  reuses the same id across every reference; the renderer assigns
   *  the visible 1-based index based on first-occurrence order. */
  id: string;
  /** URL the chip links to on click. */
  url: string;
  /** Bold line on the hover card (e.g. `Document4.docx`). */
  title?: string;
  /** Surface label (e.g. `OneDrive`, `GitHub`, `Notion`, `Web`). */
  source?: string;
  /** Absolute URL of a 16-32px icon shown next to `source`. */
  icon?: string;
  /** 1-2 line excerpt under the title on the hover card. */
  snippet?: string;
  /** Loose entity hint (`file` | `page` | `issue` | `web` | …). */
  type?: string;
  /** MIME type, when known. */
  mimeType?: string;
}

export interface IChatToolCall {
  id: string;
  name: string;
  displayName?: string;
  input: Record<string, unknown>;
  output?: unknown;
  state: IChatToolCallState;
  durationMs?: number;
  artifacts?: IChatArtifact[];
}
