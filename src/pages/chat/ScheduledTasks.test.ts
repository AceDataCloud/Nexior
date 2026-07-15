// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { CHAT_MODEL_NAME_GPT_5_4_MINI } from '@/constants';
import type { IScheduledTask } from '@/operators/scheduledTasks';
import ScheduledTasks from './ScheduledTasks.vue';

const editedTask: IScheduledTask = {
  id: 'task-1',
  name: 'Existing task',
  state: 'enabled',
  schedule: { type: 'interval', interval_seconds: 21600, tz: 'Asia/Shanghai' },
  template: {
    model: 'gpt-5.5',
    question: 'Reuse the existing task prompt',
    skills: ['hashnode'],
    mcp_servers: ['publishing'],
    max_turns: 12
  },
  unattended_policy: {
    mode: 'allow_selected',
    allowed_skills: ['hashnode'],
    allowed_mcp_servers: ['publishing']
  },
  run_count: 1,
  created_at: 1,
  updated_at: 1
};

const errorMessages: Record<string, string> = {
  'chat.scheduledTasks.run.reason.internal_error': 'Internal error',
  'chat.scheduledTasks.run.reason.billing_gate_failed': 'Billing authorization failed'
};

const mountComponent = () =>
  shallowMount(ScheduledTasks, {
    global: {
      stubs: {
        ElCard: { template: '<div><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => errorMessages[key] ?? key,
        $te: (key: string) => key in errorMessages,
        $store: {
          state: {
            chat: { credential: null },
            site: { features: {} }
          }
        }
      }
    }
  });

describe('chat/ScheduledTasks', () => {
  it.each([
    ['internal_error', 'Internal error'],
    ['billing_gate_failed', 'Billing authorization failed']
  ])('localizes the latest task error code %s', async (errorCode, expected) => {
    const wrapper = mountComponent();

    await wrapper.setData({ tasks: [{ ...editedTask, last_error: errorCode }] });

    expect(wrapper.find('.error-hint').text()).toBe(expected);
    expect(wrapper.text()).not.toContain(errorCode);
  });

  it('opens a fresh form when New is clicked after editing a task', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openCreate: () => void;
      closeTaskDialog: () => void;
      openEdit: (task: IScheduledTask) => void;
      editingTask: IScheduledTask | null;
      form: Record<string, unknown>;
      showCreateDialog: boolean;
    };

    vm.openEdit(editedTask);
    expect(vm.form).toMatchObject({
      name: 'Existing task',
      question: 'Reuse the existing task prompt',
      model: 'gpt-5.5',
      authorizedSkills: ['hashnode'],
      authorizedMcpServers: ['publishing']
    });

    await wrapper.find('.header el-button-stub').trigger('click');

    expect(vm.editingTask).toBeNull();
    expect(vm.showCreateDialog).toBe(true);
    expect(vm.form).toEqual({
      name: '',
      question: '',
      model: CHAT_MODEL_NAME_GPT_5_4_MINI,
      scheduleType: 'daily',
      intervalValue: 4,
      intervalUnit: 'hour',
      hourlyMinute: 0,
      dailyTime: '09:00',
      weekday: 1,
      cronExpr: '0 9 * * *',
      authorizedSkills: [],
      authorizedMcpServers: [],
      maxTurns: 50
    });
  });

  it('prevents switching forms while a save is in progress', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openCreate: () => void;
      closeTaskDialog: () => void;
      openEdit: (task: IScheduledTask) => void;
      editingTask: IScheduledTask | null;
      form: Record<string, unknown>;
      showCreateDialog: boolean;
    };
    await wrapper.setData({ saving: true, showCreateDialog: true });

    const newButton = wrapper.find('.header el-button-stub');
    const dialog = wrapper.findComponent({ name: 'ElDialog' });

    expect(newButton.attributes('disabled')).toBe('true');
    expect(dialog.props('showClose')).toBe(false);
    expect(dialog.props('closeOnPressEscape')).toBe(false);

    vm.openEdit(editedTask);
    vm.openCreate();
    vm.closeTaskDialog();

    expect(vm.editingTask).toMatchObject({ id: editedTask.id });
    expect(vm.form).toMatchObject({ name: 'Existing task' });
    expect(vm.showCreateDialog).toBe(true);
  });
});
