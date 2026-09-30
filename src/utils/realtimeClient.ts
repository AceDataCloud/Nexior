import { REALTIME_DEFAULT_VOICE, REALTIME_SAMPLE_RATE, WS_URL_REALTIME } from '@/constants';
import { requireServiceToken } from './requestAuth';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface IRealtimeHandlers {
  onStatus?: (status: RealtimeStatus, detail?: string) => void;
  onUserTranscript?: (text: string) => void;
  onAiTranscriptDelta?: (delta: string) => void;
  onAiResponseStart?: () => void;
  onUserSpeechStarted?: () => void;
  onPlayback?: (playing: boolean) => void;
  onDelegation?: (id: string, context: string) => Promise<string>;
  onError?: (message: string) => void;
  /** Smoothed combined mic+assistant loudness (0–1) for UI animation. */
  onAudioLevel?: (level: number) => void;
}

/** GPT-Live PCM24k voice transport. The relay owns authentication and duration
 * billing; client delegation uses the app's existing chat backend. */
export class RealtimeClient {
  private readonly token: string;
  private readonly model: string;
  private readonly handlers: IRealtimeHandlers;
  private voice: string;

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
  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private startupTimer: ReturnType<typeof setTimeout> | undefined;
  private finalized = false;
  private started = false;
  private userTranscript = '';
  private transcript: { speaker: string; text: string; start: number; end: number }[] = [];
  private delegationIds = new Set<string>();
  private delegationQueue = Promise.resolve();

  constructor(token: string, model: string, handlers: IRealtimeHandlers, voice: string = REALTIME_DEFAULT_VOICE) {
    this.token = token;
    this.model = model;
    this.handlers = handlers;
    this.voice = voice;
  }

  get isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    this.handlers.onStatus?.('connecting');
    // Cover capture/worklet startup too: a pending permission prompt or suspended
    // audio context must not leave the call connecting forever.
    let stage = 'audio';
    this.startupTimer = setTimeout(() => {
      if (!this.running && !this.disposed) {
        console.warn('[voice] Startup timed out', stage);
        this.handlers.onError?.('Voice session startup timed out. Check microphone permission and tap to retry.');
        this.stop();
      }
    }, 30000);
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new Ctx({ sampleRate: REALTIME_SAMPLE_RATE });
    console.debug('[voice] Starting audio', this.audioCtx.state);
    // Call resume before yielding so a retry from a click retains user activation.
    await Promise.all([this.audioCtx.resume(), this.audioCtx.audioWorklet.addModule('/recorder-worklet.js')]);
    if (this.disposed) return this.teardownAudio(); // user hit End/Back mid-startup

    stage = 'microphone';
    console.debug('[voice] Requesting microphone');
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

    stage = 'connection';
    console.debug('[voice] Connecting');
    this.ws = new WebSocket(WS_URL_REALTIME, ['live', `acedata-token.${requireServiceToken(this.token)}`]);
    this.ws.onopen = () => {
      if (this.disposed) {
        this.ws?.close();
        return;
      }
      this.send({
        type: 'session.start',
        session: {
          model: this.model,
          instructions:
            "Be concise and friendly. Speak in the user's language. Delegate questions that need reasoning, current information or tools to the backend. Do not claim an action succeeded until the backend confirms it.",
          audio: { format: { type: 'audio/pcm', rate: REALTIME_SAMPLE_RATE }, output: { voice: this.voice } },
          delegation: { type: 'client' },
          store: false
        }
      });
    };
    this.ws.onclose = () => {
      clearTimeout(this.startupTimer);
      clearTimeout(this.closeTimer);
      if (this.started && !this.finalized)
        this.handlers.onError?.('Voice connection closed before final usage was confirmed');
      this.disposed = true;
      this.handlers.onStatus?.('disconnected');
      this.teardownAudio();
      this.running = false;
    };
    this.ws.onerror = () => this.handlers.onStatus?.('error');
    this.ws.onmessage = (e) => this.onServerEvent(e);

