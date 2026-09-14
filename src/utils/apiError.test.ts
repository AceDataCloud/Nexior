import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage } from './apiError';

describe('extractApiErrorMessage', () => {
  it('extracts actionable text from a nested DRF envelope', () => {
    const traceId = '53c5415d-c842-4fda-859f-9ec7ab475fd7';
    const message = extractApiErrorMessage({
      response: {
        data: {
          detail: { detail: 'rich_text body must not contain raw HTML' },
          code: 'invalid',
          trace_id: traceId
        }
      }
    });

    expect(message).toBe('rich_text body must not contain raw HTML');
    expect(message).not.toContain('[object Object]');
    expect(message).not.toContain('invalid');
    expect(message).not.toContain(traceId);
  });

  it('supports flat detail strings and field error arrays', () => {
    expect(extractApiErrorMessage({ response: { data: { detail: 'Not allowed' } } })).toBe('Not allowed');
    expect(
      extractApiErrorMessage({ response: { data: { title: ['Required', 'Required'], body: { detail: 'Too long' } } } })
    ).toBe('Required; Too long');
  });

  it('accepts a raw response body', () => {
    expect(extractApiErrorMessage({ detail: ['First', 'Second'] })).toBe('First; Second');
  });

  it('ignores envelope metadata and unsupported values', () => {
    expect(extractApiErrorMessage({ code: 'invalid', traceId: 'request-id', status: 400 })).toBe('');
    expect(extractApiErrorMessage(null)).toBe('');
    expect(extractApiErrorMessage(400)).toBe('');
    expect(extractApiErrorMessage({ response: undefined, config: { url: 'secret-url' } })).toBe('');
  });
});
