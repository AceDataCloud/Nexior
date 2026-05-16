/**
 * Two mixins + a helper for tracking in-flight `<el-upload>` uploads so that
 * a Generate page can refuse to fire while reference images are still being
 * uploaded.
 *
 * Architecture
 * ------------
 * - A Generate page mixes in `uploadTrackerProviderMixin`, which installs a
 *   reactive `uploadTracker = { count: 0 }` on the instance and `provide`s it
 *   to all descendants.
 * - Every `<el-upload>` wrapper mixes in `uploadTrackerMixin`, which `inject`s
 *   that tracker and watches its `fileList` data field. Files whose `status`
 *   is `ready` or `uploading` are counted as in-flight; the mixin increments
 *   or decrements `tracker.count` accordingly. If no provider exists higher
 *   in the tree, the mixin is a silent no-op, so it is safe to install on
 *   every uploader unconditionally.
 * - The Generate handler calls `ensureNoPendingUpload(this.uploadTracker, …)`
 *   at the top of its action; it returns `false` and pops a localized toast
 *   when any uploader still has files in flight.
 */

import type { ComponentPublicInstance } from 'vue';

export interface IUploadTracker {
  count: number;
}

interface IUploadFileLike {
  uid?: string | number;
  status?: string;
}

interface ITrackerMixinThis extends ComponentPublicInstance {
  uploadTracker: IUploadTracker | null;
  fileList?: IUploadFileLike[];
  __pendingUploadUids?: Set<string>;
}

interface IProviderMixinThis extends ComponentPublicInstance {
  uploadTracker: IUploadTracker;
}

const isPending = (file: IUploadFileLike | undefined | null): boolean => {
  const status = file?.status;
  return status === 'ready' || status === 'uploading';
};

const uidKey = (file: IUploadFileLike): string => {
  return String(file?.uid ?? JSON.stringify(file));
};

/**
 * Install on every `<el-upload>` wrapper. The host must expose a reactive
 * `fileList` field that mirrors `el-upload`'s `v-model:file-list`.
 */
export const uploadTrackerMixin = {
  inject: {
    uploadTracker: { default: null as IUploadTracker | null }
  },
  watch: {
    fileList: {
      deep: true,
      immediate: true,
      handler(this: ITrackerMixinThis, newList: IUploadFileLike[] | undefined) {
        const tracker = this.uploadTracker;
        if (!tracker) return;
        const prev = this.__pendingUploadUids ?? new Set<string>();
        const next = new Set<string>();
        for (const file of newList || []) {
          if (isPending(file)) next.add(uidKey(file));
        }
        let delta = 0;
        for (const uid of next) if (!prev.has(uid)) delta += 1;
        for (const uid of prev) if (!next.has(uid)) delta -= 1;
        if (delta !== 0) {
          const nextCount = tracker.count + delta;
          tracker.count = nextCount > 0 ? nextCount : 0;
        }
        this.__pendingUploadUids = next;
      }
    }
  },
  beforeUnmount(this: ITrackerMixinThis) {
    const tracker = this.uploadTracker;
    const prev = this.__pendingUploadUids;
    if (tracker && prev && prev.size > 0) {
      const nextCount = tracker.count - prev.size;
      tracker.count = nextCount > 0 ? nextCount : 0;
    }
    this.__pendingUploadUids = undefined;
  }
};

/**
 * Install on a Generate page (or any owner of a generation action) to expose
 * a `uploadTracker` instance to descendant uploaders. Exposes `this.uploadTracker`.
 */
export const uploadTrackerProviderMixin = {
  data(): { uploadTracker: IUploadTracker } {
    return { uploadTracker: { count: 0 } };
  },
  provide(this: IProviderMixinThis) {
    return { uploadTracker: this.uploadTracker };
  }
};

/**
 * Guard helper for Generate actions. Returns `true` when no uploader has any
 * file still in flight; otherwise calls `notify` with the localized warning
 * text and returns `false` so the caller can early-return.
 */
export function ensureNoPendingUpload(
  tracker: IUploadTracker | null | undefined,
  t: (key: string) => string,
  notify: (msg: string) => void
): boolean {
  if (tracker && tracker.count > 0) {
    notify(t('common.message.uploadInProgress'));
    return false;
  }
  return true;
}

export default uploadTrackerMixin;
