import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeClient } from './realtimeClient';

vi.mock('@/constants', () => ({
  REALTIME_DEFAULT_VOICE: 'marin',
  REALTIME_SAMPLE_RATE: 24000,
  WS_URL_REALTIME: 'wss://voice.test/aichat2/live'
}));
vi.mock('./requestAuth', () => ({ requireServiceToken: (token: string) => token }));

class Socket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instance: Socket;
  readyState = 0;
  sent: any[] = [];
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (event: any) => void;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });
  constructor(
    public url: string,
    public protocols: string[]
  ) {
    Socket.instance = this;
  }
  send(raw: string) {
    this.sent.push(JSON.parse(raw));
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(event: object) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }
}

class Worklet {
  static instance: Worklet;
  port: { onmessage?: ((event: any) => void) | null } = {};
  constructor() {
    Worklet.instance = this;
  }
  connect(node: any) {
    return node;
  }
}

const track = { enabled: true, stop: vi.fn() };
const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null };
class Audio {
  state = 'running';
  resume = vi.fn().mockResolvedValue(undefined);
  currentTime = 0;
  destination = {};
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }
  createAnalyser() {
    return { fftSize: 256, getByteTimeDomainData: vi.fn() };
  }
  createGain() {
    return { gain: { value: 0 }, connect: vi.fn() };
  }
  createBuffer() {
    return { duration: 0.01, getChannelData: () => new Float32Array(2) };
  }
  createBufferSource() {
    return source;
  }
  close = vi.fn();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { AudioContext: Audio });
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track], getAudioTracks: () => [track] })
    }
  });
  vi.stubGlobal('WebSocket', Socket);
  vi.stubGlobal('AudioWorkletNode', Worklet);
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('GPT-Live voice transport', () => {
  it('exits connecting when microphone permission remains unanswered and releases a late stream', async () => {
    let grant!: (stream: MediaStream) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(new Promise((resolve) => (grant = resolve)));
    const status = vi.fn(),
      error = vi.fn();
    const client = new RealtimeClient('token', 'gpt-live-1', { onStatus: status, onError: error });
    const start = client.start();
    await vi.advanceTimersByTimeAsync(30000);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('startup timed out'));
    expect(status).toHaveBeenLastCalledWith('disconnected');
    grant({ getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream);
    await start;
    expect(track.stop).toHaveBeenCalled();
    expect(client.isRunning).toBe(false);
  });

  it('keeps credentials out of URL and waits for session.started before audio', async () => {
    const status = vi.fn();
    const client = new RealtimeClient('token', 'gpt-live-1', { onStatus: status });
    await client.start();
    const socket = Socket.instance;
    socket.open();
    expect(socket.url).not.toContain('token');
    expect(socket.protocols).toEqual(['live', 'acedata-token.token']);
    expect(socket.sent[0].type).toBe('session.start');
    Worklet.instance.port.onmessage?.({ data: new ArrayBuffer(4) });
    expect(socket.sent).toHaveLength(1);
    socket.receive({ type: 'session.started' });
    Worklet.instance.port.onmessage?.({ data: new ArrayBuffer(4) });
    expect(socket.sent[1].type).toBe('session.input_audio.append');
    expect(status).toHaveBeenLastCalledWith('connected');
    client.stop();
  });

  it('keeps simultaneous captions independent and derives speaking from playback', async () => {
    const user = vi.fn(),
      assistant = vi.fn(),
      playback = vi.fn();
    const client = new RealtimeClient('token', 'gpt-live-1', {
      onUserTranscript: user,
      onAiTranscriptDelta: assistant,
      onPlayback: playback
    });
    await client.start();
    const socket = Socket.instance;
    socket.open();
    socket.receive({ type: 'session.started' });
    socket.receive({ type: 'session.input_transcript.delta', delta: 'hello ', start_ms: 0, end_ms: 100 });
    socket.receive({ type: 'session.output_transcript.delta', delta: 'Hi!', start_ms: 50, end_ms: 200 });
    socket.receive({ type: 'session.input_transcript.delta', delta: 'world', start_ms: 100, end_ms: 200 });
    expect(user).toHaveBeenLastCalledWith('hello world');
    expect(assistant).toHaveBeenLastCalledWith('Hi!');
    socket.receive({ type: 'session.output_audio.delta', delta: 'AAAAAA==' });
    expect(playback).toHaveBeenLastCalledWith(true);
    source.onended?.();
    expect(playback).toHaveBeenLastCalledWith(false);
    expect(socket.sent.some((e) => e.type === 'response.cancel')).toBe(false);
    client.stop();
  });

  it('deduplicates client delegation and returns the backend result with its ID', async () => {
    const backend = vi.fn().mockResolvedValue('42');
    const client = new RealtimeClient('token', 'gpt-live-1', { onDelegation: backend });
    await client.start();
    const socket = Socket.instance;
    socket.open();
    socket.receive({ type: 'session.started' });
    socket.receive({ type: 'session.input_transcript.delta', delta: 'six times seven', start_ms: 0, end_ms: 100 });
    const request = {
      type: 'session.delegation.created',
      offset_ms: 100,
      delegation: { id: 'task-1', target: 'client' }
    };
    socket.receive(request);
    socket.receive(request);
    await vi.waitFor(() => expect(backend).toHaveBeenCalledTimes(1));
    expect(backend.mock.calls[0][1]).toContain('six times seven');
    expect(socket.sent.at(-1)).toMatchObject({
      type: 'session.commentary.append',
      delegation_id: 'task-1',
      content: '42'
    });
    client.stop();
  });

  it('stops capture immediately but waits for final usage before closing transport', async () => {
    const error = vi.fn();
    const client = new RealtimeClient('token', 'gpt-live-1', { onError: error });
    await client.start();
    const socket = Socket.instance;
    socket.open();
    socket.receive({ type: 'session.started' });
    client.stop();
    client.stop();
    expect(track.stop).toHaveBeenCalled();
    expect(socket.close).not.toHaveBeenCalled();
    expect(socket.sent.filter((e) => e.type === 'session.close')).toHaveLength(1);
    socket.receive({ type: 'session.closed', usage: { seconds: 15 } });
    expect(socket.close).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(15000);
    expect(error).not.toHaveBeenCalled();
  });
});
