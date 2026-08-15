// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { ISiteContact } from '@/models';
import EditContacts from './EditContacts.vue';

const t = (key: string) => key;

const mountEditor = (contacts: ISiteContact[] = []) =>
  shallowMount(EditContacts, {
    props: { modelValue: contacts, title: 'Contacts' },
    global: {
      mocks: { $t: t },
      stubs: {
        ElDialog: { template: '<section><slot /><slot name="footer" /></section>' },
        ElInput: true,
        ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        ElIcon: true,
        ElImage: true,
        ElSelect: { template: '<div class="select-stub"><slot /></div>' },
        ElOption: { template: '<div class="option-stub"><slot /></div>' },
        FontAwesomeIcon: true,
        ImageCropper: true,
        Edit: true,
        Plus: true,
        Delete: true
      }
    }
  });

describe('EditContacts', () => {
  it('keeps existing ids and gives legacy contacts stable ids', () => {
    const wrapper = mountEditor([
      { id: 'saved-id', type: 'discord', value: 'Ace' },
      { type: 'wechat', value: 'acedata' }
    ]);
    const vm = wrapper.vm as any;

    expect(vm.rows[0].id).toBe('saved-id');
    expect(vm.rows[1].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(vm.buildContacts().map((contact: ISiteContact) => contact.id)).toEqual(['saved-id', vm.rows[1].id]);
  });

  it('creates unique row ids and normalizes custom slugs', () => {
    const wrapper = mountEditor();
    const vm = wrapper.vm as any;

    vm.addRow();
    vm.addRow();
    expect(vm.rows[0].id).not.toBe(vm.rows[1].id);

    vm.rows[0].type = ' Custom_Channel ';
    vm.rows[0].value = 'support';
    expect(vm.buildContacts()[0]).toMatchObject({
      id: vm.rows[0].id,
      type: 'custom_channel',
      value: 'support'
    });
  });

  it('updates only the active row after a QR upload', () => {
    const wrapper = mountEditor([
      { id: 'first', type: 'wechat', value: 'one' },
      { id: 'second', type: 'discord', value: 'two' }
    ]);
    const vm = wrapper.vm as any;

    vm.openQrUploader('second');
    vm.onQrUploaded('https://cdn.example.com/second.png');

    expect(vm.rows[0].qr).toBe('');
    expect(vm.rows[1].qr).toBe('https://cdn.example.com/second.png');
    expect(vm.activeQrContactId).toBeNull();
  });

  it('does not write an upload into a row removed while the cropper is open', () => {
    const wrapper = mountEditor([{ id: 'removed', type: 'wechat', value: 'one' }]);
    const vm = wrapper.vm as any;

    vm.openQrUploader('removed');
    vm.removeRow(0);
    expect(() => vm.onQrUploaded('https://cdn.example.com/orphan.png')).not.toThrow();
    expect(vm.rows).toEqual([]);
  });

  it('renders channel option metadata and explicit QR controls', () => {
    const wrapper = mountEditor([{ id: 'qr', type: 'wechat', qr: 'https://cdn.example.com/qr.png' }]);
    const vm = wrapper.vm as any;

    expect(vm.typeOptions.find((option: any) => option.value === 'wechat')).toMatchObject({
      value: 'wechat',
      fontAwesome: true
    });
    expect(wrapper.html()).toContain('type-option');
    expect(wrapper.html()).toContain('common.settings.contactQrReplace');
    expect(wrapper.html()).toContain('common.settings.contactQrClear');
  });

  it('emits contacts with stable ids on confirm', () => {
    const wrapper = mountEditor([{ id: 'persisted', type: 'email', value: 'support@example.com' }]);
    const vm = wrapper.vm as any;
    vi.spyOn(vm, 'validate').mockReturnValue('');

    vm.onConfirm();
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual([
      { id: 'persisted', type: 'email', value: 'support@example.com' }
    ]);
  });
});
