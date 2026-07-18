// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MediaInputField from './MediaInputField.vue';

const baseProps = {
  name: 'reference.mp4',
  roleLabel: 'Motion reference',
  previewLabel: 'Preview motion reference',
  replaceLabel: 'Replace motion reference',
  removeLabel: 'Remove motion reference',
  unavailableLabel: 'Reference unavailable'
};

describe('MediaInputField', () => {
  it('renders a visual video preview instead of a generic file row', () => {
    const wrapper = shallowMount(MediaInputField, {
      props: { ...baseProps, kind: 'video', url: 'https://cdn.example/reference.mp4' }
    });

    expect(wrapper.get('video').attributes('src')).toContain('reference.mp4');
    expect(wrapper.get('.media-input__visual').attributes('aria-label')).toBe(baseProps.previewLabel);
  });

  it('opens image and video previews from keyboard-accessible buttons', async () => {
    const image = shallowMount(MediaInputField, {
      props: { ...baseProps, kind: 'image', url: 'https://cdn.example/reference.png' }
    });
    await image.get('.media-input__visual').trigger('click');
    expect(image.find('el-image-viewer-stub').exists()).toBe(true);

    const video = shallowMount(MediaInputField, {
      props: { ...baseProps, kind: 'video', url: 'https://cdn.example/reference.mp4' }
    });
    await video.get('.media-input__visual').trigger('click');
    expect(video.get('el-dialog-stub').attributes('modelvalue')).toBe('true');
  });

  it('exposes upload progress and failure state', async () => {
    const wrapper = shallowMount(MediaInputField, {
      props: {
        ...baseProps,
        kind: 'image',
        url: 'https://cdn.example/reference.png',
        state: 'uploading',
        progress: 142
      }
    });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.get('.media-input__visual').attributes('disabled')).toBeDefined();
    expect(wrapper.get('el-progress-stub').attributes('percentage')).toBe('100');

    await wrapper.setProps({ state: 'failed', error: 'Upload failed' });
    expect(wrapper.get('[role="alert"]').text()).toBe('Upload failed');
  });

  it('falls back when video thumbnails fail and labels unavailable references', async () => {
    const wrapper = shallowMount(MediaInputField, {
      props: {
        ...baseProps,
        kind: 'video',
        url: 'https://cdn.example/missing.mp4',
        state: 'unavailable'
      }
    });

    await wrapper.get('video').trigger('error');
    expect(wrapper.find('video').exists()).toBe(false);
    expect(wrapper.text()).toContain(baseProps.unavailableLabel);
  });

  it('emits explicit replace and remove actions', async () => {
    const wrapper = shallowMount(MediaInputField, { props: { ...baseProps, kind: 'image' } });
    const buttons = wrapper.findAll('el-button-stub');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('replace')).toHaveLength(1);
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });
});
