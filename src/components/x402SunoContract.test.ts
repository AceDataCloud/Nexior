import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), 'src', relativePath), 'utf8');

describe('Suno x402 contract', () => {
  it('registers Suno and shares the audio builder between quote and submit', () => {
    expect(source('layouts/Main.vue')).toContain("'suno'");
    expect(source('components/suno/ConfigPanel.vue')).toContain(
      'sunoOperator.quoteAudio(buildSunoAudioRequest(this.config))'
    );
    expect(source('pages/suno/Index.vue')).toContain('buildSunoAudioRequest(this.config)');
  });

  it('uses endpoint-specific payment for every UI-used exact action', () => {
    const lyrics = source('components/suno/config/LyricInput.vue');
    const style = source('components/suno/config/StyleInput.vue');
    const voice = source('components/suno/voice/VoiceCreateDialog.vue');
    const preview = source('components/suno/task/Preview.vue');

    expect(lyrics).toContain('sunoOperator.lyric({ prompt }, options)');
    expect(lyrics).toContain('sunoOperator.lyric({ prompt: theme }, options)');
    expect(style).toContain('sunoOperator.style({ prompt: this.style }, options)');
    expect(voice).toContain('sunoOperator.persona(');
    expect(voice).toContain('sunoOperator.voices(');
    ['.vox(', '.timing(', '.wav(', '.midi(', '.audio('].forEach((call) => expect(preview).toContain(call));
  });

  it('keeps upload and persona reads/deletes authenticated Credits-only', () => {
    const operator = source('operators/suno.ts');
    expect(operator).toContain("return await axios.post('/suno/upload'");
    expect(operator).toContain("return await axios.get('/suno/persona'");
    expect(operator).toContain("return await axios.delete('/suno/persona'");
  });

  it('keeps guest task IDs in page memory and propagates secondary task IDs', () => {
    const page = source('pages/suno/Index.vue');
    const panel = source('components/suno/RecentPanel.vue');
    const preview = source('components/suno/task/Preview.vue');
    expect(page).toContain('walletTaskIds: string[]');
    expect(page).toContain("mode: 'x402', ids: this.walletTaskIds");
    expect(page).toContain('identityToken: this.credential?.token');
    expect(panel).toContain('@wallet-task="$emit(\'wallet-task\', $event)"');
    expect(preview).toContain("this.$emit('wallet-task', taskId)");
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('sessionStorage');
  });
});
