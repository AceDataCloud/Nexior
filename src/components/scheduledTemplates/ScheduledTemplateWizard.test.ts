// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

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

const mountWizard = () =>
  shallowMount(ScheduledTemplateWizard, {
    props: { modelValue: true, token: 'tok' },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { BrowseConnectors: true }
    }
  });

describe('ScheduledTemplateWizard', () => {
  it('requires declared inputs without adding growth-specific state', async () => {
    vi.spyOn(scheduledTasksOperator, 'listTemplates').mockResolvedValue({
      items: [template],
      categories: ['marketing']
    });
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

  it('creates disabled template task, triggers a test, then enables only after success', async () => {
    vi.spyOn(scheduledTasksOperator, 'listTemplates').mockResolvedValue({ items: [template], categories: [] });
    vi.spyOn(scheduledTasksOperator, 'previewTemplate').mockResolvedValue({ question: 'Preview' });
    vi.spyOn(scheduledTasksOperator, 'instantiateTemplate').mockResolvedValue({
      id: 'task-1',
      name: 'Template',
      state: 'disabled',
      schedule: template.defaults.schedule,
      template: { model: 'gpt-5.6-sol', question: 'Preview' },
      run_count: 0,
      created_at: 1,
      updated_at: 1
    });
    vi.spyOn(scheduledTasksOperator, 'triggerTask').mockResolvedValue({ run_id: 'manual-1' });
    vi.spyOn(scheduledTasksOperator, 'listRuns').mockResolvedValue([
      { id: 'manual-1', task_id: 'task-1', status: 'success', scheduled_at: 1 }
    ]);
    const enable = vi.spyOn(scheduledTasksOperator, 'enableTemplateTask').mockResolvedValue({
      id: 'task-1',
      name: 'Template',
      state: 'enabled',
      schedule: template.defaults.schedule,
      template: { model: 'gpt-5.6-sol', question: 'Preview' },
      run_count: 1,
      created_at: 1,
      updated_at: 2
    });
    const wrapper = mountWizard();
    const vm = wrapper.vm as unknown as {
      selectTemplate: (value: typeof template) => void;
      inputs: Record<string, string>;
      runTest: () => Promise<void>;
      enableTask: () => Promise<void>;
      testSucceeded: boolean;
    };
    vm.selectTemplate(template);
    vm.inputs = { topic: 'AI', audience: 'developers' };
    await vm.runTest();
    expect(vm.testSucceeded).toBe(true);
    await vm.enableTask();
    expect(enable).toHaveBeenCalledWith('tok', 'task-1');
  });
});
