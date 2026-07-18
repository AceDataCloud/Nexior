// @vitest-environment jsdom
import { mount, shallowMount } from '@vue/test-utils';
import { ElRadioGroup } from 'element-plus';
import { describe, expect, it } from 'vitest';
import ScenarioField from './ScenarioField.vue';
import ScenarioPanel from './ScenarioPanel.vue';
import ScenarioSection from './ScenarioSection.vue';
import ScenarioSegmented from './ScenarioSegmented.vue';

describe('scenario primitives', () => {
  it('keeps panel content and footer in separate layout regions', () => {
    const wrapper = shallowMount(ScenarioPanel, {
      slots: { default: 'fields', footer: 'generate' }
    });

    expect(wrapper.find('.scenario-panel__body').text()).toBe('fields');
    expect(wrapper.text()).toContain('generate');
    expect(wrapper.classes()).not.toContain('scenario-panel--without-footer');
  });

  it('lets the scrolling body consume the safe area when there is no footer', () => {
    const wrapper = shallowMount(ScenarioPanel, { slots: { default: 'fields' } });

    expect(wrapper.classes()).toContain('scenario-panel--without-footer');
  });

  it('associates labels and exposes validation errors', () => {
    const wrapper = shallowMount(ScenarioField, {
      props: { label: 'Prompt', forId: 'prompt', required: true, error: 'Prompt is required' },
      global: { stubs: { InfoIcon: true } },
      slots: { default: '<textarea id="prompt" />' }
    });

    expect(wrapper.get('label').attributes('for')).toBe('prompt');
    expect(wrapper.get('[role="alert"]').text()).toBe('Prompt is required');
  });

  it('only labels a section when it renders a title', () => {
    const titled = shallowMount(ScenarioSection, { props: { title: 'Advanced' } });
    const untitled = shallowMount(ScenarioSection);

    expect(titled.attributes('aria-labelledby')).toBe(titled.get('h2').attributes('id'));
    expect(untitled.attributes('aria-labelledby')).toBeUndefined();
  });

  it('emits the selected short option', async () => {
    const wrapper = mount(ScenarioSegmented, {
      props: {
        modelValue: 'generate',
        ariaLabel: 'Action',
        options: [
          { label: 'Generate', value: 'generate' },
          { label: 'Edit', value: 'edit' }
        ]
      }
    });

    wrapper.getComponent(ElRadioGroup).vm.$emit('update:modelValue', 'edit');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['edit']);
  });
});
