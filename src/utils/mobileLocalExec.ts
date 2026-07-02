/**
 * Android `window.localExec` adapter — the mobile analogue of the Electron
 * preload bridge (`electron/local/*`). It implements the SAME
 * {@link LocalExecBridge} contract so the aichat2 chat loop
 * (`src/pages/chat/Conversation.vue`) drives phone-side `computer.*` tools with
 * zero chat-path branching: `supportsClientTools()` returns true on Android,
 * `listTools()`/`invoke()` are called identically to desktop, and a screenshot
 * comes back as a `data:image/jpeg;base64,…` string that the existing
 * screenshot→URL upload (#1107) turns into a short hosted URL before it ever
 * hits the LLM context.
 *
 * Differences from desktop, by design:
 *  - No fs/shell builtins (a phone has no authorized roots) → `listTools()`
 *    only ever returns the `computer.*` set, `builtinTools()` is empty.
 *  - `move` is a no-op (Android has no hover pointer) — handled natively.
 *  - Consent is a lightweight localStorage "always-allow" grant keyed by tool
 *    name, with a `window.confirm` fallback, instead of the macOS TCC panes.
 *
 * The heavy lifting is the native {@link ComputerUse} Capacitor plugin
 * (AccessibilityService + `takeScreenshot`). Every native method already
 * rejects until the user enables the accessibility service, so this adapter
 * never has to re-check that invariant — it just surfaces the rejection as a
 * tool error the model can react to.
 */
import { Capacitor } from '@capacitor/core';
import { ComputerUse } from '@/plugins/computerUse';
import i18n from '@/i18n';
import type { LocalExecBridge, LocalToolSpec } from '@/utils/desktop';

const ENABLED_KEY = 'nexior.android.cu.enabled';
const GRANTS_KEY = 'nexior.android.cu.grants';

/** Mirrors the desktop `COMPUTER_TOOLS` specs (electron/local/registry.ts) so
 *  the model sees an identical tool surface across desktop and Android. */
const COMPUTER_TOOLS: LocalToolSpec[] = [
  {
    name: 'computer.screenshot',
    description:
      "Capture the user's phone screen. Returns raw pixel dimensions; the image is attached for you to see the current UI before acting. Coordinates for click/scroll are in this same raw pixel space.",
    input_schema: { type: 'object', properties: {} },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.click',
    description: "Tap the screen at raw-pixel (x, y) on the user's phone.",
    input_schema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        button: { type: 'string', enum: ['left', 'right', 'middle'] }
      },
      required: ['x', 'y']
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.move',
    description: "No-op on Android (phones have no hover pointer); accepted so the loop doesn't stall.",
    input_schema: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' } },
      required: ['x', 'y']
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.type',
    description: "Type text into the currently focused input field on the user's phone.",
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.key',
    description:
      "Press a system key on the user's phone. Supported: ['back'], ['home'], ['recents'], ['notifications'].",
    input_schema: {
      type: 'object',
      properties: { keys: { type: 'array', items: { type: 'string' } } },
      required: ['keys']
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.scroll',
    description:
      'Scroll the phone screen (optionally centered on x,y). Positive scrollY = content moves up (fling down), positive scrollX = right.',
    input_schema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        scrollX: { type: 'number' },
        scrollY: { type: 'number' }
      },
      required: []
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.dump_ui',
    description:
      'List the tappable/editable UI elements currently on screen using the accessibility tree — each with its visible label and a precise center coordinate. Call this after a screenshot to get EXACT tap targets instead of guessing pixel coordinates from the image. Then prefer computer.tap_text to act on a listed label.',
    input_schema: { type: 'object', properties: {} },
    source: 'builtin',
    mutates: false
  },
  {
    name: 'computer.tap_text',
    description:
      "Tap a UI element by its visible text or content-description (uses the accessibility tree for a precise, reliable tap). STRONGLY PREFER this over computer.click for buttons, tabs, icons, list items and app-drawer icons — it hits the real element instead of a guessed pixel. Give the exact or partial label, e.g. 'Clock' or 'Add alarm'.",
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.observe',
    description:
      'BEST way to see and act: returns a screenshot with a numbered box drawn on every tappable element, plus a legend mapping each number to its label. Prefer this over computer.screenshot when you intend to tap something — then call computer.tap_mark with the number of the element you want. Removes all coordinate guessing.',
    input_schema: { type: 'object', properties: {} },
    source: 'builtin',
    mutates: true
  },
  {
    name: 'computer.tap_mark',
    description:
      'Tap the numbered element from the most recent computer.observe (Set-of-Mark). Pass the mark number shown on the annotated screenshot. This is the most reliable way to tap.',
    input_schema: {
      type: 'object',
      properties: { mark: { type: 'integer' } },
      required: ['mark']
    },
    source: 'builtin',
    mutates: true
  }
];

function computerUseEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

function setComputerUseEnabled(on: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
  } catch {
    /* private mode / storage disabled — treat as ephemeral off */
  }
}

function readGrants(): string[] {
  try {
    const raw = localStorage.getItem(GRANTS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch (e) {
    // Corrupt/again-fail-closed: lose the grants and re-prompt next time.
    console.warn('[ComputerUse] failed to parse grants from localStorage', e);
    return [];
  }
}

function writeGrants(names: string[]): void {
  try {
    localStorage.setItem(GRANTS_KEY, JSON.stringify([...new Set(names)]));
  } catch {
    /* ignore */
  }
}

/** Per-call consent: honor a persisted always-allow grant, else show a NATIVE
 *  3-tier on-demand confirm — Allow once / Always allow / Deny — mirroring the
 *  desktop native confirm (Electron main-process dialog). "Always allow"
 *  persists a grant (same store the Settings → Local Tools toggles read/write),
 *  so the action never prompts again and shows ON in Settings. Returns false →
 *  denied (never silent). */
async function ensureConsent(name: string): Promise<boolean> {
  if (readGrants().includes(name)) return true;
  // On-demand consent needs a VISIBLE prompt. If Nexior is backgrounded (the
  // model is mid-task operating another app), we can't prompt — deny
  // (fail-closed) rather than surface a dialog the user can't see. Autonomous
  // background tasks must pre-authorize the action in Settings → Local Tools.
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false;
  }
  const t = i18n.global.t;
  const action = name.replace(/^computer\./, '');
  try {
    const { choice } = await ComputerUse.confirmConsent({
      title: t('common.settings.cuConsentTitle'),
      message: t('common.settings.cuConsentMessage', { action }),
      onceLabel: t('common.settings.cuConsentAllow'),
      alwaysLabel: t('common.settings.cuConsentAlways'),
      denyLabel: t('common.settings.cuConsentDeny')
    });
    if (choice === 'always') {
      // Persist so this action never prompts again (and lights up its Settings
      // → Local Tools toggle). Revocable there or by turning Computer Use off.
      writeGrants([...readGrants(), name]);
      return true;
    }
    return choice === 'once';
  } catch {
    return false;
  }
}

async function accessibilityGranted(): Promise<boolean> {
  try {
    const s = await ComputerUse.status();
    return !!s.accessibility;
  } catch {
    return false;
  }
}

/** Best-effort request for POST_NOTIFICATIONS (Android 13+) so the foreground
 *  Computer-Use session's Stop notification is actually visible. Reuses the
 *  local-notifications plugin the app already ships. Requested at most once per
 *  app session. Never throws. */
let notifPermRequested = false;
async function requestNotificationPermission(): Promise<void> {
  if (notifPermRequested) return;
  notifPermRequested = true;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
  } catch {
    /* best-effort */
  }
}

function permShape(a11y: boolean) {
  // Android has no macOS-style TCC panes; map the single accessibility grant
  // onto the desktop-shaped struct so shared UI/consumers don't choke.
  return {
    mac: false,
    fullDisk: false,
    screen: a11y ? 'granted' : 'denied',
    mic: 'denied',
    accessibility: a11y
  };
}

