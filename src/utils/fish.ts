import { IFishTtsResponse } from '@/models';

/**
 * Turn a Fish TTS failure `response` into a short, human-readable reason.
 *
 * The worker persists failures in Fish-native shape — `{status, message}`
 * (no `success`/`error` wrapper). The `message` is often raw upstream text:
 *  - a pydantic validation array: `[{"loc":["format"],"msg":"Input should be
 *    'pcm' or 'mp3'"}]`
 *  - a doubly-wrapped body: `{"status":400,"message":"Model X not found"}`
 *  - a plain string: `Text too long`
 *
 * Returns `undefined` when there's nothing usable so the caller can fall back.
 */
export function humanizeFishError(response: IFishTtsResponse | undefined): string | undefined {
  if (!response) {
    return undefined;
  }

  // Prefer the platform-wrapped `error` when present.
  const error = response.error;
  if (error) {
    const wrapped = typeof error === 'string' ? error : error.message;
    if (wrapped) {
      return wrapped.trim();
    }
  }

  const raw = response.message;
  if (typeof raw !== 'string' || !raw.trim()) {
    return undefined;
  }
  return parseFishMessage(raw.trim());
}

function parseFishMessage(raw: string): string {
  // Pydantic validation array → "field: message; field: message".
  if (raw.startsWith('[')) {
    try {
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length) {
        const parts = items
          .map((item) => {
            const msg = typeof item?.msg === 'string' ? item.msg : undefined;
            if (!msg) {
              return undefined;
            }
            const loc = Array.isArray(item?.loc) ? item.loc.filter((p: unknown) => p !== 'parameters') : [];
            const field = loc.length ? loc[loc.length - 1] : undefined;
            return field ? `${field}: ${msg}` : msg;
          })
          .filter((p): p is string => !!p);
        // De-duplicate the twin `parameters.format` / `format` entries.
        const unique = Array.from(new Set(parts));
        if (unique.length) {
          return unique.join('; ');
        }
      }
    } catch {
      // fall through to the raw string
    }
  }

  // Doubly-wrapped `{"status":400,"message":"..."}` → recurse on the inner
  // message (it may itself be a pydantic array or plain string).
  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj.message === 'string' && obj.message.trim()) {
        return parseFishMessage(obj.message.trim());
      }
    } catch {
      // fall through
    }
  }

  return raw;
}
