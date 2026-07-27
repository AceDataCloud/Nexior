// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHAT_MODEL_NAME_GPT_5_6_SOL } from '@/constants';
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
        connection_revision: 4,
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
      model: CHAT_MODEL_NAME_GPT_5_6_SOL,
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
      connectionAccounts: {},
      authorizationExpiresAt: expect.any(Number),
      maxTurns: 50
    });
  });

  it('prefills the create form from an existing task, with a numbered name', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      editingTask: IScheduledTask | null;
      form: Record<string, unknown>;
      showCreateDialog: boolean;
    };
    await wrapper.setData({ tasks: [editedTask] });

    vm.openDuplicate(editedTask);

    // A copy is a CREATE, not an edit — otherwise saving would overwrite the original.
    expect(vm.editingTask).toBeNull();
    expect(vm.showCreateDialog).toBe(true);
    expect(vm.form).toMatchObject({
      name: 'Existing task 2',
      question: 'Reuse the existing task prompt',
      model: 'gpt-5.6-sol',
      scheduleType: 'interval',
      intervalValue: 6,
      intervalUnit: 'hour',
      authorizedSkills: ['hashnode'],
      authorizedMcpServers: ['publishing'],
      maxTurns: 12
    });
  });

  it('skips names already taken when duplicating repeatedly', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    await wrapper.setData({
      tasks: [editedTask, { ...editedTask, id: 'task-2', name: 'Existing task 2' }]
    });

    vm.openDuplicate(editedTask);
    expect(vm.form.name).toBe('Existing task 3');

    // Duplicating a copy re-uses the base name rather than stacking suffixes.
    vm.openDuplicate({ ...editedTask, id: 'task-2', name: 'Existing task 2' });
    expect(vm.form.name).toBe('Existing task 3');
  });

  it('keeps the duplicated name within the 80-char input cap, without repeating it', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    const longName = 'x'.repeat(80);
    await wrapper.setData({ tasks: [{ ...editedTask, name: longName }] });

    vm.openDuplicate({ ...editedTask, name: longName });
    const first = vm.form.name;
    expect(first.length).toBeLessThanOrEqual(80);
    expect(first.endsWith(' 2')).toBe(true);

    // Once that copy exists, duplicating again must not hand back the same
    // truncated string — names are not unique server-side, so a repeat would
    // leave two indistinguishable rows.
    await wrapper.setData({
      tasks: [
        { ...editedTask, name: longName },
        { ...editedTask, id: 'task-2', name: first }
      ]
    });
    vm.openDuplicate({ ...editedTask, name: longName });
    expect(vm.form.name).not.toBe(first);
    expect(vm.form.name.length).toBeLessThanOrEqual(80);
  });

  it('does not split an emoji when truncating a long name', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    // 90 code points (180 UTF-16 units) so truncation actually fires, and the
    // 78-code-point cut lands mid-emoji.
    const emojiName = `a${'😀'.repeat(90)}`;
    await wrapper.setData({ tasks: [{ ...editedTask, name: emojiName }] });

    vm.openDuplicate({ ...editedTask, name: emojiName });

    // A lone high surrogate renders as the replacement character.
    expect(vm.form.name).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect([...vm.form.name].length).toBeLessThanOrEqual(80);
    expect(vm.form.name.endsWith(' 2')).toBe(true);
  });

  it('keeps a trailing number that is part of the name, not a copy suffix', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    await wrapper.setData({ tasks: [{ ...editedTask, name: 'Weekly report 2026' }] });

    vm.openDuplicate({ ...editedTask, name: 'Weekly report 2026' });

    // "Weekly report" is not an existing task, so 2026 is a year, not a suffix.
    expect(vm.form.name).toBe('Weekly report 2026 2');
  });

  it('mints a fresh authorization expiry for the copy', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      openEdit: (task: IScheduledTask) => void;
      form: { authorizationExpiresAt: number };
    };
    const expired = Math.floor(Date.now() / 1000) - 86400;
    const stale = {
      ...editedTask,
      unattended_policy: { ...editedTask.unattended_policy!, expires_at: expired }
    };
    await wrapper.setData({ tasks: [stale] });

    // Editing preserves the existing grant …
    vm.openEdit(stale);
    expect(vm.form.authorizationExpiresAt).toBe(expired);

    // … but a copy must not inherit an already-expired one, or it would run
    // with no skills and no error shown.
    vm.openDuplicate(stale);
    expect(vm.form.authorizationExpiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('does not open a duplicate while a save is in progress', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      openEdit: (task: IScheduledTask) => void;
      editingTask: IScheduledTask | null;
      form: { name: string };
    };
    // Seed tasks so an unguarded openDuplicate would visibly rename the form.
    await wrapper.setData({ tasks: [editedTask] });
    vm.openEdit(editedTask);
    await wrapper.setData({ saving: true });

    vm.openDuplicate(editedTask);

    // The in-flight edit must survive — swapping the form mid-save would submit
    // the copy's fields as an update to the original.
    expect(vm.editingTask).toMatchObject({ id: editedTask.id });
    expect(vm.form.name).toBe('Existing task');
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
  it('offers an account picker only for connectors the user has several accounts of', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      authorizableSkills: unknown[];
      form: { connectionAccounts: Record<string, string> } & Record<string, unknown>;
      accountChoices: Array<{ identifier: string; label: string; accounts: Array<{ connection_id: string }> }>;
    };
    await wrapper.setData({
      authorizableSkills: [
        {
          slug: 'multi',
          name: 'multi',
          description: '',
          required_connections: ['zhihu/zhihu', 'github/github'],
          allowed_tools: [],
          source: 'installed',
          connected: true,
          missing_connections: [],
          connection_accounts: {
            // Server keys this map by the skill's frontmatter entry, which is
            // the BARE name — the binding must still go out as the canonical
            // `zhihu/zhihu` the server validates against.
            zhihu: [
              {
                connection_id: 'z1',
                connector_identifier: 'zhihu/zhihu',
                label: '主号',
                is_default: true,
                account_name: 'A'
              },
              {
                connection_id: 'z2',
                connector_identifier: 'zhihu/zhihu',
                label: '小号',
                is_default: false,
                account_name: 'B'
              }
            ],
            // Single account → no choice needed, falls back to the default.
            github: [
              {
                connection_id: 'g1',
                connector_identifier: 'github/github',
                label: '',
                is_default: true,
                account_name: 'C'
              }
            ]
          }
        }
      ],
      form: { ...(wrapper.vm as unknown as { form: Record<string, unknown> }).form, authorizedSkills: ['multi'] }
    });

    // Keyed on the canonical identifier, not the bare frontmatter name.
    expect(vm.accountChoices.map((c) => c.identifier)).toEqual(['zhihu/zhihu']);
    expect(vm.accountChoices[0].accounts).toHaveLength(2);

    // A binding for a connector that is no longer relevant (skill deselected)
    // or whose account no longer exists must not be shipped — the server
    // rejects unverifiable bindings and `force` does not bypass that, which
    // would otherwise leave the task unsavable.
    await wrapper.setData({
      form: {
        ...(wrapper.vm as unknown as { form: Record<string, unknown> }).form,
        connectionAccounts: { 'zhihu/zhihu': 'z2', 'gone/gone': 'x1' }
      }
    });
    const bindings = (
      wrapper.vm as unknown as {
        accountChoices: Array<{ identifier: string; accounts: Array<{ connection_id: string }> }>;
        form: { connectionAccounts: Record<string, string> };
      }
    ).accountChoices
      .map((choice) => ({
        connector_identifier: choice.identifier,
        connection_id: vm.form.connectionAccounts[choice.identifier] || ''
      }))
      .filter(
        (b) =>
          !!b.connection_id &&
          vm.accountChoices
            .find((c) => c.identifier === b.connector_identifier)
            ?.accounts.some((a) => a.connection_id === b.connection_id)
      );
    expect(bindings).toEqual([{ connector_identifier: 'zhihu/zhihu', connection_id: 'z2' }]);
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

    it('tags each run row with every connector account it ran as', async () => {
      const wrapper = withToken();
      await wrapper.setData({
        activeTab: 'runs',
        allRuns: [
          {
            id: 'r1',
            task_id: 't1',
            status: 'success',
            scheduled_at: 1,
            run_accounts: [
              { connector_identifier: 'zhihu/zhihu', provider_alias: 'zhihu', label: '主号' },
              { connector_identifier: 'medium/medium', provider_alias: 'medium', account_name: 'Germey' }
            ]
          }
        ],
        allRunsCount: 1
      });

      expect(wrapper.findAll('.run-account-tag').map((t) => t.text())).toEqual(['zhihu · 主号', 'medium · Germey']);
    });

    // A deleted account resolves to no name at all — the tag must not render a
    // dangling separator, and rows without accounts must stay unchanged.
    it('falls back to the connector alone when the account name is gone', async () => {
      const wrapper = withToken();
      await wrapper.setData({
        activeTab: 'runs',
        allRuns: [
          {
            id: 'r1',
            task_id: 't1',
            status: 'success',
            scheduled_at: 1,
            run_accounts: [{ connector_identifier: 'zhihu/zhihu', provider_alias: 'zhihu' }]
          },
          { id: 'r2', task_id: 't2', status: 'success', scheduled_at: 2 }
        ],
        allRunsCount: 2
      });

      const tags = wrapper.findAll('.run-account-tag');
      expect(tags).toHaveLength(1);
      expect(tags[0].text()).toBe('zhihu');
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