const bridge: LocalExecBridge = {
  available: true,

  async listTools(): Promise<LocalToolSpec[]> {
    // Only advertise the tools once Computer Use is switched on, mirroring the
    // desktop `computerUse` flag. Perm is enforced at invoke time.
    return computerUseEnabled() ? COMPUTER_TOOLS : [];
  },

  async invoke(inv: { name: string; input: object; sessionId: string }) {
    return invokeImpl(inv.name, (inv.input ?? {}) as Record<string, unknown>);
  },

  async getConfig() {
    return { roots: [], mcp: [], computerUse: computerUseEnabled() };
  },

  async saveConfig(cfg) {
    const on = !!cfg.computerUse;
    setComputerUseEnabled(on);
    try {
      if (on) {
        // Re-enabling clears any prior user Stop so actions are allowed again.
        await ComputerUse.resetStop();
      } else {
        // Turning Computer Use off ends any live session + revokes grants.
        writeGrants([]);
        await ComputerUse.stopSession();
      }
    } catch {
      /* ignore */
    }
    return true;
  },

  async pickFolder() {
    return null; // no authorized-roots concept on a phone
  },

  perm: {
    // Android's one relevant "permission" for Computer Use is the accessibility
    // service. Map it onto the desktop-shaped struct (only `accessibility` is
    // meaningful) so Settings can show status + a jump-to-settings button.
    async status() {
      return permShape(await accessibilityGranted());
    },
    async openPane(k: 'fullDisk' | 'screen' | 'accessibility') {
      if (k === 'accessibility') {
        try {
          await ComputerUse.openAccessibilitySettings();
        } catch {
          /* ignore */
        }
        return true;
      }
      return false;
    },
    async askMedia() {
      return false;
    }
  },

  grants: {
    async list() {
      return readGrants();
    },
    async revoke(key: string) {
      writeGrants(readGrants().filter((n) => n !== key));
      return true;
    },
    async clear() {
      writeGrants([]);
      return true;
    },
    async grantToolWide(name: string) {
      const next = [...readGrants(), name];
      writeGrants(next);
      return { grants: [...new Set(next)], ok: true };
    }
  },

  async builtinTools() {
    return []; // no fs/shell builtins on Android
  },

  async computerTools() {
    return COMPUTER_TOOLS.map((s) => ({ name: s.name, description: s.description }));
  },

  async preauthorizeComputerUse(names?: string[]) {
    // Turn Computer Use on, always-allow the requested actions (or all), and
    // jump the user to Settings → Accessibility to enable the service.
    setComputerUseEnabled(true);
    const toGrant = names && names.length ? names : COMPUTER_TOOLS.map((s) => s.name);
    writeGrants([...readGrants(), ...toGrant]);
    try {
      // Re-arm after any prior user Stop, request the notification permission so
      // the foreground-session Stop notification is visible (Android 13+ gates
      // it), then jump to Accessibility settings.
      await ComputerUse.resetStop();
      await requestNotificationPermission();
      await ComputerUse.openAccessibilitySettings();
    } catch {
      /* best-effort deep link */
    }
    const a11y = await accessibilityGranted();
    return { grants: readGrants(), perm: permShape(a11y), computerUse: true };
  },

  onComputerUseDisabled(cb: () => void) {
    // Kill switch: the foreground-session notification's Stop button fires the
    // native `computerUseDisabled` event → turn Computer Use off, revoke all
    // grants, and notify the app. The model cannot bypass this.
    let handle: { remove: () => void } | undefined;
    let disposed = false;
    void ComputerUse.addListener('computerUseDisabled', () => {
      setComputerUseEnabled(false);
      writeGrants([]);
      cb();
    })
      .then((h) => {
        handle = h as unknown as { remove: () => void };
        // If unsubscribed before the listener finished registering, remove now.
        if (disposed) handle.remove?.();
      })
      .catch(() => {
        /* listener registration failed — nothing to remove */
      });
    return () => {
      disposed = true;
      handle?.remove?.();
    };
  }
};

