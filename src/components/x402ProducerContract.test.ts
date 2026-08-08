import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('Producer x402 contract', () => {
  it('registers Producer and shares the audio builder between quote and submit', () => {
    expect(source('layouts/Main.vue')).toContain("'producer'");
    expect(source('components/producer/ConfigPanel.vue')).toContain(
      'producerOperator.quoteAudio(buildProducerAudioRequest(this.config))'
    );
    expect(source('pages/producer/Index.vue')).toContain('buildProducerAudioRequest(this.config)');
  });

  it('keeps lyrics, wav, video, and upload endpoint semantics separate', () => {
    const lyrics = source('components/producer/config/LyricInput.vue');
    const preview = source('components/producer/task/Preview.vue');
    const operator = source('operators/producer.ts');

    expect(lyrics).toContain('producerOperator.lyric({ prompt }, options)');
    expect(preview).toContain('producerOperator.wav({ audio_id: audio.id }, options)');
    expect(preview).toContain('.video(request, options)');
    expect(operator).toContain("return axios.post('/producer/upload', data");
    expect(operator).not.toContain("postWithX402<IProducerUploadResponse>('/producer/upload'");
  });

  it('tracks guest main and secondary tasks in page memory only', () => {
    const page = source('pages/producer/Index.vue');
    const panel = source('components/producer/RecentPanel.vue');
    const preview = source('components/producer/task/Preview.vue');

    expect(page).toContain('walletTaskIds: string[]');
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
    expect(page).toContain('identityToken: this.credential?.token');
    expect(panel).toContain('@wallet-task="$emit(\'wallet-task\', $event)"');
    expect(preview).toContain("this.$emit('wallet-task', taskId)");
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('sessionStorage');
  });
});
