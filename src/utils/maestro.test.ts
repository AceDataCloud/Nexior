import { describe, expect, it } from 'vitest';
import { MAESTRO_ALLOWED_SCENARIOS, MAESTRO_ALLOWED_STYLES, MAESTRO_ALLOWED_VOICES } from '@/constants';
import { buildMaestroGenerateRequest, buildMaestroRemixConfig, normalizeMaestroConfig } from './maestro';

describe('buildMaestroGenerateRequest', () => {
  it.each([
    [false, false, false, {}],
    [true, false, false, { scenario: 'avatar' }],
    [false, true, false, { style: 'cinematic' }],
    [false, false, true, { voice: 'warm-female' }],
    [true, true, false, { scenario: 'avatar', style: 'cinematic' }],
    [true, false, true, { scenario: 'avatar', voice: 'warm-female' }],
    [false, true, true, { style: 'cinematic', voice: 'warm-female' }],
    [true, true, true, { scenario: 'avatar', style: 'cinematic', voice: 'warm-female' }]
  ])(
    'sends only independently enabled fields (%s, %s, %s)',
    (scenarioEnabled, styleEnabled, voiceEnabled, expected) => {
      expect(
        buildMaestroGenerateRequest({
          customization_enabled: true,
          scenario_customization_enabled: scenarioEnabled,
          style_customization_enabled: styleEnabled,
          voice_customization_enabled: voiceEnabled,
          prompt: 'Launch video',
          scenario: 'avatar',
          style: 'cinematic',
          voice: 'warm-female'
        })
      ).toEqual({ prompt: 'Launch video', ...expected });
    }
  );

  it('replaces legacy auto values with real options when field toggles are explicitly enabled', () => {
    expect(
      buildMaestroGenerateRequest({
        scenario_customization_enabled: true,
        style_customization_enabled: true,
        voice_customization_enabled: true,
        scenario: 'auto',
        style: 'auto',
        voice: 'auto'
      })
    ).toEqual({
      scenario: 'narrated',
      style: 'cinematic',
      voice: 'warm-female'
    });
  });

  it('migrates the legacy global flag without turning legacy auto values into selections', () => {
    expect(
      normalizeMaestroConfig({
        customization_enabled: true,
        scenario: ' AUTO ',
        style: 'Auto',
        voice: 'auto '
      })
    ).toEqual({
      scenario_customization_enabled: false,
      style_customization_enabled: false,
      voice_customization_enabled: false
    });
  });

  it('infers field toggles from an existing task request', () => {
    expect(
      normalizeMaestroConfig({
        scenario: 'captions',
        style: 'cinematic',
        voice: 'warm-female',
        file_urls: ['https://example.com/source.mp4']
      })
    ).toEqual({
      scenario_customization_enabled: true,
      style_customization_enabled: true,
      voice_customization_enabled: true,
      scenario: 'captions',
      style: 'cinematic',
      voice: 'warm-female',
      file_urls: ['https://example.com/source.mp4']
    });
  });

  it('normalizes preset casing and preserves a raw Fish reference id', () => {
    expect(
      normalizeMaestroConfig({
        scenario: 'Avatar',
        voice: 'ABCDEF0123456789ABCDEF0123456789'
      })
    ).toMatchObject({
      scenario_customization_enabled: true,
      voice_customization_enabled: true,
      scenario: 'avatar',
      voice: 'abcdef0123456789abcdef0123456789'
    });
  });

  it('clears a field value when its independent toggle is disabled', () => {
    expect(
      normalizeMaestroConfig({
        scenario_customization_enabled: false,
        style_customization_enabled: true,
        voice_customization_enabled: false,
        scenario: 'avatar',
        style: 'editorial',
        voice: 'warm-female'
      })
    ).toEqual({
      scenario_customization_enabled: false,
      style_customization_enabled: true,
      voice_customization_enabled: false,
      style: 'editorial'
    });
  });

  it('preserves the source video when remixing a captions task', () => {
    expect(
      buildMaestroRemixConfig(undefined, {
        id: 'captions-task',
        request: {
          scenario: 'captions',
          file_urls: ['https://example.com/source.mp4']
        }
      })
    ).toMatchObject({
      action: 'remix',
      ref_task_id: 'captions-task',
      scenario_customization_enabled: true,
      scenario: 'captions',
      file_urls: ['https://example.com/source.mp4']
    });
  });

  it('drops stale auto and unknown values when remixing', () => {
    const result = buildMaestroRemixConfig(undefined, {
      id: 'legacy-task',
      request: {
        scenario: ' AUTO ',
        style: 'Auto',
        voice: 'unknown-voice'
      }
    });

    expect(result).toEqual({
      action: 'remix',
      ref_task_id: 'legacy-task',
      prompt: '',
      langs: undefined,
      aspect: undefined,
      duration: undefined,
      file_urls: [],
      scenario_customization_enabled: false,
      style_customization_enabled: false,
      voice_customization_enabled: false
    });
  });

  it('does not expose auto in any customization control', () => {
    expect(MAESTRO_ALLOWED_SCENARIOS).not.toContain('auto');
    expect(MAESTRO_ALLOWED_STYLES).not.toContain('auto');
    expect(MAESTRO_ALLOWED_VOICES.map((voice) => voice.key)).not.toContain('auto');
  });
});
