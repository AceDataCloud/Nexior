/**
 * Shared size guard for every `<el-upload>` that posts to `/api/v1/files/`.
 *
 * Why this has to exist: the upload path is EdgeOne → nginx → Django. Django
 * returns a clean JSON 413 above `MAX_UPLOAD_BYTES`, but nginx rejects a body
 * larger than its own `client_max_body_size` *before reading it*, and EdgeOne
 * does not forward that early reject — the browser keeps writing into a socket
 * nobody drains and hangs until EdgeOne's 554, tens of seconds later. Since
 * element-plus leaves the file `status: 'uploading'` forever, any send button
 * gated on "no upload in flight" greys out permanently.
 *
 * So the browser must refuse oversized files itself. The invariant across the
 * whole stack, which must never collapse into equality:
 *
 *   MAX_UPLOAD_BYTES  ==  COS_MAX_UPLOAD_BYTES (100MB)   ← the user-facing limit
 *                      <  client_max_body_size / proxy-body-size (300m)
 *
 * The last step must be a strict `<` with real headroom: the multipart envelope
 * adds ~212 bytes, so if the ceiling equalled the limit, a file of exactly
 * 100MB would trip the nginx reject — reviving the hang at the very size users
 * are most likely to hit.
 */

/** Mirrors PlatformBackend `COS_MAX_UPLOAD_BYTES`. The user-facing limit. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Render a byte count as a short human string ("28.4 MB", "900 KB"). */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024;
    unit = units[i];
  }
  // One decimal below 10 ("9.4 MB"), none above ("104 MB").
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${unit}`;
};

/**
 * True when the file is small enough to upload. Callers pass their own limit
 * when the surface advertises a stricter one (e.g. a 10MB audio field), but it
 * is clamped to `MAX_UPLOAD_BYTES` — a component must never promise more than
 * the backend accepts, or the user is back to the hang this guard prevents.
 */
export const isUploadSizeAllowed = (size: number, limitBytes: number = MAX_UPLOAD_BYTES): boolean => {
  return size <= Math.min(limitBytes, MAX_UPLOAD_BYTES);
};

/** The effective limit for a surface, after clamping to the backend cap. */
export const effectiveUploadLimit = (limitBytes: number = MAX_UPLOAD_BYTES): number => {
  return Math.min(limitBytes, MAX_UPLOAD_BYTES);
};
