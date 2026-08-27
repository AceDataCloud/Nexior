import { describe, expect, it } from 'vitest';
import { resolveShowcase } from './showcase';

const site = {
  id: 'site',
  features: {
    nanobanana: { enabled: true },
    seedance: { enabled: true },
    suno: { enabled: true },
    maestro: { enabled: true }
  }
} as any;

const item = (service: string, type: string, request: Record<string, unknown>, response: Record<string, unknown>) => ({
  id: 'showcase-id',
  service,
  task_id: 'task-id',
  data: { type, request, response }
});

describe('resolveShowcase', () => {
  it('uses localized presentation without changing the raw replay prompt', () => {
    const source = {
      ...item('nano-banana', 'images', { prompt: 'Crystal garden' }, { data: [{ image_url: 'image.jpg' }] }),
      data: {
        type: 'images',
        request: { prompt: 'Crystal garden' },
        response: { data: [{ image_url: 'image.jpg' }] },
        presentation: { title: '水晶花园', description: '透明晶体在柔光中构成宁静花园。' }
      }
    };
    const result = resolveShowcase(source, site);
    expect(result).toMatchObject({
      title: '水晶花园',
      description: '透明晶体在柔光中构成宁静花园。',
      prompt: 'Crystal garden'
    });
  });

  it('derives an image card from a normal task response', () => {
    const result = resolveShowcase(
      item('nano-banana', 'images', { prompt: 'Crystal garden' }, { data: [{ image_url: 'image.jpg' }] }),
      site
    );
    expect(result).toMatchObject({
      mediaType: 'Image',
      posterUrl: 'image.jpg',
      previewUrl: '',
      title: 'Nano Banana',
      description: 'Crystal garden'
    });
  });

  it('derives a video card and poster from video_url and last_frame_url', () => {
    const result = resolveShowcase(
      item(
        'seedance',
        'videos',
        { prompt: 'Paper fox' },
        { data: { video_url: 'video.mp4', last_frame_url: 'poster.jpg' } }
      ),
      site
    );
    expect(result).toMatchObject({
      mediaType: 'Video',
      posterUrl: 'poster.jpg',
      previewUrl: 'video.mp4',
      layout: 'Landscape'
    });
  });

  it('uses task audio metadata without a presentation envelope', () => {
    const result = resolveShowcase(
      item(
        'suno',
        'audios',
        { prompt: 'Nocturne' },
        { data: [{ title: 'Amber Nocturne', audio_url: 'audio.mp3', image_url: 'cover.jpg' }] }
      ),
      site
    );
    expect(result).toMatchObject({
      mediaType: 'Audio',
      title: 'Amber Nocturne',
      posterUrl: 'cover.jpg',
      previewUrl: 'audio.mp3'
    });
  });

  it('derives a Maestro video from variants, cover, aspect, and request metadata', () => {
    const source = {
      ...item(
        'maestro',
        'videos',
        {
          action: 'generate',
          prompt: 'Explain aerodynamic downforce',
          langs: ['en'],
          aspect: '9:16',
          duration: 20,
          quality: 'lite',
          scenario: 'narrated',
          style: 'industrial',
          voice: 'documentary-male'
        },
        {
          success: true,
          data: {
            cover_url: 'poster.webp',
            variants: [{ lang: 'en', aspect: '9:16', kind: 'video', output_url: 'video.mp4' }]
          }
        }
      ),
      data: {
        type: 'videos',
        request: {
          action: 'generate',
          prompt: 'Explain aerodynamic downforce',
          langs: ['en'],
          aspect: '9:16',
          duration: 20,
          quality: 'lite',
          scenario: 'narrated',
          style: 'industrial',
          voice: 'documentary-male'
        },
        response: {
          success: true,
          data: {
            cover_url: 'poster.webp',
            variants: [{ lang: 'en', aspect: '9:16', kind: 'video', output_url: 'video.mp4' }]
          }
        },
        presentation: { title: 'Air at Speed', description: 'A concise engineering explainer.' }
      }
    };
    const result = resolveShowcase(source, site);
    expect(result).toMatchObject({
      capability: 'maestro',
      routeName: 'maestro-index',
      mediaType: 'Video',
      posterUrl: 'poster.webp',
      previewUrl: 'video.mp4',
      layout: 'Portrait',
      title: 'Air at Speed',
      prompt: '',
      model: '',
      parameters: []
    });
  });

  it('rejects Maestro videos without both a poster and a playable variant', () => {
    expect(
      resolveShowcase(
        item('maestro', 'videos', { prompt: 'Missing video', aspect: '16:9' }, { data: { cover_url: 'poster.webp' } }),
        site
      )
    ).toBeUndefined();
    expect(
      resolveShowcase(
        item(
          'maestro',
          'videos',
          { prompt: 'Missing poster', aspect: '16:9' },
          { data: { variants: [{ output_url: 'video.mp4' }] } }
        ),
        site
      )
    ).toBeUndefined();
  });
});
