// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import { describe, expect, it } from 'vitest';
import { CAPABILITY_ICONS } from '@/constants/capabilities';
import CapabilityPresentation from './CapabilityPresentation.vue';

function mountPresentation(part: 'avatar' | 'name', site: Record<string, unknown> | undefined) {
  return mount(CapabilityPresentation, {
    props: { capability: 'flux', part },
    global: {
      mocks: {
        $store: { state: { site } },
        $t: (key: string) => (key === 'common.nav.flux' ? 'Flux' : key)
      }
    }
  });
}

describe('CapabilityPresentation', () => {
  it('renders the default capability name and icon used by navigation', () => {
    expect(mountPresentation('name', undefined).text()).toBe('Flux');
    expect(mountPresentation('avatar', undefined).findComponent({ name: 'ElImage' }).props('src')).toBe(
      CAPABILITY_ICONS.flux
    );
  });

  it('renders the site capability name and icon overrides', () => {
    const site = {
      capability_overrides: {
        flux: {
          display_name: 'Studio Image',
          icon_url: 'https://cdn.example.com/studio-image.png'
        }
      }
    };

    expect(mountPresentation('name', site).text()).toBe('Studio Image');
    expect(mountPresentation('avatar', site).findComponent({ name: 'ElImage' }).props('src')).toBe(
      'https://cdn.example.com/studio-image.png'
    );
  });

  it('falls back after an icon error and retries when the override changes', async () => {
    const site = reactive({
      capability_overrides: {
        flux: { display_name: 'Studio Image', icon_url: 'https://cdn.example.com/broken.png' }
      }
    });
    const wrapper = mountPresentation('avatar', site);
    const image = () => wrapper.findComponent({ name: 'ElImage' });

    image().vm.$emit('error');
    await nextTick();
    expect(image().props('src')).toBe(CAPABILITY_ICONS.flux);

    site.capability_overrides.flux.icon_url = 'https://cdn.example.com/replacement.png';
    await nextTick();
    expect(image().props('src')).toBe('https://cdn.example.com/replacement.png');
  });
});
