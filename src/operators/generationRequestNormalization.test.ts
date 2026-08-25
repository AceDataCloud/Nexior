import { describe, expect, it } from 'vitest';
import { buildHailuoRequest } from './hailuo';
import { buildKlingVideoRequest } from './kling';
import { buildMidjourneyImagineRequest, buildMidjourneyVideosRequest } from './midjourney';
import { buildPikaRequest } from './pika';
import { buildPixverseRequest } from './pixverse';
import { buildProducerAudioRequest } from './producer';
import { buildQrartRequest } from './qrart';
import { buildSoraRequest } from './sora';
import { buildWanRequest } from './wan';
import { buildMaestroRequest } from './maestro';
import { buildQwenImageRequest } from '@/utils/qwenimage/request';
import { buildSeedreamRequest } from '@/utils/seedream/request';
import { buildVeoGenerateRequest } from '@/utils/veo/config';

const builders = [
  ['hailuo', buildHailuoRequest],
  ['kling', buildKlingVideoRequest],
  ['pika', buildPikaRequest],
  ['pixverse', buildPixverseRequest],
  ['sora', buildSoraRequest],
  ['wan', buildWanRequest],
  ['qwenimage', buildQwenImageRequest],
  ['seedream', buildSeedreamRequest],
  ['veo', buildVeoGenerateRequest],
  ['maestro', buildMaestroRequest]
] as const;

describe('generation request prompt normalization', () => {
  it.each(builders)('%s trims prompts without mutating config', (_service, builder) => {
    const config = { prompt: '  create something  ' };
    expect((builder as (value: any) => any)(config).prompt).toBe('create something');
    expect(config.prompt).toBe('  create something  ');
  });

  it('trims QR Art and Producer prompt fields', () => {
    const qr = { type: 'text', prompt: '  QR prompt  ' };
    expect(buildQrartRequest(qr as never).prompt).toBe('QR prompt');
    expect(qr.prompt).toBe('  QR prompt  ');

    const producer = {
      prompt: ' prompt ',
      lyric: ' lyric ',
      lyric_prompt: ' lyric prompt ',
      style: ' style ',
      title: ' title '
    };
    expect(buildProducerAudioRequest(producer as never)).toMatchObject({
      prompt: 'prompt',
      lyric: 'lyric',
      lyric_prompt: 'lyric prompt',
      style: 'style',
      title: 'title'
    });
    expect(producer.prompt).toBe(' prompt ');
  });

  it('does not let Midjourney parameters disguise whitespace-only text', () => {
    expect(buildMidjourneyImagineRequest({ prompt: '   ', model: 'niji', version: '8' }).prompt).toBe('');
    expect(buildMidjourneyVideosRequest({ prompt: '  animate this  ' }).prompt).toBe('animate this');
  });
});
