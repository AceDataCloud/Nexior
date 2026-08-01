import { DIGITALHUMAN_VOICES_STORAGE_KEY } from '@/constants';

export interface IDigitalHumanVoice {
  voice_id: string;
  name: string;
  lang: string;
  created_at: number;
}

// The API can only create voices, never list them, so this browser-local book
// is the sole record of what a user has cloned. Losing it means paying to
// clone the same voice again — hence the defensive parsing everywhere.
const MAX_VOICES = 20;

const isVoice = (v: unknown): v is IDigitalHumanVoice => {
  const o = v as Partial<IDigitalHumanVoice> | null;
  return !!o && typeof o.voice_id === 'string' && !!o.voice_id && typeof o.name === 'string';
};

export const readVoices = (): IDigitalHumanVoice[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DIGITALHUMAN_VOICES_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isVoice).map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      lang: typeof v.lang === 'string' ? v.lang : 'zh',
      created_at: typeof v.created_at === 'number' ? v.created_at : 0
    }));
  } catch {
    // corrupt payload or a locked-down WebView — behave as if nothing is saved
    return [];
  }
};

const write = (voices: IDigitalHumanVoice[]): IDigitalHumanVoice[] => {
  try {
    localStorage.setItem(DIGITALHUMAN_VOICES_STORAGE_KEY, JSON.stringify(voices));
  } catch {
    // quota or private mode — the in-memory list still works for this session
  }
  return voices;
};

/** Newest first; re-cloning the same voice_id replaces the old entry. */
export const addVoice = (voice: IDigitalHumanVoice): IDigitalHumanVoice[] => {
  if (!isVoice(voice)) return readVoices();
  const rest = readVoices().filter((v) => v.voice_id !== voice.voice_id);
  return write([voice, ...rest].slice(0, MAX_VOICES));
};

export const removeVoice = (voiceId: string): IDigitalHumanVoice[] =>
  write(readVoices().filter((v) => v.voice_id !== voiceId));

/** Default label for a newly cloned voice — "我的音色 3" style. */
export const nextVoiceName = (base: string): string => `${base} ${readVoices().length + 1}`;
