/**
 * Mixin that adds drag-and-drop upload to an `<el-upload>`-based component.
 *
 * Usage:
 *   1. Add `ref="uploader"` to the `<el-upload>` element.
 *   2. Add `mixins: [dropUploadMixin]` to the component options.
 *   3. (Optional) override `dropAccept` / `dropDisabled`.
 *
 * Behavior:
 *   - Registers the component's root `$el` as a drop target with the global
 *     drag router (`dropUpload.ts`). Because the router lives on `document`,
 *     this works even when the root was behind a `v-if` at first mount — the
 *     mixin (re)registers whenever its element appears.
 *   - A drop overlay ("拖到此处上传") is created lazily and shown ONLY while a
 *     file is being dragged over THIS uploader — hidden the rest of the time,
 *     so there is no permanent drop area cluttering the UI.
 *   - Dropped files are forwarded through the real `<el-upload>` pipeline via
 *     `handleStart` + `submit`, identical to the file picker.
 */

import type { ComponentPublicInstance } from 'vue';
import { watch, type WatchStopHandle } from 'vue';
import { forwardFileToUploader, renameForDedup } from '@/utils/uploadShared';
import { activeDropTargetId, isDraggingFiles, registerDropUploadTarget } from '@/utils/dropUpload';
import i18n from '@/i18n';

interface IDropMixinThis extends ComponentPublicInstance {
  dropAccept?: string;
  dropDisabled?: boolean;
  $refs: { uploader?: any } & ComponentPublicInstance['$refs'];
  __dropId?: symbol;
  __dropCleanup?: () => void;
  __dropStopWatch?: WatchStopHandle;
  __dropOverlay?: HTMLElement | null;
  __dropRegisteredEl?: HTMLElement | null;
  __syncDropRegistration: () => void;
  __toggleOverlay: (active: boolean) => void;
}

const OVERLAY_CLASS = 'drop-upload-overlay';

const resolveAcceptFromEl = (el: HTMLElement, override?: string): string | undefined => {
  if (override) return override;
  const input = el.querySelector('input[type="file"]') as HTMLInputElement | null;
  return input?.accept || undefined;
};

const dropLabel = (): string => {
  try {
    return i18n.global.t('common.message.dropToUpload');
  } catch (_e) {
    return 'Drop to upload';
  }
};

const buildOverlay = (): HTMLElement => {
  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS;
  overlay.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = `${OVERLAY_CLASS}__label`;
  overlay.appendChild(label);
  return overlay;
};

export const dropUploadMixin = {
  computed: {
    dropAccept(): string | undefined {
      // Undefined → the mixin reads the uploader's own <input accept>.
      return undefined;
    },
    dropDisabled(): boolean {
      return false;
    }
  },
  mounted(this: IDropMixinThis) {
    this.__dropId = Symbol('drop-upload-target');
    this.__syncDropRegistration();
    // Re-check registration after each render: the root may switch between a
    // comment placeholder (v-if false) and a real element.
    this.$nextTick(() => this.__syncDropRegistration());
  },
  updated(this: IDropMixinThis) {
    this.__syncDropRegistration();
  },
  beforeUnmount(this: IDropMixinThis) {
    if (this.__dropStopWatch) this.__dropStopWatch();
    if (this.__dropCleanup) this.__dropCleanup();
    if (this.__dropOverlay?.parentElement) {
      this.__dropOverlay.parentElement.removeChild(this.__dropOverlay);
    }
    this.__dropOverlay = null;
    this.__dropRegisteredEl = null;
    this.__dropStopWatch = undefined;
    this.__dropCleanup = undefined;
  },
  methods: {
    __syncDropRegistration(this: IDropMixinThis) {
      const el = (this.$el instanceof HTMLElement ? this.$el : null) as HTMLElement | null;
      // Root not a real element yet (v-if false) → nothing to register.
      if (!el) return;
      // Already registered against this exact element → nothing to do.
      if (this.__dropRegisteredEl === el && this.__dropCleanup) return;

      // Root element changed: tear down the old registration/overlay first.
      if (this.__dropCleanup) this.__dropCleanup();
      if (this.__dropOverlay?.parentElement) {
        this.__dropOverlay.parentElement.removeChild(this.__dropOverlay);
      }
      this.__dropOverlay = null;

      // The overlay is positioned absolutely against the root; make sure the
      // root is a positioning context (only touch `static` roots).
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      this.__dropRegisteredEl = el;
      this.__dropCleanup = registerDropUploadTarget({
        id: this.__dropId as symbol,
        // Resolved live at drop time (NOT snapshot) from the uploader's own
        // <input accept> or the `dropAccept` override, so a reactive accept
        // (e.g. the chat composer's, which changes with the model) is honored.
        getAccept: () => {
          const cur = this.$el instanceof HTMLElement ? this.$el : el;
          return resolveAcceptFromEl(cur, this.dropAccept);
        },
        isDisabled: () => Boolean(this.dropDisabled),
        getEl: () => (this.$el instanceof HTMLElement ? this.$el : null),
        handleFile: (file: File) => {
          if (this.dropDisabled) return;
          forwardFileToUploader(this.$refs?.uploader, renameForDedup(file));
        }
      });

      // Set up the reveal-on-drag overlay watcher (once).
      if (!this.__dropStopWatch) {
        this.__dropStopWatch = watch(
          () => isDraggingFiles.value && activeDropTargetId.value === this.__dropId && !this.dropDisabled,
          (active) => this.__toggleOverlay(active),
          { immediate: false }
        );
      }
    },
    __toggleOverlay(this: IDropMixinThis, active: boolean) {
      const el = this.__dropRegisteredEl;
      if (!el) return;
      if (active) {
        if (!this.__dropOverlay) this.__dropOverlay = buildOverlay();
        // Refresh the label each time so a locale change is reflected.
        const label = this.__dropOverlay.querySelector(`.${OVERLAY_CLASS}__label`);
        if (label) label.textContent = dropLabel();
        if (!this.__dropOverlay.parentElement) el.appendChild(this.__dropOverlay);
        // Force reflow so the CSS transition plays.
        void this.__dropOverlay.offsetWidth;
        this.__dropOverlay.classList.add(`${OVERLAY_CLASS}--visible`);
      } else if (this.__dropOverlay) {
        this.__dropOverlay.classList.remove(`${OVERLAY_CLASS}--visible`);
      }
    }
  }
};

export default dropUploadMixin;
