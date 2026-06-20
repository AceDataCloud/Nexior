// No window during the SSG build — default to production endpoints there.
export const isTest = typeof window !== 'undefined' && window.location.origin === 'https://hub-test.acedata.cloud';

export const BASE_URL_PLATFORM = isTest ? 'https://platform-test.acedata.cloud' : 'https://platform.acedata.cloud';
export const BASE_URL_HUB = isTest ? 'https://hub-test.acedata.cloud' : 'https://hub.acedata.cloud';
export const BASE_URL_AUTH = isTest ? 'https://auth-test.acedata.cloud' : 'https://auth.acedata.cloud';
export const BASE_URL_API = isTest ? 'https://api-test.acedata.cloud' : 'https://api.acedata.cloud';

// Coding Bridge relay (stateful WebSocket hub). REST for pairing / node
// management, plus a single browser WebSocket derived from the same origin.
export const BASE_URL_CODING_BRIDGE = isTest
  ? 'https://coding-bridge-test.acedata.cloud'
  : 'https://coding-bridge.acedata.cloud';

// Browser WebSocket endpoint: same host, https -> wss / http -> ws, path `/ws`.
export const WS_URL_CODING_BRIDGE = `${BASE_URL_CODING_BRIDGE.replace(/^http/, 'ws')}/ws`;

// Realtime voice (WebSocket). Browsers can't set Authorization on a WS and Kong's
// custom-auth only reads that header, so we use a DIRECT host that bypasses Kong
// (like coding-bridge); the relay self-auths from the Sec-WebSocket-Protocol token.
// Path /aichat2/realtime bills the aichat service (same balance as ChatGPT).
// (Developers use api.acedata.cloud/v1/realtime with an Authorization header.)
export const WS_URL_REALTIME = 'wss://realtime.acedata.cloud/aichat2/realtime';

export const BASE_HOST_PLATFORM = new URL(BASE_URL_PLATFORM).host;
export const BASE_HOST_HUB = new URL(BASE_URL_HUB).host;
export const BASE_HOST_AUTH = new URL(BASE_URL_AUTH).host;
export const BASE_HOST_API = new URL(BASE_URL_API).host;
