// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SpeechRecognitionControllerImpl,
  extensionForMime,
  normalizeError,
  pickMimeType,
  transcribeAudio,
  type SpeechRecognitionCallbacks
} from './speechRecognition';

class FakeRecorder {
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  start = vi.fn(() => {
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) } as BlobEvent);
    void this.onstop?.();
  });
}

function callbacks() {
  return {
    onResult: vi.fn(),
    onEnd: vi.fn(),
    onError: vi.fn()
  } satisfies SpeechRecognitionCallbacks;
}

function fixtures() {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  const mediaDevices = { getUserMedia: vi.fn(async () => stream) } as unknown as MediaDevices;
  const recorder = new FakeRecorder();
  const createRecorder = vi.fn(() => recorder as unknown as MediaRecorder);
  const transcribe = vi.fn(async () => '转写后的文字');
  const controller = new SpeechRecognitionControllerImpl(mediaDevices, createRecorder, transcribe);
  return { controller, mediaDevices, recorder, createRecorder, transcribe, track };
}

describe('SpeechRecognitionControllerImpl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'MediaRecorder',
      class {
        static isTypeSupported = vi.fn((type: string) => type.startsWith('audio/webm'));
      }
    );
  });

  it('uses the same browser microphone constraints as realtime voice', async () => {
    const { controller, mediaDevices, recorder, createRecorder } = fixtures();
    const cb = callbacks();
    await controller.start('zh-CN', 'api-token', cb);

    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    expect(createRecorder).toHaveBeenCalledWith(expect.anything(), { mimeType: 'audio/webm;codecs=opus' });
    expect(recorder.start).toHaveBeenCalledOnce();
  });

  it('transcribes the recording after stop and returns editable text', async () => {
    const { controller, recorder, transcribe, track } = fixtures();
    const cb = callbacks();
    await controller.start('zh-CN', 'api-token', cb);
    await controller.stop();

    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(transcribe).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'audio/webm;codecs=opus' }),
      'coding-bridge-voice.webm',
      'zh-CN',
      'api-token'
    );
    expect(cb.onResult).toHaveBeenCalledWith({ finalText: '转写后的文字', interimText: '' });
    expect(cb.onEnd).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('classifies permission failures and releases stale streams on abort', async () => {
    const { controller, mediaDevices, track } = fixtures();
    const cb = callbacks();
    (mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError')
    );
    await expect(controller.start('en-US', 'api-token', cb)).rejects.toThrow();
    expect(cb.onError).toHaveBeenCalledWith('permission-denied');

    (mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      getTracks: () => [track]
    } as unknown as MediaStream);
    await controller.start('en-US', 'api-token', cb);
    await controller.abort();
    expect(track.stop).toHaveBeenCalled();
  });

  it('reports no speech when the transcription is empty', async () => {
    const { controller, transcribe } = fixtures();
    transcribe.mockResolvedValueOnce('');
    const cb = callbacks();
    await controller.start('en-US', 'api-token', cb);
    await controller.stop();
    expect(cb.onError).toHaveBeenCalledWith('no-speech');
    expect(cb.onEnd).toHaveBeenCalledOnce();
  });
});

describe('speech recording helpers', () => {
  it('chooses a Safari-compatible format when WebM is unavailable', () => {
    vi.spyOn(MediaRecorder, 'isTypeSupported').mockImplementation((type) => type === 'audio/mp4');
    expect(pickMimeType()).toBe('audio/mp4');
    expect(extensionForMime('audio/mp4')).toBe('m4a');
  });

  it('uploads multipart audio to the transcription API', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ text: 'hello world' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const text = await transcribeAudio(new Blob(['voice'], { type: 'audio/webm' }), 'voice.webm', 'en-US', 'token');

    expect(text).toBe('hello world');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/audio/transcriptions'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: expect.any(FormData)
      })
    );
  });

  it.each([
    [new DOMException('denied', 'NotAllowedError'), 'permission-denied'],
    [new DOMException('missing', 'NotFoundError'), 'microphone-unavailable'],
    [new TypeError('Failed to fetch'), 'network'],
    [new DOMException('cancelled', 'AbortError'), 'aborted'],
    [new Error('something new'), 'unknown']
  ])('normalizes %s', (error, expected) => {
    expect(normalizeError(error)).toBe(expected);
  });
});
