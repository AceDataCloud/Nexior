// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  edit: vi.fn(),
  ensureLoggedIn: vi.fn(() => true),
  ensureNoPendingUpload: vi.fn(() => true),
  instrument: vi.fn((_: string, operation: Promise<unknown>) => operation)
}));

vi.mock('@/operators', () => ({ openaiimageOperator: { generate: mocks.generate, edit: mocks.edit } }));
vi.mock('@/plugins/telemetry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/plugins/telemetry')>()),
  instrumentGeneration: mocks.instrument
}));
vi.mock('@/utils/showcaseRecreateMixin', () => ({ showcaseRecreateMixin: () => ({}) }));
vi.mock('@/utils/taskPollingMixin', () => ({ taskPollingMixin: () => ({}) }));
vi.mock('@/utils/quotaExhausted', () => ({ showQuotaExhausted: vi.fn(() => false) }));
vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => false,
  scenarioPaymentState: () => ({ mode: 'credits' }),
  setScenarioWalletAvailable: vi.fn()
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  ensureLoggedIn: mocks.ensureLoggedIn,
  ensureNoPendingUpload: mocks.ensureNoPendingUpload,
  uploadTrackerProviderMixin: {}
}));

import OpenAIImageIndex from './Index.vue';

function mountPage(imageUrls?: string[]) {
  return shallowMount(OpenAIImageIndex, {
    global: {
      provide: { initialized: false },
      mocks: {
        $t: (key: string) => key,
        $wallet: {},
        $store: {
          state: {
            openaiimage: {
              credential: { token: 'credential-token' },
              config: {
                model: 'gpt-image-2.5-sunburst:official',
                prompt: '  draw a detailed portrait  ',
                size: '2448x3264',
                quality: 'high',
                image_urls: imageUrls
              },
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
        ShowcaseResultTabs: true
      }
    }
  });
}

describe('OpenAI Image quality requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureLoggedIn.mockReturnValue(true);
    mocks.ensureNoPendingUpload.mockReturnValue(true);
    mocks.generate.mockResolvedValue({ data: { task_id: 'task-generate' } });
    mocks.edit.mockResolvedValue({ data: { task_id: 'task-edit' } });
    vi.spyOn(ElMessage, 'info').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'success').mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
  });

  it('passes quality to image generation', async () => {
    const wrapper = mountPage();

    await (wrapper.vm as any).onGenerate();
    await flushPromises();

    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-2.5-sunburst:official',
        prompt: 'draw a detailed portrait',
        size: '2448x3264',
        quality: 'high',
        action: 'generate',
        async: true
      }),
      { token: 'credential-token' }
    );
    expect(mocks.edit).not.toHaveBeenCalled();
  });

  it('passes quality to image editing', async () => {
    const wrapper = mountPage(['https://example.com/reference.png']);

    await (wrapper.vm as any).onGenerate();
    await flushPromises();

    expect(mocks.edit).toHaveBeenCalledWith(
      {
        model: 'gpt-image-2.5-sunburst:official',
        prompt: 'draw a detailed portrait',
        size: '2448x3264',
        quality: 'high',
        image_urls: ['https://example.com/reference.png'],
        action: 'edit',
        async: true
      },
      { token: 'credential-token' }
    );
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
