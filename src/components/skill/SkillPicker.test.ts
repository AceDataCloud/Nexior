// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), confirm: vi.fn(), success: vi.fn() }));
vi.mock('@/operators/skill', () => ({ skillOperator: { list: mocks.list, remove: mocks.remove } }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: { success: mocks.success }, ElMessageBox: { confirm: mocks.confirm } };
});

import SkillPicker from './SkillPicker.vue';

const skills = [
  { id: 'site-1', owner_scope: 'site', enabled: true, name: 'Support', slug: 'support', description: 'Help' },
  { id: 'personal-1', owner_scope: 'personal', enabled: true, name: 'Private', slug: 'private', description: 'Mine' },
  { id: 'platform-1', owner_scope: 'platform', enabled: false, name: 'PDF', slug: 'pdf', description: 'Docs' }
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ data: skills });
  mocks.confirm.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue({});
});

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

  it('emits manage instead of nesting another dialog', async () => {
    const wrapper = shallowMount(SkillPicker, {
      props: { modelValue: [], siteId: 'site-id' },
      global: { mocks: { $t: (key: string) => key } }
    });
    await flushPromises();
    (wrapper.vm as any).$emit('manage');
    expect(wrapper.emitted('manage')).toHaveLength(1);
  });
  it('deletes only Site-owned Skills and removes their binding', async () => {
    const wrapper = shallowMount(SkillPicker, {
      props: { modelValue: [{ id: 'site-1' }], siteId: 'site-id' },
      global: { mocks: { $t: (key: string) => key } }
    });
    await flushPromises();
    await (wrapper.vm as any).removeSkill(skills[0]);
    expect(mocks.remove).toHaveBeenCalledWith('site-1', 'site-id');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });
});
