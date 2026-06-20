import { REALTIME_SAMPLE_RATE, WS_URL_REALTIME } from '@/constants';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface IRealtimeHandlers {
  onStatus?: (status: RealtimeStatus, detail?: string) => void;
  onUserTranscript?: (text: string) => void;
  onAiTranscriptDelta?: (delta: string) => void;
  onAiResponseStart?: () => void;
  onUserSpeechStarted?: () => void;
  onError?: (message: string) => void;
  /** Smoothed combined mic+assistant loudness (0–1) for UI animation. */
  onAudioLevel?: (level: number) => void;
}

/**
 * Browser realtime voice client: captures the mic as 24kHz PCM16 via an
 * AudioWorklet, streams it to wss://…/v1/realtime, plays the assistant audio
 * back with a scheduled queue, and barges-in (stops playback) when the server
 * VAD reports the user started speaking. Speaks the OpenAI Realtime GA event
 * format directly; the relay injects the session config + upstream key.
 */
export class RealtimeClient {
  private readonly token: string;
  private readonly model: string;
  private readonly handlers: IRealtimeHandlers;

  private ws: WebSocket | undefined;
  private audioCtx: AudioContext | undefined;
  private micStream: MediaStream | undefined;
  private micNode: MediaStreamAudioSourceNode | undefined;
  private workletNode: AudioWorkletNode | undefined;
  private analyser: AnalyserNode | undefined; // taps mic + assistant audio for the level meter
  private levelRaf = 0;
  private running = false;

  private playHead = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private disposed = false; // set by stop(); aborts an in-flight start()
  private suppressAudio = false; // drop in-flight deltas after a barge-in
  private aiResponding = false; // a response is streaming (so barge-in can cancel it)

  constructor(token: string, model: string, handlers: IRealtimeHandlers) {
    this.token = token;
    this.model = model;
    this.handlers = handlers;
  }

  get isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    this.handlers.onStatus?.('connecting');
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new Ctx({ sampleRate: REALTIME_SAMPLE_RATE });
    await this.audioCtx.audioWorklet.addModule('/recorder-worklet.js');
    if (this.disposed) return this.teardownAudio(); // user hit End/Back mid-startup

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    if (this.disposed) return this.teardownAudio();
    this.micNode = this.audioCtx.createMediaStreamSource(this.micStream);
    this.workletNode = new AudioWorkletNode(this.audioCtx, 'recorder-processor');
    this.micNode.connect(this.workletNode);
    // Level meter: an analyser sees the mic and (later) the assistant playback so
    // the UI orb pulses for whoever is talking. It's a sink — never wired onward
    // to the destination, so it adds no audible echo.
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.micNode.connect(this.analyser);
    this.startLevelLoop();
    // The worklet must be in the graph to pull; route it to a muted gain so the
    // mic isn't echoed to the speaker.
    const sink = this.audioCtx.createGain();
    sink.gain.value = 0;
    this.workletNode.connect(sink).connect(this.audioCtx.destination);

    const url = `${WS_URL_REALTIME}?model=${encodeURIComponent(this.model)}`;
    this.ws = new WebSocket(url, ['realtime', `acedata-token.${this.token}`]);

    this.ws.onopen = () => {
      if (this.disposed) {
        this.ws?.close();
        return;
      }
      this.running = true;
      this.handlers.onStatus?.('connected');
    };
    this.ws.onclose = () => {
      this.handlers.onStatus?.('disconnected');
      this.teardownAudio();
      this.running = false;
    };
    this.ws.onerror = () => this.handlers.onStatus?.('error');
    this.ws.onmessage = (e) => this.onServerEvent(e);

    this.workletNode.port.onmessage = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64FromArrayBuffer(e.data) }));
    };
  }

  /** Mute/unmute the microphone without tearing down the call. */
  setMuted(muted: boolean): void {
    this.micStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  private startLevelLoop(): void {
    const data = new Uint8Array(this.analyser ? this.analyser.fftSize : 0);
    let smooth = 0;
    const tick = () => {
      if (this.disposed || !this.analyser) return;
      this.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 3.4); // amplify quiet speech into a visible range
      smooth = smooth * 0.82 + level * 0.18; // ease for a fluid orb, no jitter
      this.handlers.onAudioLevel?.(smooth);
      this.levelRaf = requestAnimationFrame(tick);
    };
    this.levelRaf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.disposed = true;
    // Close whether the socket is still CONNECTING or already OPEN.
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }
    this.teardownAudio();
    this.running = false;
    this.handlers.onStatus?.('disconnected');
  }

  private send(event: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event));
  }

  private onServerEvent(e: MessageEvent): void {
    let evt: any;
    try {
      evt = JSON.parse(e.data);
    } catch {
      return;
    }
    switch (evt.type) {
      case 'session.created':
      case 'session.updated':
        break;
      case 'input_audio_buffer.speech_started':
        // Barge-in: stop local playback, cancel the upstream response so it
        // stops generating, and drop any deltas still in flight until the next
        // response starts.
        this.stopPlayback();
        if (this.aiResponding) this.send({ type: 'response.cancel' });
        this.suppressAudio = true;
        this.handlers.onUserSpeechStarted?.();
        break;
      case 'conversation.item.input_audio_transcription.completed':
        this.handlers.onUserTranscript?.(evt.transcript || '');
        break;
      case 'response.created':
        this.aiResponding = true;
        this.suppressAudio = false;
        this.handlers.onAiResponseStart?.();
        break;
      case 'response.done':
        this.aiResponding = false;
        break;
      // Handle GA names plus legacy aliases so audio always plays.
      case 'response.output_audio.delta':
      case 'response.audio.delta':
        if (evt.delta && !this.suppressAudio) this.enqueuePcm16(evt.delta);
        break;
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        if (evt.delta) this.handlers.onAiTranscriptDelta?.(evt.delta);
        break;
      case 'error': {
        const err = evt.error || {};
        this.handlers.onError?.(err.message || 'realtime error');
        break;
      }
      default:
        break;
    }
  }

  private enqueuePcm16(b64: string): void {
    if (!this.audioCtx) return;
    const buf = arrayBufferFromB64(b64);
    const i16 = new Int16Array(buf);
    if (i16.length === 0) return;
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;

    const audioBuffer = this.audioCtx.createBuffer(1, f32.length, REALTIME_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(f32);
    const src = this.audioCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.audioCtx.destination);
    if (this.analyser) src.connect(this.analyser); // feed the level meter so the orb reacts while the assistant speaks

    const now = this.audioCtx.currentTime;
    if (this.playHead < now) this.playHead = now + 0.02;
    src.start(this.playHead);
    this.playHead += audioBuffer.duration;
    this.activeSources.push(src);
    src.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== src);
    };
  }

  private stopPlayback(): void {
    for (const s of this.activeSources) {
      try {
        s.onended = null;
        s.stop();
      } catch {
        // ignore
      }
    }
    this.activeSources = [];
    this.playHead = 0;
  }

  private teardownAudio(): void {
    try {
      if (this.levelRaf) cancelAnimationFrame(this.levelRaf);
      if (this.workletNode) this.workletNode.port.onmessage = null;
      if (this.micStream) this.micStream.getTracks().forEach((t) => t.stop());
      this.stopPlayback();
      if (this.audioCtx) this.audioCtx.close();
    } catch {
      // ignore
    }
    this.levelRaf = 0;
    this.handlers.onAudioLevel?.(0);
    this.micStream = this.micNode = this.workletNode = this.audioCtx = this.analyser = undefined;
  }
}

function b64FromArrayBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

function arrayBufferFromB64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
