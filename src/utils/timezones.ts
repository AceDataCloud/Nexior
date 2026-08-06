const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland'
];

export function detectedTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  } catch {
    return 'Asia/Shanghai';
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone?.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function timeZoneOffset(timeZone: string, date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    })
      .formatToParts(date)
      .find(({ type }) => type === 'timeZoneName')?.value;
    if (!part || part === 'GMT') return 'UTC';
    return part.replace('GMT', 'UTC');
  } catch {
    return '';
  }
}

export function timeZoneLabel(timeZone: string, date = new Date()): string {
  const offset = timeZoneOffset(timeZone, date);
  return offset ? `${timeZone} (${offset})` : timeZone;
}

export function listTimeZones(...include: Array<string | undefined>): string[] {
  let supported: string[] = [];
  try {
    const values = (Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf;
    supported = values?.('timeZone') ?? [];
  } catch {
    supported = [];
  }
  return [
    ...new Set(['UTC', ...include.filter((value): value is string => !!value), ...supported, ...FALLBACK_TIMEZONES])
  ]
    .filter(isValidTimeZone)
    .sort((a, b) => a.localeCompare(b));
}
