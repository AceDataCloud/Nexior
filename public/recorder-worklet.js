// AudioWorklet running inside a 24 kHz AudioContext.
// Receives mono float32 mic frames, batches them, converts to PCM16,
// and posts ArrayBuffers to the main thread. Used by the realtime voice call.
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Int16Array(2048);
    this._n = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const ch = input[0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i++) {
      let s = ch[i];
      s = s < -1 ? -1 : s > 1 ? 1 : s;
      this._buf[this._n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this._n === this._buf.length) {
        const out = this._buf.slice(0, this._n);
        this.port.postMessage(out.buffer, [out.buffer]);
        this._n = 0;
      }
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
