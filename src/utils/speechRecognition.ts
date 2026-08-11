import { BASE_URL_API } from '@/constants';

export type SpeechRecognitionErrorCode =
  | 'permission-denied'
  | 'microphone-unavailable'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'unknown';

export interface SpeechRecognitionSnapshot {
  finalText: string;
  interimText: string;
}

export interface SpeechRecognitionCallbacks {
  onResult: (snapshot: SpeechRecognitionSnapshot) => void;
  onEnd: () => void;
  onError: (code: SpeechRecognitionErrorCode) => void;
}

export interface SpeechRecognitionController {
  isSupported(): Promise<boolean>;
  start(language: string, token: string, callbacks: SpeechRecognitionCallbacks): Promise<void>;
  stop(): Promise<void>;
  abort(): Promise<void>;
  dispose(): Promise<void>;
}

type MediaRecorderFactory = (stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorder;
type Transcribe = (audio: Blob, fileName: string, language: string, token: string) => Promise<string>;

function normalizeError(error: unknown): SpeechRecognitionErrorCode {
  const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  const normalized = raw.toLowerCase().replaceAll('_', '-');
  if (normalized.includes('notallowed') || normalized.includes('not-allowed') || normalized.includes('permission')) {
    return 'permission-denied';
  }
  if (
    normalized.includes('notfound') ||
    normalized.includes('not-found') ||
    normalized.includes('audio-capture') ||
    normalized.includes('microphone')
  ) {
    return 'microphone-unavailable';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'network';
  }
  if (normalized.includes('abort') || normalized.includes('cancel')) {
    return 'aborted';
  }
  return 'unknown';
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported?.(candidate));
}

function extensionForMime(mime: string): string {
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}

async function transcribeAudio(audio: Blob, fileName: string, language: string, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', new File([audio], fileName, { type: audio.type || 'audio/webm' }));
  form.append('model', 'gpt-transcribe');
  form.append('response_format', 'json');
  if (language) form.append('language', language);

  const response = await fetch(`${BASE_URL_API}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!response.ok) throw new Error(`transcription request failed (${response.status})`);
  const payload = (await response.json()) as { text?: string };
  return payload.text?.trim() ?? '';
}

export class SpeechRecognitionControllerImpl implements SpeechRecognitionController {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private callbacks?: SpeechRecognitionCallbacks;
  private chunks: Blob[] = [];
  private language = '';
  private token = '';
  private generation = 0;
  private aborted = false;

  constructor(
    private readonly mediaDevices: MediaDevices | undefined = typeof navigator === 'undefined'
      ? undefined
      : navigator.mediaDevices,
    private readonly createRecorder: MediaRecorderFactory = (stream, options) => new MediaRecorder(stream, options),
    private readonly transcribe: Transcribe = transcribeAudio
  ) {}

  async isSupported(): Promise<boolean> {
    return !!this.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  }

  async start(language: string, token: string, callbacks: SpeechRecognitionCallbacks): Promise<void> {
    await this.abort();
    const generation = ++this.generation;
    this.callbacks = callbacks;
    this.language = language;
    this.token = token;
    this.chunks = [];
    this.aborted = false;

    try {
      const stream = await this.mediaDevices?.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (!stream || generation !== this.generation) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const mimeType = pickMimeType();
      this.recorder = this.createRecorder(stream, mimeType ? { mimeType } : undefined);
      this.recorder.ondataavailable = (event) => {
        if (generation === this.generation && event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.start();
    } catch (error) {
      const code = normalizeError(error);
      if (code !== 'aborted') callbacks.onError(code);
      await this.abort();
      throw error;
    }
  }

  async stop(): Promise<void> {
    const recorder = this.recorder;
    const generation = this.generation;
    if (!recorder || recorder.state === 'inactive' || !this.callbacks) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        this.releaseStream();
        if (generation !== this.generation || this.aborted || !this.callbacks) return resolve();
        const callbacks = this.callbacks;
        const mimeType = recorder.mimeType || this.chunks[0]?.type || 'audio/webm';
        const audio = new Blob(this.chunks, { type: mimeType });
        try {
          if (!audio.size) {
            callbacks.onError('no-speech');
          } else {
            const text = await this.transcribe(
              audio,
              `coding-bridge-voice.${extensionForMime(mimeType)}`,
              this.language,
              this.token
            );
            if (generation !== this.generation || this.aborted) return resolve();
            if (text) callbacks.onResult({ finalText: text, interimText: '' });
            else callbacks.onError('no-speech');
          }
        } catch (error) {
          if (generation === this.generation && !this.aborted) callbacks.onError(normalizeError(error));
        } finally {
          if (generation === this.generation) {
            if (!this.aborted) callbacks.onEnd();
            this.reset();
          }
          resolve();
        }
      };
      recorder.stop();
    });
  }

  async abort(): Promise<void> {
    this.aborted = true;
    this.generation += 1;
    const recorder = this.recorder;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    this.releaseStream();
    this.reset();
  }

  async dispose(): Promise<void> {
    await this.abort();
  }

  private releaseStream() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  private reset() {
    this.recorder = undefined;
    this.callbacks = undefined;
    this.chunks = [];
    this.language = '';
    this.token = '';
  }
}

export function createSpeechRecognitionController(): SpeechRecognitionController {
  return new SpeechRecognitionControllerImpl();
}

export { extensionForMime, normalizeError, pickMimeType, transcribeAudio };
