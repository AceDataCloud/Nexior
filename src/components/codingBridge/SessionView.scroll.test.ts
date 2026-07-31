// @vitest-environment jsdom
//
// The transcript must open — and stay — at the newest message. Two bugs made it
// crawl in from the top instead: the watcher observed the events ARRAY (which
// `appendEvent` mutates in place, so it never fired), and nothing scrolled on
// mount for a transcript restored before the component existed.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/assets/images/logos/claude.svg', () => ({ default: 'claude.svg' }));
vi.mock('@/assets/images/logos/openai.svg', () => ({ default: 'openai.svg' }));
vi.mock('@/assets/images/logos/github-copilot.svg', () => ({ default: 'copilot.svg' }));

const SessionView = (await import('./SessionView.vue')).default as unknown as {
  watch: Record<string, (this: Ctx) => void>;
  methods: Record<string, (this: Ctx, ...args: unknown[]) => void>;
  mounted: (this: Ctx) => void;
  updated: (this: Ctx) => void;
  beforeUnmount: (this: Ctx) => void;
  data: () => Record<string, unknown>;
};

type Ctx = Record<string, unknown> & {
  pinnedToBottom: boolean;
  visibleCount: number;
  scrolled: number;
  scrollPending: boolean;
  transcriptObserver?: { disconnect: () => void };
  observedTranscript?: HTMLElement;
  $refs: { transcript?: HTMLElement };
  $nextTick: (fn: () => void) => void;
  scrollToBottom: () => void;
  scheduleScrollToBottom: () => void;
  observeTranscript: () => void;
};

// A transcript element with real geometry: jsdom reports 0 for every layout
// property, so the scroll maths needs explicit values.
const transcriptEl = (geo: { scrollHeight: number; clientHeight: number; scrollTop: number }): HTMLElement => {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { get: () => geo.scrollHeight });
  Object.defineProperty(el, 'clientHeight', { get: () => geo.clientHeight });
  Object.defineProperty(el, 'scrollTop', {
    get: () => geo.scrollTop,
    set: (value: number) => {
      geo.scrollTop = value;
    }
  });
  return el;
};

const ctx = (overrides: Partial<Ctx> = {}): Ctx => {
  const geo = { scrollHeight: 5000, clientHeight: 600, scrollTop: 0 };
  const self = {
    ...SessionView.data(),
    geo,
    $refs: { transcript: transcriptEl(geo) },
    // Run synchronously so the assertions don't have to await the scheduler.
    $nextTick: (fn: () => void) => fn(),
    requestCapabilities: () => {},
    syncSessionSettings: () => {},
    // Unrelated to scrolling, and jsdom has no matchMedia by default.
    watchSettingsBreakpoint: () => {},
    ...overrides
  } as unknown as Ctx;
  self.scrollToBottom = SessionView.methods.scrollToBottom.bind(self) as () => void;
  self.scheduleScrollToBottom = SessionView.methods.scheduleScrollToBottom.bind(self) as () => void;
  self.observeTranscript = SessionView.methods.observeTranscript.bind(self) as () => void;
  return self;
};

// rAF is the second pass of scrollToBottom; run it inline.
vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
  fn(0);
  return 0;
});

