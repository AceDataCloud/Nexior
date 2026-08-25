// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { ElUpload } from 'element-plus';

const auth = vi.hoisted(() => ({ allowed: true, ensure: vi.fn(() => auth.allowed) }));

vi.mock('@/utils/login', () => ({ ensureLoggedIn: auth.ensure }));

import { pasteUploadMixin } from './pasteUploadMixin';

const Host = defineComponent({
  name: 'PasteHost',
  components: { ElUpload },
  mixins: [pasteUploadMixin],
  template: `<div><el-upload ref="uploader" accept=".png" :auto-upload="false" action="#"><button>u</button></el-upload></div>`
});

const pasteFile = (target: HTMLElement) => {
  const file = new File([new Uint8Array([1])], 'pic.png', { type: 'image/png' });
  const event = new Event('paste', { bubbles: true, cancelable: true }) as any;
  event.clipboardData = { items: [{ kind: 'file', getAsFile: () => file }] };
  Object.defineProperty(event, 'target', { value: target });
  document.dispatchEvent(event);
};

afterEach(() => {
  auth.allowed = true;
  auth.ensure.mockClear();
  document.body.innerHTML = '';
});

describe('pasteUploadMixin', () => {
  it('forwards a pasted file while authenticated', async () => {
    const wrapper = mount(Host, { attachTo: document.body });
    await nextTick();
    const spy = vi.spyOn((wrapper.vm as any).$refs.uploader, 'handleStart');

    pasteFile(wrapper.element as HTMLElement);
    await nextTick();

    expect(auth.ensure).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('starts login instead of forwarding a pasted file when signed out', async () => {
    auth.allowed = false;
    const wrapper = mount(Host, { attachTo: document.body });
    await nextTick();
    const spy = vi.spyOn((wrapper.vm as any).$refs.uploader, 'handleStart');

    pasteFile(wrapper.element as HTMLElement);
    await nextTick();

    expect(auth.ensure).toHaveBeenCalledOnce();
    expect(spy).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
