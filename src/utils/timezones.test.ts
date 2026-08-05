import { describe, expect, it } from 'vitest';
import { isValidTimeZone, listTimeZones, timeZoneLabel, timeZoneOffset } from './timezones';

describe('time zone helpers', () => {
  it('validates IANA zones rather than fixed-offset labels', () => {
    expect(isValidTimeZone('Asia/Shanghai')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('UTC+8')).toBe(false);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
  });

  it('includes the saved zone even when building the fallback list', () => {
    expect(listTimeZones('America/Los_Angeles')).toContain('America/Los_Angeles');
    expect(listTimeZones()).toContain('UTC');
  });

  it('formats the current offset without replacing the IANA identity', () => {
    const winter = new Date('2026-01-15T12:00:00Z');
    const summer = new Date('2026-07-15T12:00:00Z');
    expect(timeZoneOffset('America/Los_Angeles', winter)).toBe('UTC-8');
    expect(timeZoneOffset('America/Los_Angeles', summer)).toBe('UTC-7');
    expect(timeZoneLabel('Asia/Shanghai', winter)).toBe('Asia/Shanghai (UTC+8)');
  });
});
