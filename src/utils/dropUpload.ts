/**
 * Global drag-and-drop-to-upload helper.
 *
 * Mirrors `pasteUpload.ts`. Each `<el-upload>` wrapper registers a drop target
 * via `registerDropUploadTarget`, handing over the element that should light up
 * as a drop zone (typically the uploader's own root). Document-level drag
 * listeners then:
 *   1. Detect when a *file* drag enters the window and flip a global
 *      `isDraggingFiles` flag (so hosts can reveal an otherwise-hidden drop
 *      overlay only while a drag is in progress).
 *   2. Track which registered target the cursor is currently over, exposing it
 *      via `activeDropTargetId` so only that one target highlights.
 *   3. On drop, route the files to the target under the cursor and forward the
 *      accepted ones to its `handleFile`.
 *
 * Design notes vs. the per-component mixin this replaces:
 *   - Listeners live on `document`, not each component's `$el`, so a target
 *     whose root is behind a `v-if` at mount time still works — it registers
 *     from `mounted`/`updated` once its element exists, and the reactive refs
 *     keep the UI in sync without re-binding DOM listeners.
 *   - A single source of truth (`isDraggingFiles`) drives the "reveal on drag"
 *     behavior across every uploader at once.
 */

import { ref } from 'vue';
import { matchesAccept, renameForDedup } from '@/utils/uploadShared';

export interface IDropUploadTarget {
  /** Stable id used for dedup / targeting / highlight. */
  id: symbol;
  /**
   * Resolver for the accept hint (e.g. `.png,.jpg,.jpeg`). Called at drop time
   * — NOT snapshot — so a reactive `accept` (e.g. the chat composer's, which
   * changes with the selected model) is always honored.
   */
  getAccept?: () => string | undefined;
  /** Called with each raw `File` extracted from the drop. */
  handleFile: (file: File) => void;
  /** The element that is the drop zone (also used for hit-testing). */
  getEl: () => HTMLElement | null;
  /** When true the target ignores drags (e.g. host disabled). */
  isDisabled?: () => boolean;
}

/** True while a file (not text/link) is being dragged anywhere over the window. */
export const isDraggingFiles = ref(false);
/** The id of the registered target currently under the cursor, if any. */
export const activeDropTargetId = ref<symbol | null>(null);

const targets: IDropUploadTarget[] = [];
let windowDragDepth = 0;
let listenersInstalled = false;

/** A drag payload that actually carries files. */
const dragHasFiles = (event: DragEvent): boolean => {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes('Files');
};

/** Topmost registered target whose element contains `node`. */
const targetAtNode = (node: EventTarget | null): IDropUploadTarget | null => {
  if (!(node instanceof Node)) return null;
  // Iterate newest-first so a nested/later uploader wins over an outer one.
  for (let i = targets.length - 1; i >= 0; i -= 1) {
    const t = targets[i];
    if (t.isDisabled?.()) continue;
    const el = t.getEl();
    if (el && el.contains(node)) return t;
  }
  return null;
};

const resetDragState = () => {
  windowDragDepth = 0;
  isDraggingFiles.value = false;
  activeDropTargetId.value = null;
};

const onWindowDragEnter = (event: DragEvent) => {
  if (!dragHasFiles(event)) return;
  windowDragDepth += 1;
  isDraggingFiles.value = true;
};

const onWindowDragOver = (event: DragEvent) => {
  if (!isDraggingFiles.value) return;
  const target = targetAtNode(event.target);
  if (target) {
    // Allow the drop and show a copy cursor over a real target.
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    activeDropTargetId.value = target.id;
  } else {
    activeDropTargetId.value = null;
  }
};

const onWindowDragLeave = (event: DragEvent) => {
  if (!dragHasFiles(event)) return;
  // dragenter/leave bubble per element; only clear when the cursor truly
  // leaves the window (depth hits 0, or relatedTarget is null = left window).
  windowDragDepth = Math.max(0, windowDragDepth - 1);
  if (windowDragDepth === 0 || !event.relatedTarget) {
    windowDragDepth = 0;
    isDraggingFiles.value = false;
    activeDropTargetId.value = null;
  }
};

const onWindowDrop = (event: DragEvent) => {
  const wasDraggingFiles = isDraggingFiles.value || dragHasFiles(event);
  const target = targetAtNode(event.target);
  // Always end the drag visual, regardless of where it landed.
  resetDragState();
  if (!wasDraggingFiles || !target) return;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;
  event.preventDefault();
  event.stopPropagation();

  const accepted = Array.from(files).filter((f) => matchesAccept(f, target.getAccept?.()));
  if (!accepted.length) return;
  accepted.forEach((file) => target.handleFile(renameForDedup(file)));
};

const ensureListeners = () => {
  if (listenersInstalled) return;
  if (typeof document === 'undefined') return;
  document.addEventListener('dragenter', onWindowDragEnter, true);
  document.addEventListener('dragover', onWindowDragOver, true);
  document.addEventListener('dragleave', onWindowDragLeave, true);
  document.addEventListener('drop', onWindowDrop, true);
  // If a drag ends outside the window (Esc, dropped elsewhere) clean up.
  window.addEventListener('dragend', resetDragState, true);
  window.addEventListener('blur', resetDragState);
  listenersInstalled = true;
};

export const registerDropUploadTarget = (target: IDropUploadTarget): (() => void) => {
  ensureListeners();
  targets.push(target);
  return () => {
    const idx = targets.findIndex((t) => t.id === target.id);
    if (idx >= 0) targets.splice(idx, 1);
    if (activeDropTargetId.value === target.id) activeDropTargetId.value = null;
  };
};
