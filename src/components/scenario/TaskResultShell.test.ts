// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskResultShell from './TaskResultShell.vue';

const baseProps = {
  state: 'succeeded' as const,
  statusLabel: 'Completed',
  referencesLabel: 'References',
  outputLabel: 'Output',
  outputUnavailableLabel: 'Output unavailable',
  legacyLabel: 'Input details were not saved for this legacy task'
};

describe('TaskResultShell', () => {
  it('renders complete intent, references, output, actions and metadata', () => {
    const wrapper = shallowMount(TaskResultShell, {
      props: {
        ...baseProps,
        metadata: [{ key: 'task', label: 'Task ID', value: 'task-123' }]
      },
      slots: {
        intent: 'A city at night',
        references: 'reference.png',
        output: 'result.mp4',
        actions: 'Download'
      }
    });

    expect(wrapper.text()).toContain('A city at night');
    expect(wrapper.text()).toContain('reference.png');
    expect(wrapper.text()).toContain('result.mp4');
    expect(wrapper.text()).toContain('task-123');
    expect(wrapper.get('.task-result__status').attributes('aria-live')).toBe('off');
  });

  it('omits empty references and renders an unavailable output placeholder', () => {
    const wrapper = shallowMount(TaskResultShell, { props: baseProps });

    expect(wrapper.find('.task-result__references').exists()).toBe(false);
    expect(wrapper.get('.task-result__placeholder').text()).toBe('Output unavailable');
  });

  it('renders an explicit legacy fallback when metadata is unavailable', () => {
    const wrapper = shallowMount(TaskResultShell, { props: { ...baseProps, legacy: true } });
    expect(wrapper.get('.task-result__legacy').text()).toBe(baseProps.legacyLabel);
    expect(wrapper.find('.task-result__metadata').exists()).toBe(false);
  });

  it('announces status changes only for active task surfaces', () => {
    const wrapper = shallowMount(TaskResultShell, { props: { ...baseProps, state: 'running', live: true } });
    expect(wrapper.get('.task-result__status').attributes('aria-live')).toBe('polite');
  });

  it('renders failed orphaned tasks with actionable reason and trace ID', () => {
    const wrapper = shallowMount(TaskResultShell, {
      props: {
        ...baseProps,
        state: 'failed',
        error: { title: 'Generation failed', reason: 'Reference expired', traceId: 'trace-123' }
      }
    });

    expect(wrapper.get('[role="alert"]').text()).toContain('Reference expired');
    expect(wrapper.get('code').text()).toBe('trace-123');
  });
});
