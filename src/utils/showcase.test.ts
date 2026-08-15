import { describe, expect, it } from 'vitest';
import { resolveShowcase } from './showcase';

const site = {
  id: 'site',
  features: {
    nanobanana: { enabled: true },
    seedance: { enabled: true },
    suno: { enabled: true }
  }
} as any;

const item = (service: string, type: string, request: Record<string, unknown>, response: Record<string, unknown>) => ({
  id: 'showcase-id',
  service,
  task_id: 'task-id',
  data: { type, request, response }
});

describe('resolveShowcase', () => {
  it('derives an image card from a normal task response', () => {
    const result = resolveShowcase(
      item('nano-banana', 'images', { prompt: 'Crystal garden' }, { data: [{ image_url: 'image.jpg' }] }),
      site,
      'en'
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
      site,
      'en'
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
      site,
      'en'
    );
    expect(result).toMatchObject({
      mediaType: 'Audio',
      title: 'Amber Nocturne',
      posterUrl: 'cover.jpg',
      previewUrl: 'audio.mp3'
    });
  });
});
