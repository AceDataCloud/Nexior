// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CategoryTiles from './CategoryTiles.vue';
import type { ResolvedHomeCategory } from '../data';

const items: ResolvedHomeCategory[] = [
  {
    id: 'chat',
    title: 'Chat with AI',
    description: 'Write and analyze',
    imageUrl: 'chat.webp',
    items: [
      {
        capability: 'chatgpt',
        routeName: 'chatgpt-new',
        name: 'ChatGPT',
        description: 'All-round assistant',
        icon: 'chatgpt.png',
        defaultIcon: 'chatgpt.png',
        imageUrl: ''
      }
    ]
  },
  {
    id: 'video',
    title: 'Make a video',
    description: 'Cinematic motion',
    imageUrl: 'video.webp',
    items: [
      {
        capability: 'seedance',
        routeName: 'seedance-index',
        name: 'Seedance',
        description: 'Reference-led video',
        icon: 'seedance.png',
        defaultIcon: 'seedance.png',
        imageUrl: ''
      }
    ]
  }
];

function mountTiles() {
  return mount(CategoryTiles, {
    props: { items },
    attachTo: document.body,
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a class="router-link"><slot /></a>' } },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('CategoryTiles', () => {
  it('opens one inline panel at a time and toggles it closed', async () => {
    const wrapper = mountTiles();
    const buttons = wrapper.findAll('.category-card');

    await buttons[0].trigger('click');
    expect(buttons[0].attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('.capability-panel').attributes('id')).toBe('home-category-panel-chat');
    expect(wrapper.get('.router-link').text()).toContain('ChatGPT');

    await buttons[1].trigger('click');
    expect(buttons[0].attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('.capability-panel').attributes('id')).toBe('home-category-panel-video');

    await buttons[1].trigger('click');
    expect(wrapper.find('.capability-panel').exists()).toBe(false);
  });

  it('keeps child titles and descriptions light on the always-dark panel', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/home/components/CategoryTiles.vue'), 'utf8');
    expect(source).toContain('color: #fff;');
    expect(source).toContain('color: rgba(255, 255, 255, 0.72);');
  });

  it('closes on Escape and returns focus to the category button', async () => {
    const wrapper = mountTiles();
    const button = wrapper.findAll('.category-card')[0];
    await button.trigger('click');
    await wrapper.get('section').trigger('keydown', { key: 'Escape' });

    expect(wrapper.find('.capability-panel').exists()).toBe(false);
    expect(document.activeElement).toBe(button.element);
  });
});
