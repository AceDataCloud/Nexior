export interface TimedWord {
  word: string;
  start_s: number;
  end_s: number;
  success?: boolean;
}

export function timingWords(data: unknown): TimedWord[] {
  const result = Array.isArray(data) ? data[0] : data;
  const words = (result as { aligned_words?: TimedWord[] } | undefined)?.aligned_words;
  return (Array.isArray(words) ? words : [])
    .filter(
      (word) =>
        typeof word.word === 'string' &&
        word.word.trim() &&
        word.success !== false &&
        Number.isFinite(word.start_s) &&
        Number.isFinite(word.end_s) &&
        word.start_s >= 0 &&
        word.end_s > word.start_s
    )
    .sort((a, b) => a.start_s - b.start_s);
}

const timestamp = (seconds: number): string => {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};

export function timingSrt(words: TimedWord[]): string {
  return words
    .map(
      (word, index) => `${index + 1}\n${timestamp(word.start_s)} --> ${timestamp(word.end_s)}\n${word.word.trim()}\n`
    )
    .join('\n');
}
