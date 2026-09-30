export function isValidVocalRange(start: unknown, end: unknown, duration?: number): boolean {
  return (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= 0 &&
    end > start &&
    end - start < 30 &&
    (duration === undefined || end <= duration)
  );
}
