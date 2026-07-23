// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { activeDropTargetId, isDraggingFiles, registerDropUploadTarget } from './dropUpload';

const makeFile = (name: string, type = 'image/png'): File => new File([new Uint8Array([1, 2, 3])], name, { type });

/** Build a DragEvent with a working dataTransfer (jsdom lacks DataTransfer). */
const dragEvent = (type: string, opts: { files?: File[]; target?: Node; relatedTarget?: Node | null } = {}) => {
  const files = opts.files ?? [];
  const dt: any = {
    types: files.length ? ['Files'] : [],
    files,
    items: files.map((f) => ({ kind: 'file', getAsFile: () => f })),
    dropEffect: 'none'
  };
  const ev = new Event(type, { bubbles: true, cancelable: true }) as any;
  ev.dataTransfer = dt;
  if (opts.target) Object.defineProperty(ev, 'target', { value: opts.target });
  if ('relatedTarget' in opts) ev.relatedTarget = opts.relatedTarget;
  return ev as DragEvent;
};

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  // Reset shared state between tests.
  isDraggingFiles.value = false;
  activeDropTargetId.value = null;
  document.body.innerHTML = '';
});

describe('dropUpload global router', () => {
  it('flips isDraggingFiles only for file drags', () => {
    // Listeners install lazily on first registration (matches real usage: the
    // flag only matters when at least one uploader is mounted).
    const el = document.createElement('div');
    document.body.appendChild(el);
    cleanups.push(registerDropUploadTarget({ id: Symbol('t'), getEl: () => el, handleFile: () => {} }));

    document.dispatchEvent(dragEvent('dragenter', { files: [makeFile('a.png')] }));
    expect(isDraggingFiles.value).toBe(true);

    // A non-file drag (text) should not trigger it.
    isDraggingFiles.value = false;
    document.dispatchEvent(dragEvent('dragenter', {}));
    expect(isDraggingFiles.value).toBe(false);
  });

  it('marks the hovered target active on dragover and routes the drop to it', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const inner = document.createElement('span');
    el.appendChild(inner);

    const received: File[] = [];
    const id = Symbol('t');
    cleanups.push(
      registerDropUploadTarget({
        id,
        getAccept: () => '.png',
        getEl: () => el,
        handleFile: (f) => received.push(f)
      })
    );

    document.dispatchEvent(dragEvent('dragenter', { files: [makeFile('a.png')] }));
    document.dispatchEvent(dragEvent('dragover', { files: [makeFile('a.png')], target: inner }));
    expect(activeDropTargetId.value).toBe(id);

    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.png')], target: inner }));
    expect(received).toHaveLength(1);
    expect(received[0].name.endsWith('.png')).toBe(true);
    // Drag state resets after drop.
    expect(isDraggingFiles.value).toBe(false);
    expect(activeDropTargetId.value).toBe(null);
  });

  it('filters dropped files by the target accept hint', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const received: File[] = [];
    cleanups.push(
      registerDropUploadTarget({
        id: Symbol('img'),
        getAccept: () => '.png,.jpg',
        getEl: () => el,
        handleFile: (f) => received.push(f)
      })
    );

    document.dispatchEvent(
      dragEvent('drop', { files: [makeFile('song.mp3', 'audio/mpeg'), makeFile('pic.png')], target: el })
    );
    expect(received).toHaveLength(1);
    expect(received[0].name.endsWith('.png')).toBe(true);
  });

  it('does not route to a disabled target', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const received: File[] = [];
    cleanups.push(
      registerDropUploadTarget({
        id: Symbol('disabled'),
        getAccept: () => '.png',
        getEl: () => el,
        isDisabled: () => true,
        handleFile: (f) => received.push(f)
      })
    );
    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.png')], target: el }));
    expect(received).toHaveLength(0);
  });

  it('routes to the innermost of two nested targets', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const outerHits: File[] = [];
    const innerHits: File[] = [];
    cleanups.push(
      registerDropUploadTarget({ id: Symbol('outer'), getEl: () => outer, handleFile: (f) => outerHits.push(f) })
    );
    cleanups.push(
      registerDropUploadTarget({ id: Symbol('inner'), getEl: () => inner, handleFile: (f) => innerHits.push(f) })
    );
    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.png')], target: inner }));
    expect(innerHits).toHaveLength(1);
    expect(outerHits).toHaveLength(0);
  });

  it('resolves getAccept live at drop time (reactive accept)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const received: File[] = [];
    let accept: string | undefined = '.png';
    cleanups.push(
      registerDropUploadTarget({
        id: Symbol('reactive'),
        getAccept: () => accept,
        getEl: () => el,
        handleFile: (f) => received.push(f)
      })
    );

    // mp3 rejected while accept is images-only.
    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.mp3', 'audio/mpeg')], target: el }));
    expect(received).toHaveLength(0);

    // accept widens (e.g. chat model now supports files) → same target accepts it.
    accept = undefined;
    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.mp3', 'audio/mpeg')], target: el }));
    expect(received).toHaveLength(1);
  });

  it('unregister removes the target', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const received: File[] = [];
    const off = registerDropUploadTarget({
      id: Symbol('gone'),
      getEl: () => el,
      handleFile: (f) => received.push(f)
    });
    off();
    document.dispatchEvent(dragEvent('drop', { files: [makeFile('a.png')], target: el }));
    expect(received).toHaveLength(0);
  });
});
