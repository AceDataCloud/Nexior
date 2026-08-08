// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { scheduledTasksOperator } from '@/operators/scheduledTasks';
import ScheduledTemplateWizard from './ScheduledTemplateWizard.vue';

const template = {
  id: 'daily-ai-promo-pack',
  version: 1,
  title: 'Daily AI promotion pack',
  summary: 'Three formats',
  description: 'Description',
  categories: ['marketing'],
  tags: [],
  featured: true,
  form_schema: [
    { key: 'topic', type: 'text' as const, label: 'Topic', required: true },
    { key: 'audience', type: 'text' as const, label: 'Audience', required: true }
  ],
  requirements: { skills: [], mcp_servers: [], connections: [], local_tools: [] },
  defaults: { model: 'gpt-5.6-sol', schedule: { type: 'cron' as const, cron: '0 9 * * *', tz: 'UTC' }, max_turns: 50 },
  test_strategy: { mode: 'preview_only' as const },
  available: true,
  missing_connections: []
};

const disabledTask = {
  id: 'task-1',
  name: 'Template',
  state: 'disabled' as const,
  schedule: template.defaults.schedule,
  template: { model: 'gpt-5.6-sol', question: 'Preview' },
  run_count: 0,
  created_at: 1,
  updated_at: 1
};

const mountWizard = () =>
  shallowMount(ScheduledTemplateWizard, {
    props: { modelValue: true, token: 'tok' },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        BrowseConnectors: true,
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElSteps: { template: '<div><slot /></div>' },
        ElStep: { props: ['title'], template: '<span class="step-title">{{ title }}</span>' }
      }
    }
  });

describe('ScheduledTemplateWizard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders only the choose, configure, and connect steps', () => {
    const wrapper = mountWizard();
    const titles = wrapper.findAll('.step-title').map((step) => step.text());
    expect(titles).toEqual([
      'chat.scheduledTemplates.step.choose',
      'chat.scheduledTemplates.step.configure',
      'chat.scheduledTemplates.step.connect'
    ]);
  });

  it('does not bind remote MCP connections as skill accounts', () => {
    const mcpTemplate = {
      ...template,
      requirements: {
        skills: [],
        mcp_servers: ['AceDataCloud'],
        connections: ['acedatacloud/acedatacloud'],
        local_tools: []
      },
      connection_accounts: {
        'acedatacloud/acedatacloud': [
          {
            connection_id: 'mcp-1',
            connector_identifier: 'acedatacloud/acedatacloud',
            label: 'AceDataCloud',
            is_default: true,
            account_name: 'AceDataCloud',
            execution_type: 'remote_mcp',
            supports_task_binding: false
          }
        ]
      }
    };
    const wrapper = mountWizard();
    const vm = wrapper.vm as unknown as {
      selectTemplate: (value: typeof mcpTemplate) => void;
      connectionReady: (identifier: string) => boolean;
      bindings: () => unknown[];
    };
    vm.selectTemplate(mcpTemplate);
    expect(vm.connectionReady('acedatacloud/acedatacloud')).toBe(true);
    expect(vm.bindings()).toEqual([]);
  });

  it('shows the backend message and keeps the wizard open when creation fails', async () => {
    vi.spyOn(scheduledTasksOperator, 'instantiateTemplate').mockRejectedValue({
      response: { data: { message: 'remote MCP connectors cannot be account-bound' } }
    });
    const error = vi.spyOn(ElMessage, 'error');
    const wrapper = mountWizard();
    const vm = wrapper.vm as unknown as {
      selectTemplate: (value: typeof template) => void;
      inputs: Record<string, string>;
      step: number;
      visible: boolean;
      createTask: () => Promise<void>;
    };
    vm.selectTemplate(template);
    vm.inputs = { topic: 'AI', audience: 'developers' };
    vm.step = 2;
    await vm.createTask();
    expect(error).toHaveBeenCalledWith('remote MCP connectors cannot be account-bound');
    expect(vm.visible).toBe(true);
    expect(wrapper.emitted('created')).toBeUndefined();
  });

  it('requires declared inputs without adding growth-specific state', () => {
    const wrapper = mountWizard();
    const vm = wrapper.vm as unknown as {
      selectTemplate: (value: typeof template) => void;
      inputs: Record<string, string>;
      step: number;
      canContinue: boolean;
    };
    vm.selectTemplate(template);
    vm.step = 1;
    expect(Object.keys(wrapper.vm)).not.toContain('referral' + 'Enabled');
    expect(vm.canContinue).toBe(false);
    vm.inputs = { topic: 'AI', audience: 'developers' };
    expect(vm.canContinue).toBe(true);
  });

  it('creates a disabled task without previewing, running, or enabling it', async () => {
    const instantiate = vi.spyOn(scheduledTasksOperator, 'instantiateTemplate').mockResolvedValue(disabledTask);
    const preview = vi.spyOn(scheduledTasksOperator, 'previewTemplate');
    const trigger = vi.spyOn(scheduledTasksOperator, 'triggerTask');
    const listRuns = vi.spyOn(scheduledTasksOperator, 'listRuns');
    const enable = vi.spyOn(scheduledTasksOperator, 'enableTemplateTask');
    const wrapper = mountWizard();
    const vm = wrapper.vm as unknown as {
      selectTemplate: (value: typeof template) => void;
      inputs: Record<string, string>;
      step: number;
      visible: boolean;
      selected: typeof template | null;
      createTask: () => Promise<void>;
    };
    vm.selectTemplate(template);
    vm.inputs = { topic: 'AI', audience: 'developers' };
    vm.step = 2;

    await vm.createTask();

    expect(instantiate).toHaveBeenCalledWith('tok', {
      template_id: template.id,
      version: template.version,
      inputs: { topic: 'AI', audience: 'developers' },
      schedule: { type: 'cron', cron: '00 09 * * *', tz: expect.any(String) },
      connection_bindings: []
    });
    expect(preview).not.toHaveBeenCalled();
    expect(trigger).not.toHaveBeenCalled();
    expect(listRuns).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
    expect(wrapper.emitted('created')?.[0]).toEqual([disabledTask]);
    expect(vm.visible).toBe(false);
    expect(vm.step).toBe(0);
    expect(vm.selected).toBeNull();
  });
});
