import { describe, expect, it, vi } from 'vitest';
import type { IChatModel } from '@/models';
import { resolveModelDisplayName, resolveModelIcon } from './modelPresentation';

function model(group: IChatModel['modelGroup'] = 'chatgpt'): IChatModel {
  return {
    name: 'gpt-5.5' as IChatModel['name'],
    modelGroup: group,
    icon: '/gpt.png',
    getDisplayName: vi.fn(() => 'GPT-5.5'),
    getDescription: () => ''
  };
}

describe('resolveModelDisplayName', () => {
  it('uses the current model group alias without changing the canonical model', () => {
    const item = model();
    expect(
      resolveModelDisplayName(
        { features: { chatgpt: { models: { 'gpt-5.5': { display_name: '  XXAI-Pro  ' } } } } },
        item
      )
    ).toBe('XXAI-Pro');
    expect(item.name).toBe('gpt-5.5');
    expect(item.getDisplayName).not.toHaveBeenCalled();
  });

  it('does not apply an alias from another model group', () => {
    expect(
      resolveModelDisplayName(
        { features: { grok: { models: { 'gpt-5.5': { display_name: 'Wrong group' } } } } },
        model('chatgpt')
      )
    ).toBe('GPT-5.5');
  });

  it('falls back to the catalog label for missing or blank aliases', () => {
    const item = model();
    expect(resolveModelDisplayName(undefined, item)).toBe('GPT-5.5');
    expect(
      resolveModelDisplayName({ features: { chatgpt: { models: { 'gpt-5.5': { display_name: ' ' } } } } }, item)
    ).toBe('GPT-5.5');
  });
});

describe('resolveModelIcon', () => {
  it('uses the current Site model icon without changing the canonical model', () => {
    const item = model();
    expect(
      resolveModelIcon(
        { features: { chatgpt: { models: { 'gpt-5.5': { icon_url: ' https://example.com/custom.png ' } } } } },
        item
      )
    ).toBe('https://example.com/custom.png');
    expect(item.icon).toBe('/gpt.png');
    expect(item.name).toBe('gpt-5.5');
  });

  it('ignores other model groups and falls back for missing or blank icons', () => {
    const item = model();
    expect(resolveModelIcon(undefined, item)).toBe('/gpt.png');
    expect(resolveModelIcon({ features: { grok: { models: { 'gpt-5.5': { icon_url: '/wrong.png' } } } } }, item)).toBe(
      '/gpt.png'
    );
    expect(resolveModelIcon({ features: { chatgpt: { models: { 'gpt-5.5': { icon_url: ' ' } } } } }, item)).toBe(
      '/gpt.png'
    );
  });
});
