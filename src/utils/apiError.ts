const IGNORED_ERROR_KEYS = new Set([
  'code',
  'status',
  'status_code',
  'trace_id',
  'traceId',
  'request_id',
  'requestId',
  'correlation_id',
  'correlationId'
]);

const responseData = (error: unknown): unknown => {
  if (!error || typeof error !== 'object') return error;
  if (!Object.prototype.hasOwnProperty.call(error, 'response')) return error;
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== 'object') return undefined;
  return (response as { data?: unknown }).data;
};

export const extractApiErrorMessage = (error: unknown): string => {
  const messages: string[] = [];
  const seen = new Set<string>();

  const collect = (value: unknown, key?: string): void => {
    if (key && IGNORED_ERROR_KEYS.has(key)) return;
    if (typeof value === 'string') {
      const message = value.trim();
      if (message && !seen.has(message)) {
        seen.add(message);
        messages.push(message);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item));
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([entryKey, entryValue]) => collect(entryValue, entryKey));
  };

  collect(responseData(error));
  return messages.join('; ');
};
