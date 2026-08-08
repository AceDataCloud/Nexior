// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { MessageBoxData } from 'element-plus';

import { CHAT_MODEL_NAME_GPT_5_6_SOL } from '@/constants';
import {
  SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE,
  SCHEDULED_TASK_ERROR_BROWSER_DEVICE_OFFLINE,
  scheduledTasksOperator,
  validateScheduledBrowserBinding
} from '@/operators/scheduledTasks';
import type { IAuthorizableSkill, IScheduledRun, IScheduledTask } from '@/operators/scheduledTasks';
import ScheduledTasks from './ScheduledTasks.vue';

const copyToClipboard = vi.hoisted(() => vi.fn());
vi.mock('copy-to-clipboard', () => ({ default: copyToClipboard }));

// Surface + desktop bridge are module-level singletons, so local-execution
// behaviour can only be exercised by mocking them.
const surfaceMocks = vi.hoisted(() => ({ isDesktop: vi.fn(() => false), getSurface: vi.fn(() => 'web') }));
vi.mock('@/utils/surface', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/surface')>()),
  isDesktop: surfaceMocks.isDesktop,
  getSurface: surfaceMocks.getSurface
}));

const desktopMocks = vi.hoisted(() => ({
  desktopBridge: vi.fn(() => undefined as any),
  localExec: vi.fn(() => undefined as any)
}));
vi.mock('@/utils/desktop', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/desktop')>()),
  desktopBridge: desktopMocks.desktopBridge,
  localExec: desktopMocks.localExec
}));

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
    // Authorization is the lists themselves — there is no mode flag.
    allowed_skills: ['hashnode'],
    allowed_mcp_servers: ['publishing']
  },
  run_count: 1,
  created_at: 1,
  updated_at: 1
};

// `MessageBoxData` is an intersection (`MessageBoxInputData & 'confirm'`) that
// no runtime value satisfies; what confirm() actually resolves with is the
// action string.
const CONFIRMED = 'confirm' as unknown as MessageBoxData;

const errorMessages: Record<string, string> = {
  'chat.scheduledTasks.run.reason.internal_error': 'Internal error',
  'chat.scheduledTasks.run.reason.billing_gate_failed': 'Billing authorization failed'
};

const mountComponent = (credential: { token: string } | null = null, extraStubs: Record<string, unknown> = {}) =>
  shallowMount(ScheduledTasks, {
    global: {
      stubs: {
        ElCard: { template: '<div><slot /></div>' },
        ElDrawer: { template: '<div><slot /></div>' },
        ElTag: { template: '<span><slot /></span>' },
        ...extraStubs
      },
      mocks: {
        $t: (key: string) => errorMessages[key] ?? key,
        $te: (key: string) => key in errorMessages,
        $store: {
          state: {
            // `token` is a computed off the store — setData('token') is a no-op.
            chat: { credential },
            site: { features: {} }
          }
        }
      }
    }
  });

