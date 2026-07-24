// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Composer from './Composer.vue';

function mountComposer() {
  return mount(Composer, {
    props: { question: '', references: [], answering: false, ready: true },
    global: {
      mocks: {
        $t: (key: string) => key,
        $router: { push: () => undefined },
        $store: { state: { chat: { model: { name: 'gpt-5.6-sol', capabilities: [] } }, token: { access: 't' } } }
      },
      stubs: {
        'el-upload': true,
        'el-input': true,
        'el-button': true,
        'el-tooltip': true,
        FilePreview: true,
        ImagePreview: true
      }
    }
  });
}

describe('Composer references loop guard', () => {
  // Regression: #1398 dropped the `refs` watcher's length guard, so an empty
  // `references` reset the fileList → recomputed `refs` → re-emitted
  // `update:references([])` → parent reset references → back here forever
  // (107K iterations → OOM on every send). We reproduce the parent back-edge
  // explicitly: feed every emitted value back in as the prop, exactly like
  // `@update:references="references = $event"` in Conversation.vue.
  it('does not ping-pong when references is reset to empty (parent back-edge wired)', async () => {
    const wrapper = mountComposer();
    let emitCount = 0;
    let stop = false;
    // Simulate a fileList that just got cleared on send, then wire the loop.
    (wrapper.vm as unknown as { fileList: unknown[] }).fileList = [{ uid: 1 } as never];
    await wrapper.vm.$nextTick();

    // Re-feed emitted references back as the prop until it settles or blows up.
    for (let i = 0; i < 50 && !stop; i++) {
      const emits = wrapper.emitted('update:references') ?? [];
      if (emits.length === emitCount) {
        stop = true; // settled — no new emit this round
        break;
      }
      emitCount = emits.length;
      const latest = emits[emits.length - 1][0] as unknown[];
      await wrapper.setProps({ references: latest });
      await wrapper.vm.$nextTick();
    }

    expect(stop).toBe(true); // must settle, not run to the 50-round cap
    expect(emitCount).toBeLessThan(5);
    expect((wrapper.vm as unknown as { fileList: unknown[] }).fileList).toHaveLength(0);
  });

  it('clears a non-empty fileList exactly once when references empty', async () => {
    const wrapper = mountComposer();
    (wrapper.vm as unknown as { fileList: unknown[] }).fileList = [
      { uid: 1, status: 'success', response: { file_url: 'u' } } as never
    ];
    await wrapper.setProps({ references: [] });
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as { fileList: unknown[] }).fileList).toHaveLength(0);
  });

  // An in-flight upload puts a file in fileList before it has a response, so
  // `refs` is still [] and the parent momentarily holds references=[]. The
  // guard must NOT clear the pending upload in that window.
  it('does not clear an in-flight upload when references is empty', async () => {
    const wrapper = mountComposer();
    (wrapper.vm as unknown as { fileList: unknown[] }).fileList = [{ uid: 1, status: 'uploading' } as never];
    await wrapper.setProps({ references: [] });
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as { fileList: unknown[] }).fileList).toHaveLength(1);
  });
});
