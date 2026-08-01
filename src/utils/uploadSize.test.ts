import { describe, expect, it } from 'vitest';
import { MAX_UPLOAD_BYTES, effectiveUploadLimit, formatBytes, isUploadSizeAllowed } from './uploadSize';

const MB = 1024 * 1024;

describe('isUploadSizeAllowed', () => {
  it('accepts a file at exactly the cap and rejects one byte over', () => {
    expect(isUploadSizeAllowed(MAX_UPLOAD_BYTES)).toBe(true);
    expect(isUploadSizeAllowed(MAX_UPLOAD_BYTES + 1)).toBe(false);
  });

  it('honours a stricter per-surface limit', () => {
    expect(isUploadSizeAllowed(5 * MB, 10 * MB)).toBe(true);
    expect(isUploadSizeAllowed(11 * MB, 10 * MB)).toBe(false);
  });

  it('never lets a surface advertise more than the backend accepts', () => {
    // A component asking for 200MB must still be capped: past the nginx limit
    // the request hangs instead of returning an error.
    expect(isUploadSizeAllowed(150 * MB, 200 * MB)).toBe(false);
    expect(effectiveUploadLimit(200 * MB)).toBe(MAX_UPLOAD_BYTES);
    expect(effectiveUploadLimit(10 * MB)).toBe(10 * MB);
  });
});

describe('formatBytes', () => {
  it('formats across units with one decimal below 10', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(Math.round(9.4 * MB))).toBe('9.4 MB');
    expect(formatBytes(100 * MB)).toBe('100 MB');
  });

  it('is defensive about junk input', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
  });
});