describe('chat/ScheduledTasks — local execution', () => {
  const IDENTITY = { device_id: 'dev-1', device_name: "Qingcai's MacBook", open_at_login: false };
  const asDesktop = (tools: { name: string; description: string }[] = []) => {
    surfaceMocks.isDesktop.mockReturnValue(true);
    surfaceMocks.getSurface.mockReturnValue('desktop');
    desktopMocks.desktopBridge.mockReturnValue({ scheduler: { identity: vi.fn().mockResolvedValue(IDENTITY) } });
    desktopMocks.localExec.mockReturnValue({ listTools: vi.fn().mockResolvedValue(tools) });
  };

  afterEach(() => {
    surfaceMocks.isDesktop.mockReturnValue(false);
    surfaceMocks.getSurface.mockReturnValue('web');
    desktopMocks.desktopBridge.mockReturnValue(undefined);
    desktopMocks.localExec.mockReturnValue(undefined);
    vi.restoreAllMocks();
  });

  const vmOf = (wrapper: ReturnType<typeof mountComponent>) =>
    wrapper.vm as unknown as {
      openCreate: () => void;
      canRunLocally: boolean;
      localUnavailableReason: string;
      deviceIdentity: typeof IDENTITY | null;
      localToolSpecs: { name: string }[];
      form: Record<string, unknown>;
    };

  it('does not offer local execution on web', async () => {
    const wrapper = mountComponent();
    const vm = vmOf(wrapper);
    vm.openCreate();
    await flushPromises();
    // No bridge, so nothing could fire the task even if the user picked it.
    expect(vm.canRunLocally).toBe(false);
    expect(vm.deviceIdentity).toBeNull();
    expect(vm.localUnavailableReason).toBe('chat.scheduledTasks.form.executionWebUnsupported');
  });

  it('explains that mobile cannot run tasks locally', async () => {
    surfaceMocks.getSurface.mockReturnValue('ios');
    const wrapper = mountComponent();
    const vm = vmOf(wrapper);
    vm.openCreate();
    await flushPromises();
    expect(vm.localUnavailableReason).toBe('chat.scheduledTasks.form.executionMobileUnsupported');
  });

  it('loads this device and its tools when the dialog opens on desktop', async () => {
    asDesktop([{ name: 'fs.read_file', description: 'Read a file' }]);
    const wrapper = mountComponent();
    const vm = vmOf(wrapper);
    vm.openCreate();
    await flushPromises();
    expect(vm.canRunLocally).toBe(true);
    expect(vm.deviceIdentity).toEqual(IDENTITY);
    expect(vm.localToolSpecs).toEqual([{ name: 'fs.read_file', description: 'Read a file' }]);
  });

  it('still offers the cloud when the desktop bridge fails', async () => {
    asDesktop();
    desktopMocks.desktopBridge.mockReturnValue({
      scheduler: { identity: vi.fn().mockRejectedValue(new Error('ipc down')) }
    });
    const wrapper = mountComponent();
    const vm = vmOf(wrapper);
    vm.openCreate();
    await flushPromises();
    // A broken bridge removes an option; it must not break task creation.
    expect(vm.canRunLocally).toBe(false);
    expect(vm.form.execution).toBe('cloud');
  });

  describe('run now routing', () => {
    const localTask: IScheduledTask = { ...editedTask, id: 'local-1', execution: 'local', device_id: 'dev-1' };

    it('runs a LOCAL task through the daemon, never the cloud trigger', async () => {
      // The bug this guards, seen in production: the cloud's `trigger` action
      // runs the agent loop through a server-side loopback with no client
      // attached, so a local task fired that way reaches the model with none of
      // its authorized local tools. It answered "I can't access your folder"
      // and the judge recorded a failure — for a correctly configured task.
      asDesktop();
      const runNow = vi.fn().mockResolvedValue({ ok: true });
      desktopMocks.desktopBridge.mockReturnValue({
        scheduler: { identity: vi.fn().mockResolvedValue(IDENTITY), runNow }
      });
      const triggerTask = vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue(undefined as never);
      const wrapper = mountComponent({ token: 'tok' });

      await (wrapper.vm as unknown as { triggerNow: (t: IScheduledTask) => Promise<void> }).triggerNow(localTask);

      expect(runNow).toHaveBeenCalledWith('local-1');
      expect(triggerTask).not.toHaveBeenCalled();
    });

    it('still uses the cloud trigger for a cloud task', async () => {
      asDesktop();
      const runNow = vi.fn().mockResolvedValue({ ok: true });
      desktopMocks.desktopBridge.mockReturnValue({
        scheduler: { identity: vi.fn().mockResolvedValue(IDENTITY), runNow }
      });
      const triggerTask = vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue(undefined as never);
      const wrapper = mountComponent({ token: 'tok' });

      await (wrapper.vm as unknown as { triggerNow: (t: IScheduledTask) => Promise<void> }).triggerNow(editedTask);

      expect(triggerTask).toHaveBeenCalledWith('tok', editedTask.id);
      expect(runNow).not.toHaveBeenCalled();
    });

    it('refuses rather than running a local task from the wrong machine', async () => {
      // No desktop bridge: a web tab, or another Mac. Falling back to the cloud
      // here would reproduce the exact failure above.
      const triggerTask = vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue(undefined as never);
      const wrapper = mountComponent({ token: 'tok' });

      await (wrapper.vm as unknown as { triggerNow: (t: IScheduledTask) => Promise<void> }).triggerNow(localTask);

      expect(triggerTask).not.toHaveBeenCalled();
    });

    it('surfaces the daemon refusing, without falling back to the cloud', async () => {
      asDesktop();
      desktopMocks.desktopBridge.mockReturnValue({
        scheduler: {
          identity: vi.fn().mockResolvedValue(IDENTITY),
          runNow: vi.fn().mockResolvedValue({ ok: false, reason: 'not_on_this_device' })
        }
      });
      const triggerTask = vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue(undefined as never);
      const wrapper = mountComponent({ token: 'tok' });

      await (wrapper.vm as unknown as { triggerNow: (t: IScheduledTask) => Promise<void> }).triggerNow(localTask);

      expect(triggerTask).not.toHaveBeenCalled();
    });
  });

  it('defaults a new task to the cloud', async () => {
    asDesktop();
    const wrapper = mountComponent();
    const vm = vmOf(wrapper);
    vm.openCreate();
    await flushPromises();
    // Local is opt-in: it only fires while this machine is awake, which is not
    // what someone clicking "new scheduled task" expects by default.
    expect(vm.form.execution).toBe('cloud');
    expect(vm.form.authorizedLocalTools).toEqual([]);
  });
});

