// Realtime is attached to the `aichat` service (same as ChatGPT text chat), so
// the user's existing aichat Application + Credential / universal balance funds
// voice calls — no separate subscription. Matches CHAT_SERVICE_ID.
export const REALTIME_SERVICE_ID = 'b1fbcc32-e218-4253-9dc3-4fe600a1bfb9';
export const REALTIME_DEFAULT_MODEL = 'gpt-realtime';
export const REALTIME_SAMPLE_RATE = 24000;

// Selectable voices for gpt-realtime. The relay whitelists `voice` in its
// client session.update sanitizer, so the browser can pick any of these; the
// default mirrors the relay's own default (DEFAULT_REALTIME_VOICE = "alloy").
export const REALTIME_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar'
] as const;
export type RealtimeVoice = (typeof REALTIME_VOICES)[number];
export const REALTIME_DEFAULT_VOICE: RealtimeVoice = 'alloy';
