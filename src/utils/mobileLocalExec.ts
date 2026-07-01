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
  } catch {
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

/** Per-call consent: honor a persisted always-allow grant, else fall back to a
 *  native confirm. Returns false → the action is denied and reported as a tool
 *  error (never silently). */
function ensureConsent(name: string): boolean {
  if (readGrants().includes(name)) return true;
  const ok =
    typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(`Allow this chat to run "${name}" on your phone?`)
      : false;
  return ok;
}

async function accessibilityGranted(): Promise<boolean> {
  try {
    const s = await ComputerUse.status();
    return !!s.accessibility;
  } catch {
    return false;
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
    setComputerUseEnabled(!!cfg.computerUse);
    return true;
  },

  async pickFolder() {
    return null; // no authorized-roots concept on a phone
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
      await ComputerUse.openAccessibilitySettings();
    } catch {
      /* best-effort deep link */
    }
    const a11y = await accessibilityGranted();
    return { grants: readGrants(), perm: permShape(a11y), computerUse: true };
  }
};

async function invokeImpl(
  name: string,
  input: Record<string, unknown>
): Promise<{ output: string; is_error?: boolean; image?: string }> {
  if (!name.startsWith('computer.')) {
    return { output: `unknown tool: ${name}`, is_error: true };
  }
  if (!ensureConsent(name)) {
    return { output: `denied: user declined "${name}"`, is_error: true };
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
}
