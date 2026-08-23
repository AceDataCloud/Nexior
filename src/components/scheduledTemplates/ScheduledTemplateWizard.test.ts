// @vitest-environment jsdom
import { shallowMount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduledTasksOperator } from '@/operators/scheduledTasks';
import ScheduledTemplateWizard from './ScheduledTemplateWizard.vue';

const template = {
  id: 'weekly-learning-plan',
  version: 2,
  title: 'Weekly learning plan',
  summary: 'A safe plan',
  description: 'Description',
  categories: ['personal'],
  tags: [],
  featured: true,
  form_schema: [{ key: 'topic', type: 'text' as const, label: 'Topic', required: true }],
  requirements: { skills: [], mcp_servers: [], connections: [], local_tools: [] },
  dependencies: {
    required: { skills: [], mcp_servers: [], connections: [], local_tools: [] },
    optional: { skills: [], mcp_servers: [], connections: [], local_tools: [] }
  },
  defaults: { model: 'gpt-5.6-sol', schedule: { type: 'cron' as const, cron: '0 7 * * 1', tz: 'UTC' }, max_turns: 50 },
  test_strategy: { mode: 'preview_only' as const },
  available: true,
  missing_connections: [],
  risk: { level: 'low' as const, unattended_eligible: true, reasons: [] },
  side_effects: [],
  budget: {
    unit: 'credits' as const,
    estimated_upper_bound: 3,
    basis: 'catalog_conservative_v1',
    max_tool_actions: 12,
    max_paid_actions: 0,
    exact_charge_available: false as const
  }
};
const task = {
  id: 'task-1',
  name: 'Plan',
  state: 'disabled' as const,
  schedule: template.defaults.schedule,
  template: { model: 'gpt-5.6-sol', question: 'Plan' },
  run_count: 0,
  created_at: 1,
  updated_at: 1
};
const terminalRun = {
  id: 'manual-1',
  task_id: task.id,
  status: 'success' as const,
  scheduled_at: Math.floor(Date.now() / 1000),
  conversation_id: 'c1'
};

function mountWizard() {
  return shallowMount(ScheduledTemplateWizard, {
    props: { modelValue: true, token: 'tok' },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        BrowseConnectors: true,
        ElDialog: { template: '<div><slot/><slot name="footer"/></div>' },
        ElSteps: { template: '<div><slot/></div>' },
        ElStep: { props: ['title'], template: '<span class="step-title">{{ title }}</span>' }
      }
    }
  });
}

describe('ScheduledTemplateWizard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the complete five-step lifecycle', () => {
    const titles = mountWizard()
      .findAll('.step-title')
      .map((node) => node.text());
    expect(titles).toEqual([
      'chat.scheduledTemplates.step.choose',
      'chat.scheduledTemplates.step.configure',
      'chat.scheduledTemplates.step.connect',
      'chat.scheduledTemplates.step.test',
      'chat.scheduledTemplates.step.enable'
    ]);
  });

  it('preserves the weekly cadence when editing only wall-clock time', () => {
    const wrapper = mountWizard();
    const vm = wrapper.vm as any;
    vm.selectTemplate(template);
    vm.scheduleTime = '08:25';
    expect(vm.buildSchedule()).toMatchObject({ type: 'cron', cron: '25 08 * * 1' });
  });

  it('instantiates one disabled task and polls the exact returned run id', async () => {
    vi.spyOn(scheduledTasksOperator, 'instantiateTemplate').mockResolvedValue(task as any);
    vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue({ run_id: 'manual-1' });
    const retrieve = vi.spyOn(scheduledTasksOperator, 'retrieveRun').mockResolvedValue(terminalRun as any);
    const wrapper = mountWizard();
    const vm = wrapper.vm as any;
    vm.selectTemplate(template);
    vm.inputs = { topic: 'TypeScript' };
    vm.step = 3;
    await vm.startTest();
    expect(scheduledTasksOperator.instantiateTemplate).toHaveBeenCalledTimes(1);
    expect(retrieve).toHaveBeenCalledWith('tok', task.id, 'manual-1');
    expect(wrapper.emitted('created')?.[0]).toEqual([task]);
    expect(vm.run.status).toBe('success');
    await vm.retryTest();
    expect(scheduledTasksOperator.instantiateTemplate).toHaveBeenCalledTimes(1);
    expect(scheduledTasksOperator.triggerTask).toHaveBeenCalledTimes(2);
  });

  it('fails closed when activation readiness is unavailable', async () => {
    vi.spyOn(scheduledTasksOperator, 'activationStatus').mockRejectedValue({ response: { status: 400 } });
    const wrapper = mountWizard();
    const vm = wrapper.vm as any;
    vm.selectTemplate(template);
    vm.task = task;
    vm.run = terminalRun;
    vm.step = 3;
    await vm.prepareEnable();
    expect(vm.step).toBe(4);
    expect(vm.backendBlocked).toBe(true);
    expect(vm.activation).toBeNull();
  });

  it('enables only after the backend returns ready for the current config', async () => {
    vi.spyOn(scheduledTasksOperator, 'activationStatus').mockResolvedValue({
      ready: true,
      blockers: [],
      evidence: { mode: 'run_success', satisfied: true, artifacts: [] },
      risk: template.risk,
      side_effects: [],
      budget: template.budget
    } as any);
    const enable = vi
      .spyOn(scheduledTasksOperator, 'enableTemplateTask')
      .mockResolvedValue({ ...task, state: 'enabled' } as any);
    const wrapper = mountWizard();
    const vm = wrapper.vm as any;
    vm.selectTemplate(template);
    vm.task = task;
    vm.run = terminalRun;
    await vm.prepareEnable();
    await vm.enableTask();
    await flushPromises();
    expect(enable).toHaveBeenCalledWith('tok', task.id);
    expect(wrapper.emitted('created')?.at(-1)).toEqual([{ ...task, state: 'enabled' }]);
  });

  it('stops polling when the dialog closes', async () => {
    vi.useFakeTimers();
    const wrapper = mountWizard();
    const vm = wrapper.vm as any;
    vm.pollTimer = setTimeout(() => undefined, 1000);
    const before = vm.pollGeneration;
    await wrapper.setData({ visible: false });
    await flushPromises();
    expect(vm.pollTimer).toBeNull();
    expect(vm.pollGeneration).toBeGreaterThan(before);
  });
});
