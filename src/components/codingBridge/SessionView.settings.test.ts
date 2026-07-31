// @vitest-environment jsdom
//
// The secondary composer controls (model / effort / permission / cwd) render
// inline on desktop and inside a dialog on phones. That is a structural choice,
// so it is driven by a matchMedia listener rather than a media query — these
// cover the switch, including the case that used to strand an open dialog:
// widening the window while it is showing.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/assets/images/logos/claude.svg', () => ({ default: 'claude.svg' }));
vi.mock('@/assets/images/logos/openai.svg', () => ({ default: 'openai.svg' }));
vi.mock('@/assets/images/logos/github-copilot.svg', () => ({ default: 'copilot.svg' }));

const SessionView = (await import('./SessionView.vue')).default as unknown as {
  methods: Record<string, (this: Ctx, ...args: unknown[]) => void>;
  data: () => Record<string, unknown>;
};

type Ctx = Record<string, unknown> & {
  mobileSettings: boolean;
  moreOpen: boolean;
  settingsMql?: MediaQueryList;
  watchSettingsBreakpoint: () => void;
  onSettingsBreakpoint: (event: MediaQueryListEvent) => void;
};

// A matchMedia stub whose `matches` we control, recording the listener so the
// test can fire a breakpoint change.
const stubMatchMedia = (matches: boolean) => {
  const listeners: ((event: MediaQueryListEvent) => void)[] = [];
  const mql = {
    matches,
    addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => listeners.push(fn),
    removeEventListener: vi.fn()
  } as unknown as MediaQueryList;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql)
  );
  return { mql, listeners };
};

const ctx = (): Ctx => {
  const self = { ...SessionView.data() } as unknown as Ctx;
  self.watchSettingsBreakpoint = SessionView.methods.watchSettingsBreakpoint.bind(self) as () => void;
  self.onSettingsBreakpoint = SessionView.methods.onSettingsBreakpoint.bind(self) as (
    event: MediaQueryListEvent
  ) => void;
  return self;
};

describe('coding bridge composer settings breakpoint', () => {
  it('starts in dialog mode when mounted on a narrow viewport', () => {
    stubMatchMedia(true);
    const self = ctx();
    self.watchSettingsBreakpoint();
    expect(self.mobileSettings).toBe(true);
  });

  it('starts inline on a wide viewport', () => {
    stubMatchMedia(false);
    const self = ctx();
    self.watchSettingsBreakpoint();
    expect(self.mobileSettings).toBe(false);
  });

  it('switches to dialog mode when the viewport narrows', () => {
    const { listeners } = stubMatchMedia(false);
    const self = ctx();
    self.watchSettingsBreakpoint();
    listeners.forEach((fn) => fn({ matches: true } as MediaQueryListEvent));
    expect(self.mobileSettings).toBe(true);
  });

  it('closes an open dialog when the viewport widens', () => {
    // Otherwise the controls render inline while `moreOpen` stays true, and the
    // next narrow resize pops the dialog open unprompted.
    const { listeners } = stubMatchMedia(true);
    const self = ctx();
    self.watchSettingsBreakpoint();
    self.moreOpen = true;
    listeners.forEach((fn) => fn({ matches: false } as MediaQueryListEvent));
    expect(self.mobileSettings).toBe(false);
    expect(self.moreOpen).toBe(false);
  });

  it('leaves the controls inline when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const self = ctx();
    self.watchSettingsBreakpoint();
    expect(self.mobileSettings).toBe(false);
    expect(self.settingsMql).toBeUndefined();
  });
});
