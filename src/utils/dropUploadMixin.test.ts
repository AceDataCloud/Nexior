// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { ElUpload } from 'element-plus';
import { dropUploadMixin } from './dropUploadMixin';
import { activeDropTargetId, isDraggingFiles } from './dropUpload';

const makeFile = (name = 'pic.png') => new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });

// A minimal host that mirrors how the real config components wire the mixin:
// an <el-upload ref="uploader"> with a picture accept.
const Host = defineComponent({
  name: 'DropHost',
  components: { ElUpload },
  mixins: [dropUploadMixin],
  template: `
    <div>
      <el-upload
        ref="uploader"
        accept=".png,.jpg,.jpeg"
        :auto-upload="false"
        :show-file-list="false"
        action="#"
      >
        <button>upload</button>
      </el-upload>
    </div>
  `
});

afterEach(() => {
  isDraggingFiles.value = false;
  activeDropTargetId.value = null;
  document.body.innerHTML = '';
});

describe('dropUploadMixin (mounted)', () => {
  it('reveals the overlay only while this target is the active drag target', async () => {
    const wrapper = mount(Host, { attachTo: document.body });
    await nextTick();

    const rootEl = wrapper.element as HTMLElement;
    expect(rootEl.querySelector('.drop-upload-overlay--visible')).toBeNull();

    // Simulate the global router marking THIS component active.
    const id = (wrapper.vm as any).__dropId as symbol;
    isDraggingFiles.value = true;
    activeDropTargetId.value = id;
    await nextTick();

    const overlay = rootEl.querySelector('.drop-upload-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay!.classList.contains('drop-upload-overlay--visible')).toBe(true);

    // Dragging ends → overlay hides.
    isDraggingFiles.value = false;
    activeDropTargetId.value = null;
    await nextTick();
    expect(rootEl.querySelector('.drop-upload-overlay--visible')).toBeNull();

    wrapper.unmount();
  });

  it('forwards a dropped file into the el-upload pipeline via handleStart', async () => {
    const wrapper = mount(Host, { attachTo: document.body });
    await nextTick();

    const uploader: any = (wrapper.vm as any).$refs.uploader;
    const spy = vi.spyOn(uploader, 'handleStart');

    // Drive the target's handleFile the way the router does on drop.
    (wrapper.vm as any).$refs.uploader; // ensure ref resolved
    const off = (wrapper.vm as any).__dropCleanup;
    expect(typeof off).toBe('function');

    // Reach into the registered target by dispatching a real drop on the root.
    const rootEl = wrapper.element as HTMLElement;
    const dt: any = {
      types: ['Files'],
      files: [makeFile()],
      items: [{ kind: 'file', getAsFile: () => makeFile() }]
    };
    const ev = new Event('drop', { bubbles: true, cancelable: true }) as any;
    ev.dataTransfer = dt;
    Object.defineProperty(ev, 'target', { value: rootEl });
    document.dispatchEvent(ev);
    await nextTick();

    expect(spy).toHaveBeenCalledTimes(1);
    const passed = spy.mock.calls[0][0] as File;
    expect(passed.name.endsWith('.png')).toBe(true);

    wrapper.unmount();
  });

  it('does not register a drop target when the root is v-if false at mount', async () => {
    const Gated = defineComponent({
      name: 'GatedHost',
      components: { ElUpload },
      mixins: [dropUploadMixin],
      data: () => ({ shown: false }),
      template: `
        <div v-if="shown">
          <el-upload ref="uploader" accept=".png" :auto-upload="false" action="#"><button>u</button></el-upload>
        </div>
      `
    });
    const wrapper = mount(Gated, { attachTo: document.body });
    await nextTick();
    // Root is a comment placeholder → no registration yet.
    expect((wrapper.vm as any).__dropCleanup).toBeUndefined();

    // Reveal it → updated() hook should now register.
    (wrapper.vm as any).shown = true;
    await nextTick();
    await nextTick();
    expect(typeof (wrapper.vm as any).__dropCleanup).toBe('function');

    wrapper.unmount();
  });
});