    this.workletNode.port.onmessage = (e) => {
      if (!this.running || this.disposed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ type: 'session.input_audio.append', audio: b64FromArrayBuffer(e.data) }));
    };
  }

  /** Mute/unmute the microphone without tearing down the call. */
  setMuted(muted: boolean): void {
    this.micStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    if (this.running) this.send({ type: muted ? 'session.input_audio.mute' : 'session.input_audio.unmute' });
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
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.startupTimer);
    this.teardownAudio();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'session.close' });
      this.closeTimer = setTimeout(() => {
        if (!this.finalized) this.handlers.onError?.('Voice session final usage could not be confirmed');
        this.ws?.close();
      }, 15000);
    } else {
      this.ws?.close();
    }
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
    if (evt.type === 'session.closed') {
      this.finalized = true;
      clearTimeout(this.closeTimer);
      this.ws?.close();
      return;
    }
    if (this.disposed) return;
    switch (evt.type) {
      case 'session.started':
        console.debug('[voice] Session started');
        clearTimeout(this.startupTimer);
        this.started = true;
        this.running = true;
        this.handlers.onStatus?.('connected');
        break;
      case 'session.input_transcript.delta':
      case 'session.output_transcript.delta': {
        if (typeof evt.delta !== 'string') break;
        const user = evt.type === 'session.input_transcript.delta';
        this.transcript.push({
          speaker: user ? 'user' : 'assistant',
          text: evt.delta,
          start: evt.start_ms,
          end: evt.end_ms
        });
        // Bound memory for long calls; preserve each received fragment verbatim.
        if (this.transcript.length > 2000) this.transcript.splice(0, 100);
        if (user) {
          this.userTranscript = (this.userTranscript + evt.delta).slice(-600);
          this.handlers.onUserTranscript?.(this.userTranscript);
        } else {
          this.handlers.onAiTranscriptDelta?.(evt.delta);
        }
        break;
      }
      case 'session.output_audio.delta':
        if (evt.delta) this.enqueuePcm16(evt.delta);
        break;
      case 'session.delegation.created': {
        const id = evt.delegation?.id ?? evt.delegation_id;
        if (typeof id !== 'string' || this.delegationIds.has(id)) break;
        this.delegationIds.add(id);
        // Serial backend requests retain context and cannot overwrite newer results.
        this.delegationQueue = this.delegationQueue.then(async () => {
          if (this.disposed) return;
          const context = [...this.transcript]
            .sort((a, b) => a.start - b.start)
            .map((part) => `${part.speaker} [${part.start}-${part.end}ms]: ${part.text}`)
            .join('\n')
            .slice(-24000);
          try {
            const result = await this.handlers.onDelegation?.(id, context);
            if (!this.disposed) this.sendBackendResult(id, result || 'The backend did not return an answer.');
          } catch {
            if (!this.disposed)
              this.sendBackendResult(
                id,
                'The backend could not complete this request. Do not claim success. Ask the user to retry in the text conversation.'
              );
          }
        });
        break;
      }
      case 'error':
        this.handlers.onError?.(evt.error?.message || 'Voice session error');
        if (!this.running) this.stop();
        break;
    }
  }

  private sendBackendResult(id: string, result: string): void {
    // Conservative Unicode chunks stay below Live's 500-token append limit,
    // including CJK text. Only the final chunk requests a spoken response.
    const chars = Array.from(result.slice(0, 6000));
    for (let i = 0; i < chars.length; i += 120) {
      this.send({
        type: i + 120 >= chars.length ? 'session.commentary.append' : 'session.thinking.append',
        delegation_id: id,
        content: chars.slice(i, i + 120).join('')
      });
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
    const wasPlaying = this.activeSources.length > 0;
    this.activeSources.push(src);
    if (!wasPlaying) this.handlers.onPlayback?.(true);
    src.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== src);
      if (!this.activeSources.length) this.handlers.onPlayback?.(false);
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
    this.handlers.onPlayback?.(false);
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
