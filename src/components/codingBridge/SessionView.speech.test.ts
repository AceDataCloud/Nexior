// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/assets/images/logos/claude.svg', () => ({ default: 'claude.svg' }));
vi.mock('@/assets/images/logos/openai.svg', () => ({ default: 'openai.svg' }));
vi.mock('@/assets/images/logos/github-copilot.svg', () => ({ default: 'copilot.svg' }));

const controller = {
  isSupported: vi.fn(async () => true),
  start: vi.fn(async () => undefined),
  stop: vi.fn(async () => undefined),
  abort: vi.fn(async () => undefined),
  dispose: vi.fn(async () => undefined)
};

vi.mock('@/utils/speechRecognition', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/speechRecognition')>();
  return { ...actual, createSpeechRecognitionController: () => controller };
});

const SessionView = (await import('./SessionView.vue')).default as unknown as {
  data: () => Record<string, unknown>;
  computed: Record<string, (this: Ctx) => unknown>;
  methods: Record<string, (this: Ctx, ...args: any[]) => any>;
  beforeUnmount?: (this: Ctx) => void;
};

type Ctx = Record<string, any>;

function ctx(): Ctx {
  const self = {
    ...SessionView.data(),
    $i18n: { locale: 'zh-CN' },
    $t: (key: string) => key,
    $store: {
      state: {
        codingBridge: { connection: 'connected' },
        openaiimage: { credential: { token: 'api-token' } }
      },
      dispatch: vi.fn()
    }
  } as Ctx;
  for (const [name, method] of Object.entries(SessionView.methods)) {
    self[name] = method.bind(self);
  }
  Object.defineProperties(self, {
    speechActive: { get: () => SessionView.computed.speechActive.call(self) },
    attachments: { get: () => [] },
    uploadingAttachments: { get: () => false },
    connected: { get: () => true },
    nodeOnline: { get: () => true },
    canSend: { get: () => SessionView.computed.canSend.call(self) }
  });
  return self;
}

describe('coding bridge speech input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects support and starts recognition in the current locale', async () => {
    const self = ctx();
    await self.initializeSpeechRecognition();
    expect(self.speechSupported).toBe(true);

    self.prompt = '检查登录流程';
    await self.startSpeechRecognition();
    expect(self.speechState).toBe('listening');
    expect(controller.start).toHaveBeenCalledWith(
      'zh-CN',
      'api-token',
      expect.objectContaining({
        onResult: expect.any(Function),
        onEnd: expect.any(Function),
        onError: expect.any(Function)
      })
    );
  });

  it('preserves an existing draft and replaces interim recognition text', () => {
    const self = ctx();
    self.speechState = 'listening';
    self.speechBasePrompt = '检查登录流程';

    self.applySpeechSnapshot({ finalText: '', interimText: '重点看看' });
    expect(self.prompt).toBe('检查登录流程\n重点看看');
    self.applySpeechSnapshot({ finalText: '', interimText: '重点看看刷新逻辑' });
    expect(self.prompt).toBe('检查登录流程\n重点看看刷新逻辑');
  });

  it('keeps final text, drops interim text, and never sends automatically', () => {
    const self = ctx();
    self.speechState = 'listening';
    self.speechBasePrompt = '';
    self.applySpeechSnapshot({ finalText: '最终内容', interimText: '未确认' });
    self.finishSpeechRecognition();

    expect(self.prompt).toBe('最终内容');
    expect(self.speechState).toBe('idle');
    expect(self.$store.dispatch).not.toHaveBeenCalledWith('codingBridge/sendPrompt', expect.anything());
  });

  it('blocks sending while recognition is active and allows it after ending', () => {
    const self = ctx();
    self.prompt = '语音草稿';
    self.speechState = 'listening';
    expect(self.canSend).toBe(false);
    self.speechState = 'idle';
    expect(self.canSend).toBe(true);
  });

  it('uses graceful stop for the button and abort for lifecycle cancellation', async () => {
    const self = ctx();
    self.speechController = controller;
    self.speechState = 'listening';
    await self.stopSpeechRecognition();
    expect(self.speechState).toBe('stopping');
    expect(controller.stop).toHaveBeenCalledOnce();

    self.speechState = 'listening';
    self.speechBasePrompt = '已有';
    self.speechFinalText = '确认';
    self.speechInterimText = '临时';
    await self.cancelSpeechRecognition();
    expect(controller.abort).toHaveBeenCalledOnce();
    expect(self.prompt).toBe('已有\n确认');
    expect(self.speechState).toBe('idle');
  });

  it('disposes the controller on component unmount', async () => {
    const self = ctx();
    self.speechController = controller;
    self.transcriptObserver = undefined;
    self.settingsMql = undefined;
    SessionView.beforeUnmount?.call(self);
    expect(controller.dispose).toHaveBeenCalledOnce();
  });
});
