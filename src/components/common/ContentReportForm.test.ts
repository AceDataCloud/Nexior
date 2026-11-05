// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ElInput, ElRadioGroup } from 'element-plus';
import ContentReportForm from './ContentReportForm.vue';

const create = vi.hoisted(() => vi.fn());
vi.mock('@/operators', () => ({ contentReportOperator: { create } }));

function render(authenticated = true, requestTarget = true) {
  const dispatch = vi.fn();
  const wrapper = mount(ContentReportForm, {
    props: {
      service: 'chat',
      requestTarget,
      targetId: requestTarget ? '' : 'message-123',
      snapshot: { page_path: '/chat' }
    },
    global: {
      mocks: {
        $t: (key: string) => key,
        $route: { fullPath: '/chat' },
        $store: { getters: { authenticated }, dispatch }
      }
    }
  });
  return { wrapper, dispatch };
}

describe('content report submission', () => {
  beforeEach(() => {
    create.mockReset();
  });

  it('requires an identifiable target from the floating entry and returns the persisted report ID', async () => {
    create.mockResolvedValue({ data: { id: 'report-123' } });
    const { wrapper } = render();
    await wrapper.findComponent(ElRadioGroup).setValue('illegal');
    await wrapper.findAll('button').at(-1)!.trigger('click');
    expect(create).not.toHaveBeenCalled();
    await wrapper.findComponent(ElInput).setValue('task-456');
    await wrapper.findAll('button').at(-1)!.trigger('click');
    await flushPromises();
    expect(create).toHaveBeenCalledWith({
      service: 'chat',
      target_id: 'task-456',
      reason: 'illegal',
      detail: '',
      snapshot: { page_path: '/chat' }
    });
    expect(wrapper.emitted('submitted')).toEqual([['report-123']]);
    wrapper.unmount();
  });

  it('keeps content-bound reports on their existing target and prevents duplicate submissions', async () => {
    let finish!: (value: unknown) => void;
    create.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { wrapper } = render(true, false);
    await wrapper.findComponent(ElRadioGroup).setValue('other');
    await wrapper.findAll('button').at(-1)!.trigger('click');
    await wrapper.findAll('button').at(-1)!.trigger('click');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].target_id).toBe('message-123');
    finish({ data: { id: 'saved-report' } });
    await flushPromises();
    wrapper.unmount();
  });

  it('requires login before sending, including after a session expires', async () => {
    const { wrapper, dispatch } = render(false);
    await wrapper.findAll('button').at(-1)!.trigger('click');
    expect(create).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith('login', { redirect: '/chat' });
    wrapper.unmount();
  });
});
