// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TikTokPublishForm from './TikTokPublishForm.vue';
import type { ITikTokPublishDetail } from '@/models';

const global = {
  mocks: {
    $t: (key: string, params?: Record<string, unknown>) => (params ? `${key}{${Object.values(params).join(',')}}` : key)
  },
  stubs: {
    'el-input': {
      props: ['modelValue'],
      template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
    },
    'el-select': {
      props: ['modelValue'],
      template:
        '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
    },
    'el-option': {
      props: ['label', 'value', 'disabled'],
      template: '<option :value="value" :disabled="disabled">{{ label }}</option>'
    },
    'el-checkbox': {
      props: ['modelValue', 'disabled'],
      template:
        '<label><input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" /><slot /></label>'
    }
  }
};

const DETAIL: ITikTokPublishDetail = {
  creator_nickname: 'acedatacloud',
  privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
  comment_disabled: false,
  duet_disabled: false,
  stitch_disabled: false,
  max_video_post_duration_sec: 600
};

const mountForm = (detail: Partial<ITikTokPublishDetail> = {}, props: Record<string, unknown> = {}) =>
  mount(TikTokPublishForm, { props: { detail: { ...DETAIL, ...detail }, ...props }, global });

describe('TikTokPublishForm', () => {
  it('shows the creator nickname so the user knows the target account', () => {
    expect(mountForm().text()).toContain('acedatacloud');
  });

  it('renders exactly the privacy options creator_info returned', () => {
    const opts = mountForm().findAll('option');
    expect(opts).toHaveLength(3);
    expect(opts.map((o) => o.attributes('value'))).toEqual([
      'PUBLIC_TO_EVERYONE',
      'MUTUAL_FOLLOW_FRIENDS',
      'SELF_ONLY'
    ]);
  });

  it('renders a private account option set unchanged', () => {
    const opts = mountForm({
      privacy_level_options: ['FOLLOWER_OF_CREATOR', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']
    }).findAll('option');
    expect(opts.map((o) => o.attributes('value'))).toEqual([
      'FOLLOWER_OF_CREATOR',
      'MUTUAL_FOLLOW_FRIENDS',
      'SELF_ONLY'
    ]);
  });

  it('starts with NO privacy selected — TikTok forbids a default', () => {
    const wrapper = mountForm();
    expect((wrapper.vm as any).form.privacy_level).toBe('');
    expect(wrapper.emitted('validity-change')?.[0]).toEqual([false]);
  });

  it('becomes valid once a privacy level is chosen', async () => {
    const wrapper = mountForm();
    await wrapper.find('select').setValue('PUBLIC_TO_EVERYONE');
    expect(wrapper.emitted('validity-change')?.at(-1)).toEqual([true]);
  });

  it('leaves every interaction toggle unchecked by default', () => {
    const form = (mountForm().vm as any).form;
    expect(form.allow_comment).toBe(false);
    expect(form.allow_duet).toBe(false);
    expect(form.allow_stitch).toBe(false);
  });

  it('disables an interaction the creator turned off', () => {
    const boxes = mountForm({ duet_disabled: true }).findAll('input[type="checkbox"]');
    // order: comment, duet, stitch, commercial
    expect(boxes[1].attributes('disabled')).toBeDefined();
    expect(boxes[0].attributes('disabled')).toBeUndefined();
  });

  it('hides duet and stitch for photo posts', () => {
    const wrapper = mountForm({ is_photo_post: true });
    expect(wrapper.text()).toContain('allowComment');
    expect(wrapper.text()).not.toContain('allowDuet');
    expect(wrapper.text()).not.toContain('allowStitch');
  });

  it('rejects a video longer than the account cap', () => {
    const wrapper = mountForm({ max_video_post_duration_sec: 60 }, { durationSec: 90 });
    expect(wrapper.text()).toContain('tooLong');
    expect(wrapper.emitted('validity-change')?.[0]).toEqual([false]);
  });

  it('blocks branded content while the post is private', async () => {
    const wrapper = mountForm();
    await wrapper.find('select').setValue('SELF_ONLY');
    await wrapper.findAll('input[type="checkbox"]')[3].setValue(true);
    const branded = wrapper.findAll('input[type="checkbox"]').at(-1);
    expect(branded?.attributes('disabled')).toBeDefined();
  });

  it('clears branded content when the user switches to private', async () => {
    const wrapper = mountForm();
    await wrapper.find('select').setValue('PUBLIC_TO_EVERYONE');
    const vm = wrapper.vm as any;
    vm.form.commercial = true;
    vm.form.brand_content_toggle = true;
    await wrapper.find('select').setValue('SELF_ONLY');
    expect(vm.form.brand_content_toggle).toBe(false);
  });

  it('is invalid when disclosure is on but neither sub-option is picked', async () => {
    const wrapper = mountForm();
    await wrapper.find('select').setValue('PUBLIC_TO_EVERYONE');
    const vm = wrapper.vm as any;
    vm.form.commercial = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('validity-change')?.at(-1)).toEqual([false]);
  });

  it('uses the same declaration for branded-only and both — there are only two strings', async () => {
    const wrapper = mountForm();
    const vm = wrapper.vm as any;
    vm.form.commercial = true;
    vm.form.brand_content_toggle = true;
    await wrapper.vm.$nextTick();
    const brandedOnly = vm.musicDeclaration;
    vm.form.brand_organic_toggle = true;
    await wrapper.vm.$nextTick();
    expect(vm.musicDeclaration).toBe(brandedOnly);
  });

  it('inverts allow_* into the API disable_* fields', async () => {
    const wrapper = mountForm();
    await wrapper.find('select').setValue('PUBLIC_TO_EVERYONE');
    const vm = wrapper.vm as any;
    vm.form.allow_comment = true;
    await wrapper.vm.$nextTick();
    expect(vm.collect()).toMatchObject({
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_comment: false,
      disable_duet: true,
      disable_stitch: true
    });
  });

  it('falls back to the raw value for an unrecognized privacy option', () => {
    const wrapper = mountForm({ privacy_level_options: ['SOME_NEW_LEVEL'] });
    expect(wrapper.find('option').text()).toBe('SOME_NEW_LEVEL');
  });
});
