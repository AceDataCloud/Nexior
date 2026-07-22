import { describe, expect, it } from 'vitest';
import { humanizeFishError } from './fish';

describe('humanizeFishError', () => {
  it('returns undefined when there is no response or message', () => {
    expect(humanizeFishError(undefined)).toBeUndefined();
    expect(humanizeFishError({})).toBeUndefined();
    expect(humanizeFishError({ status: 400 })).toBeUndefined();
    expect(humanizeFishError({ message: '   ' })).toBeUndefined();
  });

  it('prefers the platform-wrapped error', () => {
    expect(humanizeFishError({ error: 'boom' })).toBe('boom');
    expect(humanizeFishError({ error: { message: 'nested boom' } })).toBe('nested boom');
  });

  it('flattens a pydantic validation array and de-duplicates twin entries', () => {
    // Real production shape for the missing/empty `format` failure.
    const raw = JSON.stringify([
      { type: 'literal_error', loc: ['parameters', 'format'], msg: "Input should be 'pcm' or 'mp3'", input: '' },
      { type: 'literal_error', loc: ['format'], msg: "Input should be 'pcm' or 'mp3'", input: '' }
    ]);
    expect(humanizeFishError({ status: 400, message: raw })).toBe("format: Input should be 'pcm' or 'mp3'");
  });

  it('unwraps a doubly-wrapped status/message body', () => {
    expect(humanizeFishError({ status: 400, message: '{"status":400,"message":"Model abc not found"}' })).toBe(
      'Model abc not found'
    );
  });

  it('recursively flattens a doubly-wrapped pydantic array', () => {
    const inner = JSON.stringify([{ loc: ['format'], msg: "Input should be 'pcm' or 'mp3'" }]);
    expect(humanizeFishError({ status: 400, message: JSON.stringify({ status: 400, message: inner }) })).toBe(
      "format: Input should be 'pcm' or 'mp3'"
    );
  });

  it('passes through a plain string message', () => {
    expect(humanizeFishError({ status: 400, message: 'Text too long' })).toBe('Text too long');
  });

  it('falls back to the raw string when the array is unparseable', () => {
    expect(humanizeFishError({ message: '[not json' })).toBe('[not json');
  });
});
