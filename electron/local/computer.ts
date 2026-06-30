import { desktopCapturer, screen as eScreen, app } from 'electron';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ToolResult } from './types';
import { status } from './permissions';

// Computer-use POC: lets the model SEE the screen (screenshot) and ACT on the
// user's machine (mouse / keyboard) — the GUI-control flavor (cf. Codex/Claude
// "computer use"). Screenshot uses Electron's built-in desktopCapturer (no
// native dep). Input injection (click/move/type/key/scroll) uses nut.js, which
// is loaded lazily and optionally: if the native module isn't installed the
// action returns a clear, structured error instead of crashing — so the build
// and non-desktop paths stay green. All actions are gated upstream by the
// per-tool consent prompt (registered as `mutates`) and macOS TCC permissions
// (Screen Recording for capture, Accessibility for input).

// ---- nut.js: lazy, optional load (no static module resolution) -------------

interface NutPoint {
  x: number;
  y: number;
}
interface NutButton {
  LEFT: unknown;
  RIGHT: unknown;
  MIDDLE: unknown;
}
interface NutModule {
  mouse: {
    setPosition: (p: NutPoint) => Promise<unknown>;
    click: (button: unknown) => Promise<unknown>;
    scrollDown: (amount: number) => Promise<unknown>;
    scrollUp: (amount: number) => Promise<unknown>;
    scrollLeft: (amount: number) => Promise<unknown>;
    scrollRight: (amount: number) => Promise<unknown>;
  };
  keyboard: {
    type: (text: string) => Promise<unknown>;
    pressKey: (...keys: unknown[]) => Promise<unknown>;
    releaseKey: (...keys: unknown[]) => Promise<unknown>;
    config: { autoDelayMs: number };
  };
  Point: new (x: number, y: number) => NutPoint;
  Button: NutButton;
  Key: Record<string, unknown>;
}

let nutCache: NutModule | null | undefined;

function loadNut(): NutModule | null {
  if (nutCache !== undefined) return nutCache;
  try {
    // Variable specifier ⇒ tsc does not statically resolve it, so the build
    // succeeds even when the optional native dep is absent.
    const moduleName = '@nut-tree-fork/nut-js';
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    nutCache = require(moduleName) as NutModule;
    nutCache.keyboard.config.autoDelayMs = 0;
  } catch {
    nutCache = null;
  }
  return nutCache;
}

const INPUT_BACKEND_HINT =
  'input backend unavailable: install the optional dependency ' +
  '`@nut-tree-fork/nut-js` and run `electron-rebuild` to enable mouse/keyboard ' +
  'control (see plans/desktop-computer-use). Screenshot still works without it.';

function err(message: string): ToolResult {
  return { output: message, is_error: true };
}

// Cap retained screenshots so the capture dir can't grow without bound and
// stale screen captures (sensitive) don't linger. shot-<ms>.png names sort
// chronologically, so keep the newest MAX_SHOTS and unlink the rest.
const MAX_SHOTS = 10;

// Stay safely under the aichat2 worker's tool-result image budget (~6 MB of
// base64); JPEG quality is stepped down until the encoded screenshot fits.
const MAX_IMAGE_B64_CHARS = 5_400_000;
async function pruneShots(dir: string): Promise<void> {
  try {
    const files = (await fsp.readdir(dir)).filter((f) => f.startsWith('shot-') && f.endsWith('.png')).sort();
    for (const f of files.slice(0, Math.max(0, files.length - MAX_SHOTS))) {
      await fsp.unlink(path.join(dir, f)).catch(() => undefined);
    }
  } catch {
    /* best-effort cleanup */
  }
}

// macOS gate: capture needs Screen Recording, input needs Accessibility. On
// non-macOS `status()` reports everything granted, so these are no-ops there.
function captureBlocked(): string | null {
  const p = status();
  if (p.mac && p.screen !== 'granted') {
    return 'Screen Recording permission is not granted. Open System Settings → Privacy & Security → Screen Recording, enable AceData, then retry.';
  }
  return null;
}
function inputBlocked(): string | null {
  const p = status();
  if (p.mac && !p.accessibility) {
    return 'Accessibility permission is not granted. Open System Settings → Privacy & Security → Accessibility, enable AceData, then retry.';
  }
  return null;
}

// ---- screenshot (real, via desktopCapturer) --------------------------------

export async function screenshot(): Promise<ToolResult> {
  const blocked = captureBlocked();
  if (blocked) return err(blocked);

  const display = eScreen.getPrimaryDisplay();
  const { width, height } = display.size;
  const scaleFactor = display.scaleFactor || 1;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * scaleFactor), height: Math.round(height * scaleFactor) }
  });
  // Pick the source for the PRIMARY display — on multi-monitor setups the array
  // order isn't guaranteed, and the dimensions/coordinate space below are the
  // primary's, so capturing a different screen would mis-map the model's clicks.
  const source = sources.find((s) => s.display_id && s.display_id === String(display.id)) ?? sources[0];
  if (!source || source.thumbnail.isEmpty()) return err('no screen source available (capture returned empty)');

  const png = source.thumbnail.toPNG();
  const dir = path.join(app.getPath('userData'), 'computer-use');
  await fsp.mkdir(dir, { recursive: true });
  const file = path.join(dir, `shot-${Date.now()}.png`);
  await fsp.writeFile(file, png, { mode: 0o600 });
  await pruneShots(dir);

  // The model SEES the screen via `image` (a JPEG data URL resized to LOGICAL
  // resolution): logical-pixel image ⇒ the model's click coordinates map 1:1 to
  // what `computer.click` expects (so quality drops, not dimensions, when we
  // need to shrink). JPEG keeps the base64 small; we step quality down until it
  // fits the worker's data-URL budget. The full-res PNG is still saved to disk
  // for debugging. Only the basename is returned in `output` (no absolute path).
  const resized = source.thumbnail.resize({ width, height });
  let image: string | undefined;
  for (const quality of [80, 60, 45]) {
    const b64 = resized.toJPEG(quality).toString('base64');
    if (b64.length <= MAX_IMAGE_B64_CHARS) {
      image = `data:image/jpeg;base64,${b64}`;
      break;
    }
  }
  return {
    output: JSON.stringify({
      saved: path.basename(file),
      width,
      height,
      scaleFactor,
      bytes: png.length,
      note: image
        ? 'screenshot attached as an image; coordinates are in logical pixels (the click tool expects the same)'
        : 'screenshot captured but too large to attach as an image this turn; coordinates are in logical pixels'
    }),
    ...(image ? { image } : {})
  };
}

