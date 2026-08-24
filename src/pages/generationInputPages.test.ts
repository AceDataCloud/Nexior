// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const mocks = vi.hoisted(() => ({
  fluxGenerate: vi.fn(),
  veoGenerate: vi.fn(),
  producerAudio: vi.fn(),
  ensureLoggedIn: vi.fn(() => true),
  ensureNoPendingUpload: vi.fn(() => true),
  instrument: vi.fn((_: string, operation: Promise<unknown>) => operation)
}));

vi.mock('@/operators/flux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators/flux')>()),
  fluxOperator: { generate: mocks.fluxGenerate }
}));
vi.mock('@/operators/veo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators/veo')>()),
  veoOperator: { generate: mocks.veoGenerate }
}));
vi.mock('@/operators/producer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators/producer')>()),
  producerOperator: { audio: mocks.producerAudio }
}));
vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  instrumentGeneration: mocks.instrument
}));
vi.mock('@/utils/showcaseRecreateMixin', () => ({ showcaseRecreateMixin: () => ({}) }));
vi.mock('@/utils/quotaExhausted', () => ({ showQuotaExhausted: vi.fn(() => false) }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => false,
  scenarioPaymentState: () => ({ mode: 'credits' })
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn,
  ensureNoPendingUpload: mocks.ensureNoPendingUpload,
  uploadTrackerProviderMixin: {}
}));

import FluxIndex from './flux/Index.vue';
import ProducerIndex from './producer/Index.vue';
import VeoIndex from './veo/Index.vue';

const mountPage = (component: any, service: string, config: Record<string, unknown>) =>
  shallowMount(component, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $route: { query: {} },
        $router: { replace: vi.fn() },
        $store: {
          state: {
            [service]: {
              credential: { token: 'credential-token' },
              config,
              status: { getApplications: Status.Success, getTasks: Status.Success }
            }
          },
          dispatch: vi.fn().mockResolvedValue([]),
          commit: vi.fn()
        }
      },
      stubs: {
        Layout: { template: '<main><slot name="config" /><slot name="result" /></main>' },
        ConfigPanel: true,
        RecentPanel: true,
        PreviewPanel: true,
        ShowcaseResultTabs: true
      }
    }
  });

describe('generation page input guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureLoggedIn.mockReturnValue(true);
    mocks.ensureNoPendingUpload.mockReturnValue(true);
    mocks.fluxGenerate.mockResolvedValue({ data: { task_id: 'flux-task' } });
    mocks.veoGenerate.mockResolvedValue({ data: { task_id: 'veo-task' } });
    mocks.producerAudio.mockResolvedValue({ data: { task_id: 'producer-task' } });
    vi.spyOn(ElMessage, 'info').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'warning').mockImplementation(() => undefined as never);
  });

  it('blocks a blank Flux prompt before login or upload checks', async () => {
    const wrapper = mountPage(FluxIndex, 'flux', { prompt: '   ' });
    mocks.ensureNoPendingUpload.mockClear();
    mocks.ensureLoggedIn.mockClear();

    await (wrapper.vm as any).onGenerate();

    expect(ElMessage.error).toHaveBeenCalledWith('common.message.promptRequired');
    expect(mocks.ensureNoPendingUpload).not.toHaveBeenCalled();
    expect(mocks.ensureLoggedIn).not.toHaveBeenCalled();
    expect(mocks.fluxGenerate).not.toHaveBeenCalled();
  });

  it('requires a prompt for Veo text mode but accepts image mode', async () => {
    const textWrapper = mountPage(VeoIndex, 'veo', { action: 'text2video', prompt: '\n' });
    await (textWrapper.vm as any).onGenerate();
    expect(mocks.veoGenerate).not.toHaveBeenCalled();
    expect(ElMessage.error).toHaveBeenCalledWith('common.message.promptRequired');

    const imageWrapper = mountPage(VeoIndex, 'veo', {
      action: 'image2video',
      image_urls: ['https://example.com/frame.png']
    });
    await (imageWrapper.vm as any).onGenerate();
    await flushPromises();
    expect(mocks.veoGenerate).toHaveBeenCalledOnce();
  });

  it('accepts Producer source audio while blocking an entirely empty request', async () => {
    const emptyWrapper = mountPage(ProducerIndex, 'producer', {});
    await (emptyWrapper.vm as any).onGenerateAudio();
    expect(mocks.producerAudio).not.toHaveBeenCalled();
    expect(ElMessage.error).toHaveBeenCalledWith('common.message.generationInputRequired');

    const audioWrapper = mountPage(ProducerIndex, 'producer', { action: 'extend', audio_id: 'source-audio' });
    await (audioWrapper.vm as any).onGenerateAudio();
    await flushPromises();
    expect(mocks.producerAudio).toHaveBeenCalledOnce();
  });
});
