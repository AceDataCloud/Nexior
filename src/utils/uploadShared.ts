/**
 * Shared helpers for the clipboard-paste and drag-and-drop upload mixins.
 *
 * Both mixins accept a raw `File`, need to check it against an `accept` hint,
 * and forward it into an `<el-upload>` instance's own upload queue. Keeping that
 * logic here means paste and drop stay in lock-step.
 */

/** Match a `File` against an `<el-upload>`-style accept hint (`.png,image/*`). */
export const matchesAccept = (file: File, accept?: string): boolean => {
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

/**
 * Give a file a unique name while preserving its extension. Clipboard images
 * are all named `image.png`, and re-dropping the same file keeps its name —
 * both trip Element Plus' name-based dedup. A stamped copy sidesteps that.
 */
export const renameForDedup = (file: File): File => {
  try {
    const dot = file.name.lastIndexOf('.');
    const base = dot > 0 ? file.name.slice(0, dot) : file.name || 'upload';
    const ext = dot > 0 ? file.name.slice(dot) : '';
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return new File([file], `${base}-${stamp}${ext || '.png'}`, {
      type: file.type || 'image/png',
      lastModified: Date.now()
    });
  } catch (_e) {
    // Some older browsers don't allow constructing File; fall back to raw.
    return file;
  }
};

/**
 * Push a `File` into an `<el-upload>` instance's queue. Handles the auto-upload
 * and `auto-upload=false` cases across Element Plus versions.
 */
export const forwardFileToUploader = (uploader: any, file: File): void => {
  if (!uploader) return;
  if (typeof uploader.handleStart === 'function') {
    uploader.handleStart(file);
    if (typeof uploader.submit === 'function') {
      try {
        uploader.submit();
      } catch (_e) {
        /* ignore */
      }
    }
  } else if (typeof uploader.handleAdd === 'function') {
    uploader.handleAdd(file);
  }
};
