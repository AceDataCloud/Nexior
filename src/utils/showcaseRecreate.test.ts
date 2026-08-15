// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ElMessage, ElMessageBox } from 'element-plus';
import { showcaseOperator } from '@/operators';
import { consumeShowcase } from './showcaseRecreate';

vi.mock('@/operators', () => ({ showcaseOperator: { list: vi.fn() } }));
vi.mock('element-plus', () => ({ ElMessage: { warning: vi.fn() }, ElMessageBox: { confirm: vi.fn() } }));

const ID = '196387e7-f217-453f-a678-ed1165e0cbd9';
const SERVICES: Record<string, string> = {
  nanobanana: 'nano-banana',
  openaiimage: 'openai',
  seedream: 'seedream',
  seedance: 'seedance',
  kling: 'kling',
  veo: 'veo',
  grokvideo: 'grok',
  suno: 'suno',
  producer: 'producer',
  fish: 'fish'
};
const item = (capability: string, request: Record<string, unknown>, service = SERVICES[capability]) => ({
  id: ID,
  service,
  task_id: null,
  data: {
    type: service === 'suno' || service === 'producer' || service === 'fish' ? 'audios' : 'videos',
    request,
    response: {}
  }
});

function context(capability: string, config: Record<string, unknown> | undefined = undefined) {
  const commit = vi.fn();
  const dispatch = vi.fn();
  const replace = vi.fn().mockResolvedValue(undefined);
  return {
    options: {
      capability: capability as any,
      route: { path: `/${capability}`, params: {}, query: { showcase: ID, locale: 'en' }, hash: '#form' } as any,
      router: { replace } as any,
      store: { state: { site: {}, [capability]: { config } }, commit, dispatch } as any,
      site: { features: { [capability]: { enabled: true } } } as any,
      t: (key: string) => key
    },
    commit,
    dispatch,
    replace
  };
}

describe('showcase recreate consumer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any);
  });

  it.each([
    [
      'nanobanana',
      { prompt: 'Portrait', images: ['https://cdn.acedata.cloud/ref'], aspect_ratio: '1:1' },
      'image_urls'
    ],
    ['openaiimage', { prompt: 'Editorial', size: '1536x1024' }, 'size'],
    ['seedream', { prompt: 'Mist', max_images: 2, output_format: 'jpeg' }, 'output_format'],
    ['seedance', { prompt: 'Motion', duration: 4, ratio: '16:9' }, 'ratio'],
    ['kling', { prompt: 'Rain', mode: 'std' }, 'mode'],
    ['veo', { prompt: 'Flower', translation: false }, 'translation'],
    ['grokvideo', { prompt: 'City', resolution: '720p' }, 'resolution'],
    ['suno', { prompt: 'Nocturne', instrumental: true }, 'instrumental'],
    ['producer', { prompt: 'Dream pop', style: 'Dream pop' }, 'style'],
    ['fish', { text: 'Welcome', format: 'mp3', speed: 1 }, 'format']
  ])(
    'loads %s once by service and applies safe config without tasks or submit',
    async (capability, request, expectedKey) => {
      vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [item(capability, request)] } as any);
      const { options, commit, dispatch, replace } = context(capability);
      expect(await consumeShowcase(options)).toBe('applied');
      expect(showcaseOperator.list).toHaveBeenCalledWith(SERVICES[capability]);
      expect(commit.mock.calls.find(([type]) => type === `${capability}/setConfig`)?.[1]).toHaveProperty(expectedKey);
      expect(dispatch).not.toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith({ path: `/${capability}`, query: { locale: 'en' }, hash: '#form' });
    }
  );

  it('chooses Veo image-to-video when curated images are present', async () => {
    const request = { prompt: 'Animate this', images: ['https://cdn.acedata.cloud/reference.png'] };
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [item('veo', request)] } as any);
    const { options, commit } = context('veo');
    await consumeShowcase(options);
    expect(commit).toHaveBeenCalledWith(
      'veo/setConfig',
      expect.objectContaining({ action: 'image2video', image_urls: ['https://cdn.acedata.cloud/reference.png'] })
    );
  });

  it('forces Kling into ordinary video mode', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [item('kling', { prompt: 'Paper bird' })] } as any);
    const { options, commit } = context('kling');
    await consumeShowcase(options);
    expect(commit.mock.calls.slice(0, 2)).toEqual([
      ['kling/setTaskType', 'videos'],
      ['kling/setConfig', expect.objectContaining({ action: 'generate', prompt: 'Paper bird' })]
    ]);
  });

  it.each([
    ['unknown field', item('seedance', { prompt: 'Safe', callback_url: 'https://example.com' })],
    ['external media', item('nanobanana', { prompt: 'Safe', images: ['https://example.com/private.png'] })],
    ['service mismatch', item('seedance', { prompt: 'Safe' }, 'veo')],
    ['missing UUID', { ...item('seedance', { prompt: 'Safe' }), id: 'different-id' }]
  ])('rejects %s and strips replay query', async (_label, response) => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [response] } as any);
    const { options, commit, replace } = context('seedance');
    expect(await consumeShowcase(options)).toBe('failed');
    expect(commit).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalled();
    expect(ElMessage.warning).toHaveBeenCalled();
  });

  it('does not fetch malformed IDs', async () => {
    const { options, replace } = context('seedance');
    (options.route.query as any).showcase = 'not-a-uuid';
    expect(await consumeShowcase(options)).toBe('invalid');
    expect(showcaseOperator.list).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalled();
  });

  it('preserves active input on cancel and fully replaces it after confirmation', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [item('seedance', { prompt: 'New prompt' })] } as any);
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'));
    const first = context('seedance', { prompt: 'My draft', duration: 5 });
    expect(await consumeShowcase(first.options)).toBe('cancelled');
    expect(first.commit).not.toHaveBeenCalled();

    vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as any);
    const second = context('seedance', { prompt: 'Old prompt', duration: 5, resolution: '720p' });
    expect(await consumeShowcase(second.options)).toBe('applied');
    expect(second.commit).toHaveBeenCalledWith('seedance/setConfig', { prompt: 'New prompt' });
  });
});
