// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/operators/skill', () => ({ skillOperator: { list: mocks.list } }));

import SkillPicker from './SkillPicker.vue';

const skills = [
  { id: 'site-1', owner_scope: 'site', enabled: true, name: 'Support', slug: 'support', description: 'Help' },
  { id: 'personal-1', owner_scope: 'personal', enabled: true, name: 'Private', slug: 'private', description: 'Mine' },
  { id: 'platform-1', owner_scope: 'platform', enabled: false, name: 'PDF', slug: 'pdf', description: 'Docs' }
];

beforeEach(() => mocks.list.mockResolvedValue({ data: skills }));

describe('SkillPicker', () => {
  it('shows Site/platform Skills, excludes personal Skills, and emits object bindings', async () => {
    const wrapper = shallowMount(SkillPicker, {
      props: { modelValue: [], siteId: 'site-id' },
      global: { mocks: { $t: (key: string) => key } }
    });
    await flushPromises();
    const vm = wrapper.vm as any;
    expect(mocks.list).toHaveBeenCalledWith('site-id');
    expect(vm.filteredSkills.map((skill: any) => skill.id)).toEqual(['site-1', 'platform-1']);
    vm.toggle('site-1');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[{ id: 'site-1' }]]);
  });

  it('refreshes and selects a newly created Site Skill', async () => {
    const wrapper = shallowMount(SkillPicker, {
      props: { modelValue: [], siteId: 'site-id' },
      global: { mocks: { $t: (key: string) => key } }
    });
    await flushPromises();
    await (wrapper.vm as any).onCreated('site-1');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[{ id: 'site-1' }]]);
  });
});
