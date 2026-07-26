// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHAT_MODEL_NAME_GPT_5_6_LUNA } from '@/constants';
import {
  SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE,
  SCHEDULED_TASK_ERROR_BROWSER_DEVICE_OFFLINE,
  scheduledTasksOperator,
  validateScheduledBrowserBinding
} from '@/operators/scheduledTasks';
import type { IAuthorizableSkill, IScheduledRun, IScheduledTask } from '@/operators/scheduledTasks';
import ScheduledTasks from './ScheduledTasks.vue';

const editedTask: IScheduledTask = {
  id: 'task-1',
  name: 'Existing task',
  state: 'enabled',
  schedule: { type: 'interval', interval_seconds: 21600, tz: 'Asia/Shanghai' },
  template: {
    model: 'gpt-5.6-sol',
    question: 'Reuse the existing task prompt',
    skills: ['hashnode'],
    mcp_servers: ['publishing'],
    max_turns: 12
  },
  unattended_policy: {
    mode: 'allow_selected_skills',
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
        ElCard: { template: '<div><slot /></div>' },
        ElDrawer: { template: '<div><slot /></div>' },
        ElTag: { template: '<span><slot /></span>' }
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
  const browserSkill: IAuthorizableSkill = {
    slug: 'xiaohongshu',
    name: 'Xiaohongshu',
    description: '',
    required_connections: ['xiaohongshu'],
    allowed_tools: ['browser.navigate'],
    source: 'installed',
    connected: true,
    missing_connections: [],
    browser_connections: [
      {
        connection_id: 'connection-1',
        revision: 4,
        device_id: 'device-1',
        wire_contract_digest: 'sha256:wire',
        policy_digest: 'sha256:policy',
        name: 'Xiaohongshu',
        device_name: 'Chrome',
        allowed_origins: ['https://www.xiaohongshu.com'],
        side_effects: ['publish', 'comment'],
        online: true,
        compatible: true
      }
    ]
  };

  it('fails immediately for stale and offline browser bindings', () => {
    expect(() => validateScheduledBrowserBinding(browserSkill, 'missing')).toThrow(
      SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE
    );
    const offline = structuredClone(browserSkill);
    offline.browser_connections![0].online = false;
    expect(() => validateScheduledBrowserBinding(offline, 'connection-1')).toThrow(
      SCHEDULED_TASK_ERROR_BROWSER_DEVICE_OFFLINE
    );
  });

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
      model: 'gpt-5.6-sol',
      authorizedSkills: ['hashnode'],
      authorizedMcpServers: ['publishing']
    });

    await wrapper.find('.header el-button-stub').trigger('click');

    expect(vm.editingTask).toBeNull();
    expect(vm.showCreateDialog).toBe(true);
    expect(vm.form).toEqual({
      name: '',
      question: '',
      model: CHAT_MODEL_NAME_GPT_5_6_LUNA,
      scheduleType: 'daily',
      intervalValue: 4,
      intervalUnit: 'hour',
      hourlyMinute: 0,
      dailyTime: '09:00',
      weekday: 1,
      cronExpr: '0 9 * * *',
      authorizedSkills: [],
      authorizedMcpServers: [],
      browserConnectionId: '',
      authorizationExpiresAt: expect.any(Number),
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
  it.each(['browser_device_offline', 'browser_authorization_stale'])(
    'shows typed browser run error %s without a waiting queue',
    async (errorCode) => {
      const wrapper = mountComponent();
      await wrapper.setData({
        selectedTask: editedTask,
        showRunHistory: true,
        runs: [
          {
            id: 'run-1',
            task_id: editedTask.id,
            status: 'failed',
            scheduled_at: 1,
            error_code: errorCode
          }
        ]
      });

      expect(wrapper.text()).toContain(errorCode.replace(/_/g, ' '));
      expect(wrapper.text()).not.toContain('waiting');
    }
  );

  describe('runs tab', () => {
    const listAllRuns = () => vi.spyOn(scheduledTasksOperator, 'listAllRuns');

    afterEach(() => vi.restoreAllMocks());

    const withToken = () =>
      shallowMount(ScheduledTasks, {
        global: {
          stubs: {
            ElCard: { template: '<div><slot /></div>' },
            ElDrawer: { template: '<div><slot /></div>' },
            ElTag: { template: '<span><slot /></span>' }
          },
          mocks: {
            $t: (key: string) => errorMessages[key] ?? key,
            $te: (key: string) => key in errorMessages,
            $store: {
              state: { chat: { credential: { token: 'tok' } }, site: { features: {} } }
            }
          }
        }
      });

    it('fetches the feed on entry, and refetches on every re-entry', async () => {
      const spy = listAllRuns().mockResolvedValue({ items: [], count: 0 });
      const wrapper = withToken();
      const vm = wrapper.vm as unknown as { switchTab: (t: 'tasks' | 'runs') => void };

      // Nothing loads until the tab is opened.
      expect(spy).not.toHaveBeenCalled();
      vm.switchTab('runs');
      await flushPromises();
      expect(spy).toHaveBeenCalledTimes(1);

      // Re-entry must refetch: runs land in the background and a task rename or
      // delete on the tasks tab changes the task_name tag on existing rows.
      vm.switchTab('tasks');
      vm.switchTab('runs');
      await flushPromises();
      expect(spy).toHaveBeenCalledTimes(2);

      // Switching to the tab you are already on is a no-op.
      vm.switchTab('runs');
      await flushPromises();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('tags each run row with its parent task name', async () => {
      const wrapper = withToken();
      await wrapper.setData({
        activeTab: 'runs',
        allRuns: [
          { id: 'r1', task_id: 't1', task_name: 'Gmail digest', status: 'success', scheduled_at: 1 },
          { id: 'r2', task_id: 't2', status: 'failed', scheduled_at: 2 }
        ],
        allRunsCount: 2
      });

      const tags = wrapper.findAll('.run-task-tag');
      expect(tags).toHaveLength(1);
      expect(tags[0].text()).toBe('Gmail digest');
    });

    it('resets to page 1 and refetches when the status filter changes', async () => {
      const spy = listAllRuns().mockResolvedValue({ items: [], count: 0 });
      const wrapper = withToken();
      await wrapper.setData({ activeTab: 'runs', allRunsPage: 3 });

      (wrapper.vm as unknown as { onStatusFilter: (s: string) => void }).onStatusFilter('failed');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith('tok', { status: 'failed', offset: 0, limit: 20 });
      expect((wrapper.vm as unknown as { allRunsPage: number }).allRunsPage).toBe(1);
    });

    it('sends no status for the "all" filter', async () => {
      const spy = listAllRuns().mockResolvedValue({ items: [], count: 0 });
      const wrapper = withToken();
      await wrapper.setData({ activeTab: 'runs', allRunsStatus: 'failed' });

      (wrapper.vm as unknown as { onStatusFilter: (s: string) => void }).onStatusFilter('all');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith('tok', { status: undefined, offset: 0, limit: 20 });
    });

    it('drops a stale in-flight response when the filter changed mid-flight', async () => {
      let resolveStale: (v: { items: IScheduledRun[]; count: number }) => void = () => undefined;
      const spy = listAllRuns()
        .mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)))
        .mockResolvedValue({ items: [{ id: 'fresh', task_id: 't1', status: 'failed', scheduled_at: 2 }], count: 1 });

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as {
        onStatusFilter: (s: string) => void;
        allRuns: IScheduledRun[];
        allRunsLoading: boolean;
      };
      await wrapper.setData({ activeTab: 'runs' });

      vm.onStatusFilter('success');
      vm.onStatusFilter('failed');
      await flushPromises();

      resolveStale({ items: [{ id: 'stale', task_id: 't9', status: 'success', scheduled_at: 1 }], count: 1 });
      await flushPromises();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(vm.allRuns.map((r) => r.id)).toEqual(['fresh']);
      expect(vm.allRunsLoading).toBe(false);
    });
  });
});