// ---- input injection (nut.js, lazy) ----------------------------------------

export async function click(i: { x: number; y: number; button?: 'left' | 'right' | 'middle' }): Promise<ToolResult> {
  const blocked = inputBlocked();
  if (blocked) return err(blocked);
  const nut = loadNut();
  if (!nut) return err(INPUT_BACKEND_HINT);
  try {
    await nut.mouse.setPosition(new nut.Point(i.x, i.y));
    const button = i.button === 'right' ? nut.Button.RIGHT : i.button === 'middle' ? nut.Button.MIDDLE : nut.Button.LEFT;
    await nut.mouse.click(button);
    return { output: `clicked ${i.button ?? 'left'} at (${i.x}, ${i.y})` };
  } catch (e) {
    return err(`click failed: ${(e as Error).message}`);
  }
}

export async function move(i: { x: number; y: number }): Promise<ToolResult> {
  const blocked = inputBlocked();
  if (blocked) return err(blocked);
  const nut = loadNut();
  if (!nut) return err(INPUT_BACKEND_HINT);
  try {
    await nut.mouse.setPosition(new nut.Point(i.x, i.y));
    return { output: `moved to (${i.x}, ${i.y})` };
  } catch (e) {
    return err(`move failed: ${(e as Error).message}`);
  }
}

export async function type_text(i: { text: string }): Promise<ToolResult> {
  const blocked = inputBlocked();
  if (blocked) return err(blocked);
  const nut = loadNut();
  if (!nut) return err(INPUT_BACKEND_HINT);
  try {
    await nut.keyboard.type(i.text);
    return { output: `typed ${i.text.length} characters` };
  } catch (e) {
    return err(`type failed: ${(e as Error).message}`);
  }
}

export async function key_press(i: { keys: string[] }): Promise<ToolResult> {
  const blocked = inputBlocked();
  if (blocked) return err(blocked);
  const nut = loadNut();
  if (!nut) return err(INPUT_BACKEND_HINT);
  const mapped = i.keys.map((k) => nut.Key[normalizeKeyName(k)]);
  if (mapped.some((k) => k === undefined)) return err(`unknown key in [${i.keys.join(', ')}] (use names like cmd, ctrl, shift, enter, a, ArrowLeft)`);
  try {
    for (const k of mapped) await nut.keyboard.pressKey(k);
    for (const k of [...mapped].reverse()) await nut.keyboard.releaseKey(k);
    return { output: `pressed ${i.keys.join('+')}` };
  } catch (e) {
    return err(`key press failed: ${(e as Error).message}`);
  }
}

export async function scroll(i: { x?: number; y?: number; scrollX?: number; scrollY?: number }): Promise<ToolResult> {
  const blocked = inputBlocked();
  if (blocked) return err(blocked);
  const nut = loadNut();
  if (!nut) return err(INPUT_BACKEND_HINT);
  try {
    if (typeof i.x === 'number' && typeof i.y === 'number') await nut.mouse.setPosition(new nut.Point(i.x, i.y));
    const dy = i.scrollY ?? 0;
    const dx = i.scrollX ?? 0;
    if (dy > 0) await nut.mouse.scrollDown(dy);
    else if (dy < 0) await nut.mouse.scrollUp(-dy);
    if (dx > 0) await nut.mouse.scrollRight(dx);
    else if (dx < 0) await nut.mouse.scrollLeft(-dx);
    return { output: `scrolled (dx=${dx}, dy=${dy})` };
  } catch (e) {
    return err(`scroll failed: ${(e as Error).message}`);
  }
}

// Map friendly / OpenAI-style key names to nut.js Key enum member names.
function normalizeKeyName(k: string): string {
  const table: Record<string, string> = {
    cmd: 'LeftCmd',
    command: 'LeftCmd',
    meta: 'LeftCmd',
    super: 'LeftSuper',
    ctrl: 'LeftControl',
    control: 'LeftControl',
    alt: 'LeftAlt',
    option: 'LeftAlt',
    shift: 'LeftShift',
    enter: 'Enter',
    return: 'Enter',
    esc: 'Escape',
    escape: 'Escape',
    tab: 'Tab',
    space: 'Space',
    backspace: 'Backspace',
    delete: 'Delete',
    up: 'Up',
    down: 'Down',
    left: 'Left',
    right: 'Right',
    arrowup: 'Up',
    arrowdown: 'Down',
    arrowleft: 'Left',
    arrowright: 'Right'
  };
  const lower = k.toLowerCase();
  if (table[lower]) return table[lower];
  if (/^[a-z]$/.test(lower)) return lower.toUpperCase(); // single letters: nut.js Key.A..Z
  if (/^[0-9]$/.test(lower)) return `Num${lower}`;
  return k; // pass through (e.g. already-correct nut.js name); undefined-checked by caller
}