async function invokeImpl(
  name: string,
  input: Record<string, unknown>
): Promise<{ output: string; is_error?: boolean; image?: string }> {
  if (!name.startsWith('computer.')) {
    return { output: `unknown tool: ${name}`, is_error: true };
  }
  if (!(await ensureConsent(name))) {
    return {
      output: `denied: "${name}" is not pre-authorized. Ask the user to allow it when prompted (foreground), or pre-authorize it in Settings → Local Tools.`,
      is_error: true
    };
  }
  // Keep the process foreground-priority for the whole task so the agent loop
  // isn't throttled/killed while Nexior is backgrounded operating another app.
  // Idempotent + fire-and-forget; the first action of a task runs while Nexior
  // is still foreground, so the FGS start is allowed.
  try {
    await ComputerUse.startSession();
  } catch (e) {
    // Non-fatal: the action can still run (the accessibility service is
    // independent), just without the extra background-liveness guarantee.
    console.warn('[ComputerUse] startSession failed; loop may be throttled if backgrounded', e);
  }
  try {
    switch (name) {
      case 'computer.screenshot': {
        const res = await ComputerUse.screenshot();
        return {
          output: JSON.stringify({ width: res.width, height: res.height }),
          image: res.image
        };
      }
      case 'computer.dump_ui': {
        const res = await ComputerUse.dumpUi();
        return { output: res.tree || '[]' };
      }
      case 'computer.observe': {
        const res = await ComputerUse.observe();
        // The legend goes in `output` (text the model reads), the annotated
        // screenshot in `image` (uploaded to a URL by #1107 for the vision model).
        let marks: unknown = [];
        try {
          marks = JSON.parse(res.marks || '[]');
        } catch {
          marks = [];
        }
        return {
          output: JSON.stringify({ width: res.width, height: res.height, marks }),
          image: res.image
        };
      }
      case 'computer.tap_mark': {
        const mark = Number(input.mark);
        if (!Number.isInteger(mark) || mark < 1) {
          return { output: 'tap_mark requires a positive integer mark from the last observe', is_error: true };
        }
        const r = await ComputerUse.tapMark({ mark });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.tap_text': {
        const text = String(input.text ?? '').trim();
        if (!text) return { output: 'tap_text requires non-empty text', is_error: true };
        const r = await ComputerUse.tapText({ text });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.click': {
        const r = await ComputerUse.click({
          x: Number(input.x),
          y: Number(input.y),
          button: typeof input.button === 'string' ? input.button : undefined
        });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.move': {
        const r = await ComputerUse.move({ x: Number(input.x), y: Number(input.y) });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.type': {
        const r = await ComputerUse.type({ text: String(input.text ?? '') });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.key': {
        const keys = Array.isArray(input.keys) ? (input.keys as unknown[]).map(String) : [];
        const r = await ComputerUse.key({ keys });
        return { output: r.note ?? 'ok' };
      }
      case 'computer.scroll': {
        const r = await ComputerUse.scroll({
          x: input.x != null ? Number(input.x) : undefined,
          y: input.y != null ? Number(input.y) : undefined,
          scrollX: input.scrollX != null ? Number(input.scrollX) : undefined,
          scrollY: input.scrollY != null ? Number(input.scrollY) : undefined
        });
        return { output: r.note ?? 'ok' };
      }
      default:
        return { output: `unknown tool: ${name}`, is_error: true };
    }
  } catch (e) {
    return { output: e instanceof Error ? e.message : String(e), is_error: true };
  }
}

/**
 * Install the Android local-exec bridge onto `window.localExec` (idempotent).
 * No-op unless running as the Android Capacitor app. Call once at boot.
 */
export function installMobileLocalExec(): void {
  if (typeof window === 'undefined') return;
  if (Capacitor.getPlatform() !== 'android') return;
  if (window.localExec) return; // already installed (or a desktop preload)
  window.localExec = bridge;
  console.debug('[ComputerUse] Android local-exec bridge installed');
}
