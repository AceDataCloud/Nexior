import { describe, expect, it, vi } from 'vitest';
import type { IChatModel } from '@/models';
import { resolveModelDisplayName } from './modelPresentation';

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
