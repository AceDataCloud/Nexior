// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Logo from './Logo.vue';

const mountLogo = (site: Record<string, unknown>, collapsed = false) =>
  mount(Logo, {
    props: { collapsed },
    global: {
      mocks: {
        $store: { state: { site } }
      }
    }
  });

describe('Logo Site branding', () => {
  it('renders the initialized Site logo without consulting the hostname', () => {
    const wrapper = mountLogo({ title: 'Customer AI', logo: 'https://cdn.example.com/customer-logo.png' });

    expect(wrapper.get('.brand-logo__image').attributes('src')).toBe('https://cdn.example.com/customer-logo.png');
    expect(wrapper.get('.brand-logo__image').attributes('alt')).toBe('Customer AI');
    expect(wrapper.find('.brand-logo__wordmark').exists()).toBe(false);
  });

  it('falls back from logo to favicon and reverses priority when collapsed', () => {
    const faviconOnly = mountLogo({ favicon: 'https://cdn.example.com/favicon.png' });
    expect(faviconOnly.get('.brand-logo__image').attributes('src')).toContain('favicon.png');

    const collapsed = mountLogo(
      {
        logo: 'https://cdn.example.com/logo.png',
        favicon: 'https://cdn.example.com/favicon.png'
      },
      true
    );
    expect(collapsed.get('.brand-logo__image').attributes('src')).toContain('favicon.png');
  });

  it('uses the built-in wordmark only when Site branding is absent', () => {
    const wrapper = mountLogo({ title: 'Unbranded Site' });

    expect(wrapper.find('.brand-logo__image').exists()).toBe(false);
    expect(wrapper.find('.brand-logo__wordmark').exists()).toBe(true);
  });

  it('uses the built-in mark for an unbranded collapsed header', () => {
    const wrapper = mountLogo({ title: 'Unbranded Site' }, true);

    expect(wrapper.find('.brand-logo__image').exists()).toBe(false);
    expect(wrapper.find('.brand-logo__mark').exists()).toBe(true);
  });
});