describe('coding bridge transcript scroll pinning', () => {
  it('watches the event COUNT, not the array instance', () => {
    // `appendEvent` pushes into the same array, so a watcher on `events` sees
    // oldValue === newValue and never fires. Watching the length is what makes
    // live output keep the view at the bottom.
    expect(SessionView.watch.eventCount).toBeDefined();
    expect(SessionView.watch.events).toBeUndefined();
  });

  it('jumps to the bottom when the event count changes', () => {
    const self = ctx();
    SessionView.watch.eventCount.call(self);
    expect((self as unknown as { geo: { scrollTop: number } }).geo.scrollTop).toBe(5000);
  });

  it('scrolls on mount so a restored transcript opens at its newest turn', () => {
    // Deep link / reload: the events are already in the store before this
    // component mounts, so no watcher ever fires for them.
    const self = ctx();
    SessionView.mounted.call(self);
    expect((self as unknown as { geo: { scrollTop: number } }).geo.scrollTop).toBe(5000);
  });

  it('does not yank the user back down while they read earlier turns', () => {
    const self = ctx({ pinnedToBottom: false });
    SessionView.watch.eventCount.call(self);
    expect((self as unknown as { geo: { scrollTop: number } }).geo.scrollTop).toBe(0);
  });

  it('detaches when scrolled up and re-attaches at the bottom', () => {
    const self = ctx();
    const geo = (self as unknown as { geo: { scrollTop: number } }).geo;
    // Far from the bottom → following is off.
    geo.scrollTop = 1000;
    SessionView.methods.onTranscriptScroll.call(self);
    expect(self.pinnedToBottom).toBe(false);
    // Back within the threshold (5000 - 4390 - 600 = 10px) → following resumes.
    geo.scrollTop = 4390;
    SessionView.methods.onTranscriptScroll.call(self);
    expect(self.pinnedToBottom).toBe(true);
  });

  it('re-pins and resets the render window when switching conversations', () => {
    const self = ctx({ pinnedToBottom: false, visibleCount: 240 });
    SessionView.watch.currentSessionId.call(self);
    expect(self.pinnedToBottom).toBe(true);
    expect(self.visibleCount).toBe(60);
    expect((self as unknown as { geo: { scrollTop: number } }).geo.scrollTop).toBe(5000);
  });

  it('unpins when the user loads earlier turns', () => {
    const self = ctx();
    SessionView.methods.loadEarlier.call(self);
    expect(self.pinnedToBottom).toBe(false);
    expect(self.visibleCount).toBe(120);
  });

  // Streamed output arrives as `appendDelta`, which mutates the open bubble's
  // text in place: the event COUNT never changes, so no watcher fires. Only a
  // DOM observer keeps the view on the growing tail.
  it('follows text that grows in place, where the event count never changes', async () => {
    const self = ctx();
    const el = self.$refs.transcript as HTMLElement;
    const bubble = document.createElement('p');
    bubble.textContent = 'hel';
    el.appendChild(bubble);
    document.body.appendChild(el);
    SessionView.mounted.call(self);
    const geo = (self as unknown as { geo: { scrollTop: number; scrollHeight: number } }).geo;
    geo.scrollTop = 0;

    // A delta lands: same event, longer text, taller transcript.
    bubble.textContent = 'hello world';
    geo.scrollHeight = 6000;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(geo.scrollTop).toBe(6000);
  });

  it('does not chase the tail once the user has scrolled up', async () => {
    const self = ctx({ pinnedToBottom: false });
    const el = self.$refs.transcript as HTMLElement;
    document.body.appendChild(el);
    SessionView.mounted.call(self);
    const geo = (self as unknown as { geo: { scrollTop: number } }).geo;

    el.appendChild(document.createElement('p'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(geo.scrollTop).toBe(0);
  });

  it('attaches the observer once the transcript appears after mount', async () => {
    // The transcript is behind `v-if="currentNode"`, so on a reload with a
    // persisted node id the element does not exist yet at mount — the device
    // list lands later. Without the `updated` hook the observer never attached
    // and streamed output stopped following the tail.
    const self = ctx({ $refs: {} });
    SessionView.mounted.call(self);
    expect(self.transcriptObserver).toBeUndefined();

    const geo = (self as unknown as { geo: { scrollHeight: number; clientHeight: number; scrollTop: number } }).geo;
    const el = transcriptEl(geo);
    document.body.appendChild(el);
    self.$refs.transcript = el;
    SessionView.updated.call(self);
    expect(self.transcriptObserver).toBeDefined();

    geo.scrollTop = 0;
    el.appendChild(document.createElement('p'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(geo.scrollTop).toBe(5000);
  });

  it('re-attaching is a no-op while the element is unchanged', () => {
    const self = ctx();
    document.body.appendChild(self.$refs.transcript as HTMLElement);
    SessionView.mounted.call(self);
    const first = self.transcriptObserver;
    SessionView.updated.call(self);
    expect(self.transcriptObserver).toBe(first);
  });

  it('disconnects the old observer when the transcript element is replaced', () => {
    const self = ctx();
    document.body.appendChild(self.$refs.transcript as HTMLElement);
    SessionView.mounted.call(self);
    const first = self.transcriptObserver as { disconnect: () => void };
    let disconnected = false;
    first.disconnect = () => {
      disconnected = true;
    };

    const geo = (self as unknown as { geo: { scrollHeight: number; clientHeight: number; scrollTop: number } }).geo;
    self.$refs.transcript = transcriptEl(geo);
    SessionView.updated.call(self);

    expect(disconnected).toBe(true);
    expect(self.transcriptObserver).not.toBe(first);
  });

  it('disconnects the observer on unmount', () => {
    const self = ctx();
    document.body.appendChild(self.$refs.transcript as HTMLElement);
    SessionView.mounted.call(self);
    expect(self.transcriptObserver).toBeDefined();
    SessionView.beforeUnmount.call(self);
    expect(self.transcriptObserver).toBeUndefined();
  });
});