describe('chat/ScheduledTasks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the template wizard automatically for a categorized deep link', async () => {
    vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
    const wrapper = shallowMount(ScheduledTasks, {
      global: {
        stubs: { ScheduledTemplateWizard: true },
        mocks: {
          $t: (key: string) => key,
          $te: () => false,
          $route: { query: { template_category: 'marketing' } },
          $store: { state: { chat: { credential: { token: 'tok' } }, site: { features: {} } } }
        }
      }
    });
    await flushPromises();
    const vm = wrapper.vm as unknown as { showTemplateWizard: boolean; templateInitialCategory: string };
    expect(vm.showTemplateWizard).toBe(true);
    expect(vm.templateInitialCategory).toBe('marketing');
  });
  describe('template activation', () => {
    const templateTask: IScheduledTask = {
      ...editedTask,
      state: 'disabled',
      template_source: {
        id: 'daily-ai-promo-pack',
        version: 1,
        inputs: {},
        snapshot: { title: 'Daily AI promotion pack', categories: ['marketing'] }
      }
    };

    it('uses the gated enable action for a disabled template task', async () => {
      const enabled = { ...templateTask, state: 'enabled' as const, updated_at: 2 };
      const enable = vi.spyOn(scheduledTasksOperator, 'enableTemplateTask').mockResolvedValue(enabled);
      const update = vi.spyOn(scheduledTasksOperator, 'updateTask');
      const wrapper = mountComponent({ token: 'tok' });
      await wrapper.setData({ tasks: [templateTask] });

      await (
        wrapper.vm as unknown as { toggleState: (task: IScheduledTask, enabled: boolean) => Promise<void> }
      ).toggleState(templateTask, true);

      expect(enable).toHaveBeenCalledWith('tok', templateTask.id);
      expect(update).not.toHaveBeenCalled();
      expect((wrapper.vm as unknown as { tasks: IScheduledTask[] }).tasks[0]).toEqual(enabled);
    });

    it('rolls back and explains the template gate when activation is rejected', async () => {
      vi.spyOn(scheduledTasksOperator, 'enableTemplateTask').mockRejectedValue(new Error('test required'));
      const error = vi.spyOn(ElMessage, 'error');
      const wrapper = mountComponent({ token: 'tok' });
      await wrapper.setData({ tasks: [templateTask] });

      await (
        wrapper.vm as unknown as { toggleState: (task: IScheduledTask, enabled: boolean) => Promise<void> }
      ).toggleState(templateTask, true);

      expect((wrapper.vm as unknown as { tasks: IScheduledTask[] }).tasks[0].state).toBe('disabled');
      expect(error).toHaveBeenCalledWith('chat.scheduledTemplates.enableFailed');
    });

    it('uses the regular update action when disabling a template task', async () => {
      const active = { ...templateTask, state: 'enabled' as const };
      const updated = { ...active, state: 'disabled' as const, updated_at: 2 };
      const update = vi.spyOn(scheduledTasksOperator, 'updateTask').mockResolvedValue(updated);
      const enable = vi.spyOn(scheduledTasksOperator, 'enableTemplateTask');
      const wrapper = mountComponent({ token: 'tok' });
      await wrapper.setData({ tasks: [active] });

      await (
        wrapper.vm as unknown as { toggleState: (task: IScheduledTask, enabled: boolean) => Promise<void> }
      ).toggleState(active, false);

      expect(update).toHaveBeenCalledWith('tok', active.id, { state: 'disabled' });
      expect(enable).not.toHaveBeenCalled();
    });

    it('keeps regular tasks on the update action when enabling', async () => {
      const inactive = { ...editedTask, state: 'disabled' as const };
      const updated = { ...inactive, state: 'enabled' as const, updated_at: 2 };
      const update = vi.spyOn(scheduledTasksOperator, 'updateTask').mockResolvedValue(updated);
      const enable = vi.spyOn(scheduledTasksOperator, 'enableTemplateTask');
      const wrapper = mountComponent({ token: 'tok' });
      await wrapper.setData({ tasks: [inactive] });

      await (
        wrapper.vm as unknown as { toggleState: (task: IScheduledTask, enabled: boolean) => Promise<void> }
      ).toggleState(inactive, true);

      expect(update).toHaveBeenCalledWith('tok', inactive.id, { state: 'enabled' });
      expect(enable).not.toHaveBeenCalled();
    });
  });

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

  it('labels the task id and copies it without opening the run drawer', async () => {
    // Render the real CopyToClipboard rather than a stub — the click guard that
    // keeps the copy from opening the drawer lives inside it. Its button sits in
    // an ElTooltip slot, so that has to pass its children through too.
    const wrapper = mountComponent(null, {
      CopyToClipboard: false,
      ElTooltip: { template: '<span><slot /></span>' }
    });

    await wrapper.setData({ tasks: [editedTask] });

    expect(wrapper.find('.task-id-text').text()).toBe('common.entity.id: task-1');

    await wrapper.get('.task-id button[aria-label="common.button.copy"]').trigger('click');

    expect(copyToClipboard).toHaveBeenCalledWith('task-1', expect.anything());
    expect((wrapper.vm as unknown as { showRunHistory: boolean }).showRunHistory).toBe(false);
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

    vm.openCreate();

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
      timezone: expect.any(String),
      authorizedSkills: [],
      authorizedMcpServers: [],
      browserConnectionId: '',
      connectionAccounts: {},
      execution: 'cloud',
      authorizedLocalTools: [],
      authorizationExpiresAt: expect.any(Number),
      maxTurns: 50
    });
  });

  it('keeps the saved time zone when editing instead of replacing it with this device zone', () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openEdit: (task: IScheduledTask) => void;
      form: { timezone: string };
      buildSchedule: () => IScheduledTask['schedule'];
      scheduleLabel: (schedule: IScheduledTask['schedule']) => string;
    };
    const losAngeles = {
      ...editedTask,
      schedule: { type: 'cron', cron: '0 22 * * *', tz: 'America/Los_Angeles' } as const
    };

    vm.openEdit(losAngeles);

    expect(vm.form.timezone).toBe('America/Los_Angeles');
    expect(vm.buildSchedule()).toMatchObject({ type: 'cron', tz: 'America/Los_Angeles' });
    expect(vm.scheduleLabel(losAngeles.schedule)).toContain('America/Los_Angeles');
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
      timezone: 'Asia/Shanghai',
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

    // Duplicating a copy appends rather than reusing the base: any rule that
    // strips a trailing number eventually eats a real one (see the year test).
    vm.openDuplicate({ ...editedTask, id: 'task-2', name: 'Existing task 2' });
    expect(vm.form.name).toBe('Existing task 2 2');
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

  it('does not split an emoji, and stays within the cap the browser enforces', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    // Exactly 80 UTF-16 units — the input is already full, so the suffix has to
    // displace something. Budgeting in code points here would return 82 units,
    // the browser's maxlength would clip the " 2" back off, and every copy would
    // come out identical.
    const emojiName = '😀'.repeat(40);
    await wrapper.setData({ tasks: [{ ...editedTask, name: emojiName }] });

    vm.openDuplicate({ ...editedTask, name: emojiName });
    const first = vm.form.name;

    // maxlength counts UTF-16 units, so that is the unit that must be asserted.
    expect(first.length).toBeLessThanOrEqual(80);
    // A lone high surrogate renders as the replacement character.
    expect(first).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(first.endsWith(' 2')).toBe(true);

    // And the copy of the copy must still differ.
    await wrapper.setData({
      tasks: [
        { ...editedTask, name: emojiName },
        { ...editedTask, id: 'task-2', name: first }
      ]
    });
    vm.openDuplicate({ ...editedTask, name: emojiName });
    expect(vm.form.name).not.toBe(first);
    expect(vm.form.name.length).toBeLessThanOrEqual(80);
  });

  it('never eats a trailing number that is part of the name', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      openDuplicate: (task: IScheduledTask) => void;
      form: { name: string };
    };
    // The generic prefix exists as its own task — the case where any
    // "strip the trailing number" heuristic destroys the year.
    await wrapper.setData({
      tasks: [
        { ...editedTask, name: 'Weekly report' },
        { ...editedTask, id: 'task-2', name: 'Weekly report 2026' }
      ]
    });

    vm.openDuplicate({ ...editedTask, name: 'Weekly report 2026' });

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

    const newButton = wrapper.find('.header el-dropdown-stub');
    const dialogs = wrapper.findAllComponents({ name: 'ElDialog' });
    const dialog = dialogs[dialogs.length - 1];

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

  // A legacy task doc may still carry `mode`; it has no authority and must
  // neither blank the dialog nor round-trip back to the server.
  it.each([undefined, 'allow_selected', 'deny_all'])(
    'restores authorizations regardless of a legacy mode=%s and re-saves without it',
    async (mode) => {
      // saveTask gates on the "you are authorizing these skills" confirm.
      vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue(CONFIRMED);
      const update = vi
        .spyOn(scheduledTasksOperator, 'updateTask')
        .mockResolvedValue({ ...editedTask } as IScheduledTask);
      vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
      vi.spyOn(scheduledTasksOperator, 'listAuthorizableCapabilities').mockResolvedValue({
        skills: [],
        mcp_servers: []
      });
      const wrapper = mountComponent({ token: 'tok' });
      await flushPromises();
      const vm = wrapper.vm as unknown as {
        openEdit: (task: IScheduledTask) => void;
        saveTask: () => Promise<void>;
        form: Record<string, unknown>;
      };

      vm.openEdit({
        ...editedTask,
        unattended_policy: { ...editedTask.unattended_policy!, ...(mode ? { mode } : {}) }
      } as IScheduledTask);

      expect(vm.form).toMatchObject({
        authorizedSkills: ['hashnode'],
        authorizedMcpServers: ['publishing']
      });

      await vm.saveTask();
      await flushPromises();

      const [, , payload] = update.mock.calls[0];
      expect(payload.unattended_policy).toEqual({
        allowed_skills: ['hashnode'],
        allowed_mcp_servers: ['publishing'],
        browser_connections: undefined,
        connection_bindings: undefined,
        expires_at: expect.any(Number)
      });
      expect(payload.unattended_policy).not.toHaveProperty('mode');
      expect(payload.template).toMatchObject({ skills: ['hashnode'], mcp_servers: ['publishing'] });
    }
  );

  it('keeps the saved account binding when confirm is clicked before capabilities load', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue(CONFIRMED);
    const update = vi
      .spyOn(scheduledTasksOperator, 'updateTask')
      .mockResolvedValue({ ...editedTask } as IScheduledTask);
    vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
    // Resolve only after openEdit returns, so saveTask starts while in flight.
    let release: (v: { skills: IAuthorizableSkill[]; mcp_servers: [] }) => void = () => undefined;
    vi.spyOn(scheduledTasksOperator, 'listAuthorizableCapabilities').mockReturnValue(
      new Promise((resolve) => (release = resolve)) as ReturnType<
        typeof scheduledTasksOperator.listAuthorizableCapabilities
      >
    );

    const wrapper = mountComponent({ token: 'tok' });
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      openEdit: (task: IScheduledTask) => void;
      saveTask: () => Promise<void>;
    };

    const boundTask: IScheduledTask = {
      ...editedTask,
      template: { ...editedTask.template, skills: ['multi'] },
      unattended_policy: {
        allowed_skills: ['multi'],
        allowed_mcp_servers: [],
        connection_bindings: [{ connector_identifier: 'zhihu/zhihu', connection_id: 'conn-a' }]
      }
    };
    vm.openEdit(boundTask);

    const saving = vm.saveTask();
    release({
      skills: [
        {
          slug: 'multi',
          name: 'multi',
          description: '',
          required_connections: ['zhihu/zhihu'],
          allowed_tools: [],
          source: 'installed',
          connected: true,
          missing_connections: [],
          connection_accounts: {
            zhihu: [
              {
                connection_id: 'conn-a',
                connector_identifier: 'zhihu/zhihu',
                label: 'A',
                is_default: true,
                account_name: 'a'
              },
              {
                connection_id: 'conn-b',
                connector_identifier: 'zhihu/zhihu',
                label: 'B',
                is_default: false,
                account_name: 'b'
              }
            ]
          }
        } as unknown as IAuthorizableSkill
      ],
      mcp_servers: []
    });
    await saving;
    await flushPromises();

    const [, , payload] = update.mock.calls[0];
    expect(payload.unattended_policy?.connection_bindings).toEqual([
      { connector_identifier: 'zhihu/zhihu', connection_id: 'conn-a' }
    ]);
  });

  describe('save while capabilities are still loading', () => {
    const boundTask: IScheduledTask = {
      ...editedTask,
      template: { ...editedTask.template, skills: ['multi'] },
      unattended_policy: {
        allowed_skills: ['multi'],
        allowed_mcp_servers: [],
        connection_bindings: [{ connector_identifier: 'zhihu/zhihu', connection_id: 'conn-a' }]
      }
    };

    /** Mounts with a capability request the test resolves/rejects by hand. */
    const arrange = async () => {
      vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue(CONFIRMED);
      vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
      const update = vi
        .spyOn(scheduledTasksOperator, 'updateTask')
        .mockResolvedValue({ ...editedTask } as IScheduledTask);
      const create = vi
        .spyOn(scheduledTasksOperator, 'createTask')
        .mockResolvedValue({ ...editedTask } as IScheduledTask);
      let settle: { resolve: () => void; reject: () => void } = { resolve: () => undefined, reject: () => undefined };
      vi.spyOn(scheduledTasksOperator, 'listAuthorizableCapabilities').mockReturnValue(
        new Promise((resolve, reject) => {
          settle = { resolve: () => resolve({ skills: [], mcp_servers: [] }), reject: () => reject(new Error('net')) };
        }) as ReturnType<typeof scheduledTasksOperator.listAuthorizableCapabilities>
      );
      const wrapper = mountComponent({ token: 'tok' });
      await flushPromises();
      const vm = wrapper.vm as unknown as {
        openEdit: (task: IScheduledTask) => void;
        openCreate: () => void;
        closeTaskDialog: () => void;
        saveTask: () => Promise<void>;
        saving: boolean;
        form: { connectionAccounts: Record<string, string> } & Record<string, unknown>;
      };
      return { vm, update, create, settle };
    };

    it('aborts instead of wiping bindings when the capability load fails', async () => {
      const error = vi.spyOn(ElMessage, 'error');
      const { vm, update, settle } = await arrange();
      vm.openEdit(boundTask);

      const saving = vm.saveTask();
      settle.reject();
      await saving;
      await flushPromises();

      expect(update).not.toHaveBeenCalled();
      // Aborted for THIS reason — not incidentally via some other early return.
      expect(error).toHaveBeenCalledWith('chat.scheduledTasks.loadError');
      expect(vm.form.connectionAccounts).toEqual({ 'zhihu/zhihu': 'conn-a' });
    });

    it('still saves when there is no token, so the auth failure surfaces', async () => {
      vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
      const update = vi.spyOn(scheduledTasksOperator, 'updateTask').mockRejectedValue(new Error('401'));
      const error = vi.spyOn(ElMessage, 'error');
      const wrapper = mountComponent(null);
      await flushPromises();
      const vm = wrapper.vm as unknown as {
        openEdit: (task: IScheduledTask) => void;
        saveTask: () => Promise<void>;
      };

      vm.openEdit({ ...editedTask, unattended_policy: { allowed_skills: [] } });
      await vm.saveTask();
      await flushPromises();

      expect(update).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalled();
    });

    // `saving` is held across the capability wait, and openCreate/closeTaskDialog
    // both early-return on it — so the mid-save clicks are no-ops and the
    // original edit still lands intact, rather than becoming a blank create.
    it('ignores New clicked mid-save and still saves the edit', async () => {
      const { vm, update, create, settle } = await arrange();
      vm.openEdit(boundTask);

      const saving = vm.saveTask();
      vm.openCreate();
      settle.resolve();
      await saving;
      await flushPromises();

      expect(create).not.toHaveBeenCalled();
      const [, id, payload] = update.mock.calls[0];
      expect(id).toBe(boundTask.id);
      expect(payload.template?.question).toBe(boundTask.template.question);
    });

    it('ignores Cancel clicked mid-save and still saves the edit', async () => {
      const { vm, update, settle } = await arrange();
      vm.openEdit(boundTask);

      const saving = vm.saveTask();
      vm.closeTaskDialog();
      settle.resolve();
      await saving;
      await flushPromises();

      const [, id] = update.mock.calls[0];
      expect(id).toBe(boundTask.id);
    });
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

    it('does not style an indeterminate run as a failure', () => {
      // The judge abstaining means "could not prove it", not "it broke". Four
      // runs whose articles were live rendered red under the old mapping.
      const vm = withToken().vm as unknown as { runTagType: (s: string) => string };
      expect(vm.runTagType('indeterminate')).not.toBe('danger');
      expect(vm.runTagType('failed')).toBe('danger');
      expect(vm.runTagType('success')).toBe('success');
      // Still distinct from a run that is merely in flight.
      expect(vm.runTagType('indeterminate')).not.toBe(vm.runTagType('running'));
    });

    describe('runErrorText precedence', () => {
      const vm = () => withToken().vm as unknown as { runErrorText: (r: unknown) => string };

      it('prefers the localized code over server prose', () => {
        // The old order returned error_message first, so this English sentence
        // permanently shadowed billing_gate_failed's 18 translations.
        expect(
          vm().runErrorText({
            error_code: 'billing_gate_failed',
            error_message: 'Gateway auth failed (invalid token or zero balance)'
          })
        ).toBe('Billing authorization failed');
      });

      it('still shows raw exception text when the code has no translation', () => {
        expect(vm().runErrorText({ error_code: 'some_unmapped_code', error_message: 'ECONNRESET at upstream' })).toBe(
          'ECONNRESET at upstream'
        );
      });

      it('humanizes an untranslated code when there is no message', () => {
        expect(vm().runErrorText({ error_code: 'some_unmapped_code' })).toBe('some unmapped code');
      });

      it('returns empty when there is nothing at all', () => {
        expect(vm().runErrorText({})).toBe('');
      });
    });
  });

  describe('polling pending runs', () => {
    const listAllRuns = () => vi.spyOn(scheduledTasksOperator, 'listAllRuns');
    const listRuns = () => vi.spyOn(scheduledTasksOperator, 'listRuns');

    // Prevent real XHR from loadTasks() leaking into subsequent tests.
    beforeEach(() => {
      vi.spyOn(scheduledTasksOperator, 'listTasks').mockResolvedValue([]);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    const pending: IScheduledRun = { id: 'r1', task_id: 't1', status: 'running', scheduled_at: 0 };
    const settled: IScheduledRun = {
      id: 'r1',
      task_id: 't1',
      status: 'success',
      scheduled_at: 0,
      conversation_id: 'conv-1'
    };

    // Keep a `scheduled_at: 0` run inside the 55-min give-up window.
    const freshClock = () => {
      vi.useFakeTimers();
      vi.setSystemTime(60_000);
    };

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

    type Vm = {
      switchTab: (t: 'tasks' | 'runs') => void;
      selectTask: (t: IScheduledTask) => Promise<void>;
      onVisibilityChange: () => void;
      allRuns: IScheduledRun[];
      runs: IScheduledRun[];
      allRunsLoading: boolean;
      runsLoading: boolean;
      showRunHistory: boolean;
      selectedTask: IScheduledTask | null;
      runPollTimer: ReturnType<typeof setInterval> | null;
      runPollFailures: number;
      runPollInFlight: boolean;
      onStatusFilter: (s: string) => void;
    };

    const enterRunsTab = async (wrapper: ReturnType<typeof withToken>) => {
      const vm = wrapper.vm as unknown as Vm;
      vm.switchTab('runs');
      await flushPromises();
      return vm;
    };

    /** jsdom's `document.hidden` is a read-only getter; override it for the test. */
    const setHidden = (hidden: boolean) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    };
    afterEach(() => setHidden(false));

    it('polls while a run is pending and stops once every row is terminal', async () => {
      freshClock();
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockResolvedValue({ items: [settled], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      // A pending row on screen arms the timer.
      await vi.advanceTimersByTimeAsync(12_000);
      expect(spy).toHaveBeenCalledTimes(2);
      // The whole point: the row settles and becomes clickable on its own.
      expect(vm.allRuns[0].status).toBe('success');
      expect(vm.allRuns[0].conversation_id).toBe('conv-1');

      // Now that the row is terminal the timer must be gone.
      await vi.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('never polls when every row is already terminal', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [settled], count: 1 });

      const wrapper = withToken();
      await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('gives up on a pending run too old for the worker reaper to settle', async () => {
      vi.useFakeTimers();
      // scheduled_at 0 + now 2h — past the 55-min window, so the reaper can no
      // longer transition this row and polling it would never end.
      vi.setSystemTime(2 * 60 * 60 * 1000);
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('stops polling the moment the user leaves the runs tab', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(vm.runPollTimer).not.toBeNull();

      vm.switchTab('tasks');
      // Assert the timer is disarmed synchronously. Checking only the request
      // count would also pass on an implementation that leaves the timer
      // running and merely no-ops inside the tick.
      expect(vm.runPollTimer).toBeNull();

      await vi.advanceTimersByTimeAsync(12_000 * 3);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('disarms the timer if a tick ever fires off the runs tab', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      expect(vm.runPollTimer).not.toBeNull();

      // Leave the tab without going through `switchTab` — the backstop inside
      // the tick is what has to catch this.
      await wrapper.setData({ activeTab: 'tasks' });
      await vi.advanceTimersByTimeAsync(12_000);

      expect(vm.runPollTimer).toBeNull();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('stops polling once the component unmounts', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      wrapper.unmount();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('removes its visibility listener on unmount', async () => {
      freshClock();
      const remove = vi.spyOn(document, 'removeEventListener');
      const wrapper = withToken();
      await flushPromises();

      wrapper.unmount();
      expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('refreshes the drawer, not the feed, while it is open on a task', async () => {
      freshClock();
      const feedSpy = listAllRuns().mockResolvedValue({ items: [], count: 0 });
      const runsSpy = listRuns().mockResolvedValue([pending]);

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      await vm.selectTask(editedTask);
      await flushPromises();
      expect(runsSpy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(12_000);
      expect(runsSpy).toHaveBeenCalledTimes(2);
      // The drawer sits above the feed, so the feed must stay untouched.
      expect(feedSpy).not.toHaveBeenCalled();
    });

    it('stops polling and drops the task when the drawer closes', async () => {
      freshClock();
      const feedSpy = listAllRuns().mockResolvedValue({ items: [], count: 0 });
      const runsSpy = listRuns().mockResolvedValue([pending]);

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      await vm.selectTask(editedTask);
      await flushPromises();
      expect(runsSpy).toHaveBeenCalledTimes(1);

      // Close the way `v-model` does — no `@closed` transition event, which a
      // stubbed or transition-less drawer never emits.
      await wrapper.setData({ showRunHistory: false });
      await flushPromises();
      expect(vm.selectedTask).toBeNull();

      await vi.advanceTimersByTimeAsync(60_000);
      expect(runsSpy).toHaveBeenCalledTimes(1);
      expect(feedSpy).not.toHaveBeenCalled();
    });

    it('keeps rows visible, shows no skeleton and stays silent on a failed poll', async () => {
      freshClock();
      const toast = vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockRejectedValue(new Error('network blip'));

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      toast.mockClear();

      let sawSkeleton = false;
      const stopWatch = wrapper.vm.$watch('allRunsLoading', (v: boolean) => {
        if (v) sawSkeleton = true;
      });
      await vi.advanceTimersByTimeAsync(12_000);
      stopWatch();

      expect(spy).toHaveBeenCalledTimes(2);
      // A background refresh must not blank the list, flash the skeleton, or
      // toast at a user who never asked for the request.
      expect(vm.allRuns.map((r) => r.id)).toEqual(['r1']);
      expect(sawSkeleton).toBe(false);
      expect(toast).not.toHaveBeenCalled();
    });

    it('shows the skeleton and reports the error on a deliberate load', async () => {
      freshClock();
      const toast = vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never);
      listAllRuns().mockRejectedValue(new Error('network blip'));

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;

      let sawSkeleton = false;
      const stopWatch = wrapper.vm.$watch('allRunsLoading', (v: boolean) => {
        if (v) sawSkeleton = true;
      });
      vm.switchTab('runs');
      await flushPromises();
      stopWatch();

      expect(sawSkeleton).toBe(true);
      expect(toast).toHaveBeenCalledTimes(1);
    });

    it('gives up after repeated failures instead of retrying an expired token forever', async () => {
      freshClock();
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockRejectedValue(new Error('401'));

      const wrapper = withToken();
      await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      // 3 consecutive silent failures trip the breaker; the pending row stays
      // on screen, so without one the timer would never disarm.
      await vi.advanceTimersByTimeAsync(12_000 * 10);
      expect(spy).toHaveBeenCalledTimes(1 + 3);
    });

    it('skips a tick rather than stacking a second request behind a slow poll', async () => {
      freshClock();
      let releaseSlow: (v: { items: IScheduledRun[]; count: number }) => void = () => undefined;
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockImplementationOnce(() => new Promise((resolve) => (releaseSlow = resolve)));

      const wrapper = withToken();
      await enterRunsTab(wrapper);

      // First poll fires and hangs.
      await vi.advanceTimersByTimeAsync(12_000);
      expect(spy).toHaveBeenCalledTimes(2);

      // Several more ticks elapse while it is still in flight — a silent poll
      // never sets `allRunsLoading`, so only the dedicated in-flight guard can
      // stop these from stacking up.
      await vi.advanceTimersByTimeAsync(12_000 * 3);
      expect(spy).toHaveBeenCalledTimes(2);

      releaseSlow({ items: [settled], count: 1 });
      await flushPromises();
    });

    it('drops a stale drawer response that lands after the user switched tasks', async () => {
      freshClock();
      const otherTask = { ...editedTask, id: 'task-2', name: 'Second task' };
      let releaseFirst: (v: IScheduledRun[]) => void = () => undefined;
      const runsSpy = listRuns()
        .mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
        .mockResolvedValue([{ ...pending, id: 'r2', task_id: 'task-2' }]);

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      void vm.selectTask(editedTask);
      await flushPromises();

      // Move to another task while the first request is still in flight, then
      // let the stale one land.
      void vm.selectTask(otherTask);
      await flushPromises();
      releaseFirst([{ ...pending, id: 'r1', task_id: 'task-1' }]);
      await flushPromises();

      expect(runsSpy).toHaveBeenCalledTimes(2);
      // The stale response must neither overwrite task 2's rows nor clear the
      // skeleton belonging to the request that superseded it.
      expect(vm.runs.map((r) => r.id)).toEqual(['r2']);
      expect(vm.runsLoading).toBe(false);
    });

    it('ignores an out-of-order drawer response for the task still on screen', async () => {
      freshClock();
      let releaseOld: (v: IScheduledRun[]) => void = () => undefined;
      listRuns()
        .mockImplementationOnce(() => new Promise((resolve) => (releaseOld = resolve)))
        .mockResolvedValue([settled]);

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      void vm.selectTask(editedTask);
      await flushPromises();

      // A second load for the SAME task overtakes the first and settles the row.
      await vm.selectTask(editedTask);
      await flushPromises();
      expect(vm.runs.map((r) => r.status)).toEqual(['success']);

      // The older response now lands. Task id and drawer state both still
      // match, so only the request-ordering guard can reject it — without one
      // the row would flip back to 运行中 and re-arm the timer.
      releaseOld([pending]);
      await flushPromises();

      expect(vm.runs.map((r) => r.status)).toEqual(['success']);
      expect(vm.runPollTimer).toBeNull();
    });

    it('keeps the drawer skeleton off during a background refresh', async () => {
      freshClock();
      const runsSpy = listRuns().mockResolvedValue([pending]);

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      await vm.selectTask(editedTask);
      await flushPromises();
      expect(runsSpy).toHaveBeenCalledTimes(1);

      let sawSkeleton = false;
      const stopWatch = wrapper.vm.$watch('runsLoading', (v: boolean) => {
        if (v) sawSkeleton = true;
      });
      await vi.advanceTimersByTimeAsync(12_000);
      stopWatch();

      expect(runsSpy).toHaveBeenCalledTimes(2);
      expect(sawSkeleton).toBe(false);
    });

    it('recovers polling after the breaker trips once the user acts', async () => {
      freshClock();
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockRejectedValueOnce(new Error('500'))
        .mockRejectedValueOnce(new Error('500'))
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      await vi.advanceTimersByTimeAsync(12_000 * 5);
      expect(vm.runPollFailures).toBe(3);
      expect(vm.runPollTimer).toBeNull();

      // A deliberate action is the user retrying — polling must come back.
      vm.onStatusFilter('failed');
      await flushPromises();
      expect(vm.runPollFailures).toBe(0);
      expect(vm.runPollTimer).not.toBeNull();

      const afterRetry = spy.mock.calls.length;
      await vi.advanceTimersByTimeAsync(12_000);
      expect(spy.mock.calls.length).toBeGreaterThan(afterRetry);
    });

    it('resets the shared breaker when the drawer closes, freeing the feed', async () => {
      freshClock();
      const feedSpy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });
      listRuns().mockResolvedValueOnce([pending]).mockRejectedValue(new Error('500 on this one task'));

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      await enterRunsTab(wrapper);
      await vm.selectTask(editedTask);
      await flushPromises();

      // This one task's endpoint is broken; the breaker trips.
      await vi.advanceTimersByTimeAsync(12_000 * 5);
      expect(vm.runPollFailures).toBe(3);

      // The feed is healthy — closing the drawer must not leave it stuck.
      const beforeClose = feedSpy.mock.calls.length;
      await wrapper.setData({ showRunHistory: false });
      await flushPromises();
      expect(vm.runPollFailures).toBe(0);
      expect(vm.runPollTimer).not.toBeNull();

      await vi.advanceTimersByTimeAsync(12_000);
      expect(feedSpy.mock.calls.length).toBeGreaterThan(beforeClose);
    });

    it('resets the breaker on a successful refresh, not just on user action', async () => {
      freshClock();
      listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        .mockRejectedValueOnce(new Error('blip'))
        .mockRejectedValueOnce(new Error('blip'))
        .mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);

      await vi.advanceTimersByTimeAsync(12_000 * 2);
      expect(vm.runPollFailures).toBe(2);

      // A transient blip must not accumulate toward the trip once it clears.
      await vi.advanceTimersByTimeAsync(12_000);
      expect(vm.runPollFailures).toBe(0);
      expect(vm.runPollTimer).not.toBeNull();
    });

    it('stops polling instead of spinning once the session token is gone', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      // A reactive store so clearing the credential actually invalidates the
      // `token` computed, the way a real logout does.
      const state = reactive({
        chat: { credential: { token: 'tok' } as { token: string } | null },
        site: { features: {} }
      });
      const wrapper = shallowMount(ScheduledTasks, {
        global: {
          stubs: {
            ElCard: { template: '<div><slot /></div>' },
            ElDrawer: { template: '<div><slot /></div>' },
            ElTag: { template: '<span><slot /></span>' }
          },
          mocks: {
            $t: (key: string) => errorMessages[key] ?? key,
            $te: (key: string) => key in errorMessages,
            $store: { state }
          }
        }
      });
      const vm = await enterRunsTab(wrapper);
      expect(vm.runPollTimer).not.toBeNull();

      // Logged out elsewhere. Every load would now return before its `try`,
      // so nothing downstream could disarm the timer or trip the breaker.
      state.chat.credential = null;
      await vi.advanceTimersByTimeAsync(12_000);

      expect(vm.runPollTimer).toBeNull();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clears a wedged in-flight guard when the tab regains focus', async () => {
      freshClock();
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        // Never settles — the timeout is the first line of defence, this is
        // the second: a wedged guard must not silently kill polling forever.
        .mockImplementationOnce(() => new Promise(() => undefined))
        .mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      await vi.advanceTimersByTimeAsync(12_000);
      expect(vm.runPollInFlight).toBe(true);

      // Ticks are now no-ops — the guard never clears on its own.
      await vi.advanceTimersByTimeAsync(12_000 * 5);
      expect(spy).toHaveBeenCalledTimes(2);

      setHidden(true);
      vm.onVisibilityChange();
      setHidden(false);
      vm.onVisibilityChange();
      await flushPromises();

      expect(vm.runPollInFlight).toBe(false);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(vm.runPollTimer).not.toBeNull();
    });

    it('holds the skeleton for the newer drawer request when a stale one lands', async () => {
      freshClock();
      const otherTask = { ...editedTask, id: 'task-2', name: 'Second task' };
      let releaseFirst: (v: IScheduledRun[]) => void = () => undefined;
      let releaseSecond: (v: IScheduledRun[]) => void = () => undefined;
      listRuns()
        .mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
        .mockImplementationOnce(() => new Promise((resolve) => (releaseSecond = resolve)));

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      void vm.selectTask(editedTask);
      await flushPromises();
      void vm.selectTask(otherTask);
      await flushPromises();
      expect(vm.runsLoading).toBe(true);

      // The stale response lands while the newer request is STILL in flight.
      // Only a guarded `finally` keeps the skeleton up for the live request.
      releaseFirst([pending]);
      await flushPromises();
      expect(vm.runsLoading).toBe(true);
      expect(vm.runs).toEqual([]);

      releaseSecond([settled]);
      await flushPromises();
      expect(vm.runsLoading).toBe(false);
      expect(vm.runs.map((r) => r.id)).toEqual(['r1']);
    });

    it('abandons an in-flight drawer request when the drawer closes', async () => {
      freshClock();
      listAllRuns().mockResolvedValue({ items: [], count: 0 });
      let release: (v: IScheduledRun[]) => void = () => undefined;
      listRuns().mockImplementationOnce(() => new Promise((resolve) => (release = resolve)));

      const wrapper = withToken();
      const vm = wrapper.vm as unknown as Vm;
      void vm.selectTask(editedTask);
      await flushPromises();

      await wrapper.setData({ showRunHistory: false });
      await flushPromises();
      // Reopening on the same task is what makes the id bump load-bearing:
      // without it the abandoned response still matches task + drawer state.
      await vm.selectTask(editedTask);
      await flushPromises();

      // The first response lands last; its rows belong to a request the user
      // dismissed and must not be adopted by the reopened drawer.
      release([pending]);
      await flushPromises();
      expect(vm.runs).toEqual([]);
      expect(vm.runsLoading).toBe(false);
    });

    it('does not let an abandoned poll unlock the guard for its successor', async () => {
      freshClock();
      let releaseStalled: (v: { items: IScheduledRun[]; count: number }) => void = () => undefined;
      const spy = listAllRuns()
        .mockResolvedValueOnce({ items: [pending], count: 1 })
        // Poll A stalls, gets abandoned on refocus, and settles later.
        .mockImplementationOnce(() => new Promise((resolve) => (releaseStalled = resolve)))
        .mockImplementationOnce(() => new Promise(() => undefined))
        .mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      await vi.advanceTimersByTimeAsync(12_000);
      expect(spy).toHaveBeenCalledTimes(2);

      // Refocus force-clears the guard and starts poll B, so A and B overlap.
      setHidden(true);
      vm.onVisibilityChange();
      setHidden(false);
      vm.onVisibilityChange();
      await flushPromises();
      expect(spy).toHaveBeenCalledTimes(3);

      // A settles while B is still in flight. Its `finally` must not release
      // the guard, or the next tick would stack a third request on top of B.
      releaseStalled({ items: [pending], count: 1 });
      await flushPromises();
      expect(vm.runPollInFlight).toBe(true);

      await vi.advanceTimersByTimeAsync(12_000 * 2);
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('pauses in a background tab and refreshes once on return', async () => {
      freshClock();
      const spy = listAllRuns().mockResolvedValue({ items: [pending], count: 1 });

      const wrapper = withToken();
      const vm = await enterRunsTab(wrapper);
      expect(spy).toHaveBeenCalledTimes(1);

      setHidden(true);
      vm.onVisibilityChange();
      await vi.advanceTimersByTimeAsync(12_000 * 3);
      expect(spy).toHaveBeenCalledTimes(1);

      setHidden(false);
      vm.onVisibilityChange();
      // One catch-up request, issued synchronously so the user isn't left
      // waiting out a full interval on rows that went stale while away.
      expect(spy).toHaveBeenCalledTimes(2);
      await flushPromises();
      expect(spy).toHaveBeenCalledTimes(2);

      // And the timer is running again.
      await vi.advanceTimersByTimeAsync(12_000);
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});
