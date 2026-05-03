import {
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_USER,
  CHAT_MODEL_NAME_DEEPSEEK_CHAT,
  CHAT_MODEL_NAME_DEEPSEEK32_CHAT,
  CHAT_MODEL_NAME_DEEPSEEK_REASONER,
  CHAT_MODEL_NAME_GROK_3,
  CHAT_MODEL_NAME_GROK_3_REASONER,
  CHAT_MODEL_NAME_GROK_3_DEEPSEARCH,
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
  | typeof CHAT_MODEL_NAME_GPT_5_4
  | typeof CHAT_MODEL_NAME_GPT_5_4_MINI
  | typeof CHAT_MODEL_NAME_GPT_5_4_NANO
  | typeof CHAT_MODEL_NAME_DEEPSEEK_CHAT
  | typeof CHAT_MODEL_NAME_DEEPSEEK32_CHAT
  | typeof CHAT_MODEL_NAME_DEEPSEEK_REASONER
  | typeof CHAT_MODEL_NAME_GROK_4
  | typeof CHAT_MODEL_NAME_GROK_3
  | typeof CHAT_MODEL_NAME_GROK_3_REASONER
  | typeof CHAT_MODEL_NAME_GROK_3_DEEPSEARCH
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
  status?: 'running' | 'done';
  // Rich-output entity card (type='card') — payload mirrors the
  // worker's `CardData` SSE event. `type` inside `card` is open-ended:
  // 'audio' | 'video' | 'image' | 'file' today, with room for future
  // entity types (e.g. 'task', 'location', 'code-canvas') that the
  // EntityCard component can dispatch on without changing this shape.
  card?: IChatCard;
}

export interface IChatMessage {
  state?: IChatMessageState;
  content?: string | IChatMessageContentItem[];
  role?: typeof ROLE_SYSTEM | typeof ROLE_ASSISTANT | typeof ROLE_USER;
  error?: IError;
}

export interface IChatConversation {
  id?: string;
  model?: string;
  messages?: IChatMessage[];
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

export interface IChatSSEEvent {
  type:
    | 'text_delta'
    | 'tool_use_start'
    | 'tool_progress'
    | 'tool_result'
    | 'confirmation_required'
    | 'thinking'
    | 'done'
    | 'error';
  // text_delta
  content?: string;
  id?: string;
  // tool events
  tool_id?: string;
  tool_name?: string;
  tool_display_name?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  is_error?: boolean;
  duration_ms?: number;
  // thinking
  // done
  conversation_id?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_turns: number;
    tool_calls: number;
  };
  // error
  message?: string;
  // confirmation
  description?: string;
}

export interface IChatConversationResponseV2 extends IChatConversationResponse {
  toolCalls?: IChatToolCall[];
  thinking?: string;
  event?: IChatSSEEvent;
}
