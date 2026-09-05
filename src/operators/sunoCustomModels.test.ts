import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSunoAudioRequest } from './suno';

const source = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

describe('Suno custom model integration contract', () => {
  it('keeps custom_model_id out of the standard audio endpoint payload', () => {
    const request = buildSunoAudioRequest({
      custom: true,
      custom_model_id: 'model-id',
      lyric: 'hello',
      continue_at: 0
    });

    expect(request).not.toHaveProperty('custom_model_id');
    expect(request.lyric).toBe('hello');
  });

  it('routes only active custom-mode generation and forwards supported controls', () => {
    const page = source('pages/suno/Index.vue');
    const panel = source('components/suno/ConfigPanel.vue');

    expect(page).toContain('!!this.config?.custom && !!customModelId');
    expect(page).toContain("!this.config?.action || this.config.action === 'generate'");
    for (const field of ['vocal_gender', 'weirdness', 'style_influence', 'duration']) {
      expect(page).toContain(`${field}: request.${field}`);
    }
    expect(panel).toContain('const pricingConfig = this.usesCustomModel');
  });

  it('reuses an idempotency key for the same failed submission and rotates it after edits', () => {
    const dialog = source('components/suno/model/CustomModelCreateDialog.vue');

    expect(dialog).toContain('if (fingerprint !== this.submittedFingerprint)');
    expect(dialog).toContain('this.idempotencyKey = crypto.randomUUID()');
    expect(dialog).toContain('idempotencyKey: this.idempotencyKey');
    expect(dialog.match(/crypto\.randomUUID\(\)/g)).toHaveLength(1);
  });
});
