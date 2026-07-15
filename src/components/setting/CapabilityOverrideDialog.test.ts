// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  confirm: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteCapabilityOverrideOperator: {
    create: mocks.create,
    update: mocks.update,
    delete: mocks.delete
  }
}));

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: { success: mocks.success, error: mocks.error, warning: mocks.warning },
    ElMessageBox: { confirm: mocks.confirm }
  };
});

import CapabilityOverrideDialog from './CapabilityOverrideDialog.vue';

const translate = (key: string) => key;

const mountDialog = (override: Record<string, unknown> | null = null) =>
  shallowMount(CapabilityOverrideDialog, {
    props: {
      modelValue: true,
      siteId: 'site-1',
      capability: 'chatgpt',
      defaultName: 'ChatGPT',
      defaultIcon: '/chatgpt.png',
      override
    },
    global: {
      mocks: { $t: translate },
      stubs: {
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: { template: '<div><slot name="suffix" /></div>' },
        ElButton: { template: '<button><slot /></button>' },
        AutoTranslateToggle: true,
        ImageCropper: true
      }
    }
  });

describe('CapabilityOverrideDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(undefined);
  });

  it('hydrates the source name and icon when first opened', async () => {
    const wrapper = mountDialog({
      id: 'override-1',
      display_name: 'English name',
      display_name_source: '源名称',
      icon_url: 'https://cdn.example.com/icon.png',
      auto_translated_fields: ['display_name']
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      displayName: string;
      iconUrl: string;
      autoTranslatedFields: string[];
    };
    expect(vm.displayName).toBe('源名称');
    expect(vm.iconUrl).toBe('https://cdn.example.com/icon.png');
    expect(vm.autoTranslatedFields).toEqual(['display_name']);
  });

  it('creates an override and stays open so translation can be enabled', async () => {
    mocks.create.mockResolvedValue({
      data: {
        id: 'override-1',
        display_name: 'My Assistant',
        display_name_source: 'My Assistant',
        icon_url: null,
        auto_translated_fields: []
      }
    });
    const wrapper = mountDialog();
    await wrapper.setData({ displayName: '  My Assistant  ' });

    await (wrapper.vm as unknown as { onSave: () => Promise<void> }).onSave();

    expect(mocks.create).toHaveBeenCalledWith({
      site: 'site-1',
      capability: 'chatgpt',
      display_name: 'My Assistant',
      icon_url: null
    });
    expect((wrapper.vm as unknown as { record: { id?: string } }).record.id).toBe('override-1');
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('updates an override and closes the dialog', async () => {
    mocks.update.mockResolvedValue({ data: { id: 'override-1', display_name: 'Updated', icon_url: null } });
    const wrapper = mountDialog({ id: 'override-1', display_name_source: 'Old', icon_url: null });
    await wrapper.setData({ displayName: 'Updated' });

    await (wrapper.vm as unknown as { onSave: () => Promise<void> }).onSave();

    expect(mocks.update).toHaveBeenCalledWith('override-1', { display_name: 'Updated', icon_url: null });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('deletes the row to restore both defaults', async () => {
    mocks.delete.mockResolvedValue({ data: undefined });
    const wrapper = mountDialog({ id: 'override-1', display_name_source: 'Old', icon_url: null });

    await (wrapper.vm as unknown as { onReset: () => Promise<void> }).onReset();

    expect(mocks.confirm).toHaveBeenCalled();
    expect(mocks.delete).toHaveBeenCalledWith('override-1');
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });
});
