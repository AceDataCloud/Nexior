/**
 * Global paste-to-upload helper.
 *
 * Each `<el-upload>` component that wants to support pasting an image from the
 * clipboard registers itself via `registerPasteUploadTarget`. A single
 * document-level `paste` listener then routes pasted images/files to the
 * "active" target, where active is determined by:
 *   1. The target the user most recently hovered/focused, or
 *   2. The most recently registered target, if no hover info is available.
 *
 * Targets are responsible for accepting a `File` and pushing it into their own
 * upload queue (typically via the `el-upload` instance's `handleStart` API).
 */

import { ElMessage } from 'element-plus';

export interface IPasteUploadTarget {
  /** Stable id used for dedup / targeting. */
  id: symbol;
  /** Accept hint such as `.png,.jpg,.jpeg,.gif,.bmp,.webp` (optional). */
  accept?: string;
  /** Called with the raw `File` extracted from the clipboard. */
  handleFile: (file: File) => void;
  /** DOM element used to detect hover for target selection. */
  el?: HTMLElement | null;
}

const targets: IPasteUploadTarget[] = [];
let hoveredTargetId: symbol | null = null;
let listenerInstalled = false;

const matchesAccept = (file: File, accept?: string): boolean => {
  if (!accept) return true;
  const rules = accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return name.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1));
    }
    return type === rule;
  });
};

const pickTarget = (): IPasteUploadTarget | null => {
  if (!targets.length) return null;
  if (hoveredTargetId) {
    const t = targets.find((x) => x.id === hoveredTargetId);
    if (t) return t;
  }
  // Fallback: most recently registered, still mounted.
  return targets[targets.length - 1];
};

const onDocumentPaste = (event: ClipboardEvent) => {
  if (!targets.length) return;

  // Don't hijack paste while user is typing in a text field.
  const active = document.activeElement as HTMLElement | null;
  if (active) {
    const tag = active.tagName;
    const isEditable = active.isContentEditable;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) {
      // Only proceed if the clipboard actually contains a file (image), not
      // just text — text paste into inputs should behave normally.
      const items = event.clipboardData?.items;
      const hasFile = items ? Array.from(items).some((i) => i.kind === 'file') : false;
      if (!hasFile) return;
    }
  }

  const items = event.clipboardData?.items;
  if (!items || items.length === 0) return;

  const files: File[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) files.push(f);
    }
  }
  if (!files.length) return;

  const target = pickTarget();
  if (!target) return;

  const accepted = files.filter((f) => matchesAccept(f, target.accept));
  if (!accepted.length) return;

  event.preventDefault();
  accepted.forEach((file) => {
    // Clipboard images are usually named `image.png` with the same name for
    // every paste, which trips Element Plus dedup logic. Give each one a
    // unique suffix while preserving the extension.
    let named: File = file;
    try {
      const dot = file.name.lastIndexOf('.');
      const base = dot > 0 ? file.name.slice(0, dot) : file.name || 'pasted';
      const ext = dot > 0 ? file.name.slice(dot) : '';
      const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      named = new File([file], `${base}-${stamp}${ext || '.png'}`, {
        type: file.type || 'image/png',
        lastModified: Date.now()
      });
    } catch (_e) {
      // Some older browsers don't allow constructing File; fall back to raw.
      named = file;
    }
    target.handleFile(named);
  });
};

const ensureListener = () => {
  if (listenerInstalled) return;
  if (typeof document === 'undefined') return;
  document.addEventListener('paste', onDocumentPaste, true);
  listenerInstalled = true;
};

export const registerPasteUploadTarget = (target: IPasteUploadTarget): (() => void) => {
  ensureListener();
  targets.push(target);

  const onEnter = () => {
    hoveredTargetId = target.id;
  };
  if (target.el) {
    target.el.addEventListener('mouseenter', onEnter);
    target.el.addEventListener('focusin', onEnter);
  }

  return () => {
    const idx = targets.findIndex((t) => t.id === target.id);
    if (idx >= 0) targets.splice(idx, 1);
    if (hoveredTargetId === target.id) hoveredTargetId = null;
    if (target.el) {
      target.el.removeEventListener('mouseenter', onEnter);
      target.el.removeEventListener('focusin', onEnter);
    }
  };
};

/** Reusable `ElMessage`-based notification when a paste was accepted. */
export const notifyPasteAccepted = (label?: string) => {
  ElMessage.success(label || 'Pasted image uploaded');
};
