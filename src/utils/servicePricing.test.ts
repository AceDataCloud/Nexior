import { describe, expect, it } from 'vitest';
import {
  filterServicePricingRows,
  filterServicePricingRules,
  formatCredits,
  normalizeServicePricing
} from './servicePricing';

describe('normalizeServicePricing', () => {
  it('returns no rows for invalid input and filters hidden rules', () => {
    expect(normalizeServicePricing(undefined)).toEqual([]);
    expect(normalizeServicePricing({})).toEqual([]);
    expect(normalizeServicePricing([{ hidden: true, conditions: {}, consumption: 1 }])).toEqual([]);
  });

  it('normalizes fixed, free, and localized remark overrides in source order', () => {
    const rules = [
      {
        conditions: {
          and: [{ '==': [{ var: ['model', ''] }, 'video-pro'] }, { '<=': [{ var: ['duration', 0] }, 10] }]
        },
        consumption: 0.63,
        remark: { model: '1–10s' }
      },
      { conditions: {}, consumption: 0 }
    ];
    const rows = normalizeServicePricing(rules);

    expect(rows.map((row) => row.billingKind)).toEqual(['fixed', 'free']);
    expect(rows[0].conditions).toEqual([
      { field: 'model', operator: 'equals', value: '1–10s' },
      { field: 'duration', operator: 'atMost', value: '10' }
    ]);
    expect(rows[0].amount).toBe(0.63);
    expect(rows[1].conditions).toEqual([]);
  });

  it('normalizes membership, reversed comparisons, and same-field alternatives', () => {
    const [row] = normalizeServicePricing([
      {
        conditions: {
          and: [
            { in: [{ var: ['model', ''] }, ['a', 'b']] },
            { '>': [10, { var: ['duration', 0] }] },
            { or: [{ '==': [{ var: ['quality', ''] }, 'hd'] }, { '==': [{ var: ['quality', ''] }, 'uhd'] }] }
          ]
        },
        consumption: 1
      }
    ]);

    expect(row.conditions).toEqual([
      { field: 'model', operator: 'oneOf', value: 'a, b' },
      { field: 'duration', operator: 'lessThan', value: '10' },
      { field: 'quality', operator: 'either', value: 'hd, uhd' }
    ]);
  });

  it('preserves cross-field OR conditions as one any-of group', () => {
    const [row] = normalizeServicePricing([
      {
        conditions: {
          and: [
            { '==': [{ var: ['version', ''] }, '8'] },
            {
              or: [
                { '==': [{ var: ['hd', false] }, true] },
                { '==': [{ var: ['quality', '1'] }, '4'] },
                { '==': [{ var: ['style_reference', false] }, true] },
                { '==': [{ var: ['moodboard', false] }, true] }
              ]
            }
          ]
        },
        consumption: 1.08
      }
    ]);

    expect(row.conditions[0]).toEqual({ field: 'version', operator: 'equals', value: '8' });
    expect(row.conditions[1]).toEqual({
      field: '',
      operator: 'anyOf',
      value: '',
      options: [
        { field: 'hd', operator: 'equals', value: 'true' },
        { field: 'quality', operator: 'equals', value: '4' },
        { field: 'style_reference', operator: 'equals', value: 'true' },
        { field: 'moodboard', operator: 'equals', value: 'true' }
      ]
    });
  });

  it('normalizes Seedance reference-video conditions without losing model and resolution', () => {
    const [row] = normalizeServicePricing([
      {
        conditions: {
          and: [
            { in: ['doubao-seedance-2-0-mini', { var: ['model', ''] }] },
            { '==': [{ var: ['resolution', '480p'] }, '480p'] },
            { some: [{ var: ['content', []] }, { in: ['reference_video', { var: ['role', ''] }] }] }
          ]
        },
        consumption: { '*': [0.95, { var: ['duration', 5] }] },
        unit: 'Second'
      }
    ]);

    expect(row.conditions).toEqual([
      { field: 'model', operator: 'oneOf', value: 'doubao-seedance-2-0-mini' },
      { field: 'resolution', operator: 'equals', value: '480p' },
      { field: 'referenceVideo', operator: 'equals', value: 'required' }
    ]);
  });

  it('normalizes simple linear rates in either multiplication order', () => {
    const rows = normalizeServicePricing([
      { conditions: {}, consumption: { '*': [1.46, { var: ['duration', 5] }] }, unit: 'Second' },
      { conditions: {}, consumption: { '*': [{ var: ['count', 1] }, 0.5] } }
    ]);

    expect(rows[0]).toMatchObject({ billingKind: 'linear', amount: 1.46, rateField: 'duration', unit: 'Second' });
    expect(rows[1]).toMatchObject({ billingKind: 'linear', amount: 0.5, rateField: 'count' });
  });

  it('uses safe fallbacks for unsupported conditions and formulas', () => {
    const [row] = normalizeServicePricing([
      {
        conditions: { someOperator: [{ var: ['secret_internal_field', ''] }, 'value'] },
        consumption: { if: [true, 1, 2] }
      }
    ]);

    expect(row.billingKind).toBe('calculated');
    expect(row.conditions).toEqual([{ field: '', operator: 'other', value: '' }]);
    expect(JSON.stringify(row)).not.toContain('someOperator');
    expect(JSON.stringify(row)).not.toContain('secret_internal_field');
  });

  it('does not mutate input rules', () => {
    const rules = [{ conditions: { '==': [{ var: ['model', ''] }, 'a'] }, consumption: 1 }];
    const snapshot = structuredClone(rules);
    normalizeServicePricing(rules);
    expect(rules).toEqual(snapshot);
  });
});

describe('filterServicePricingRules', () => {
  it('drops whole mismatched rules and respects the API model default context', () => {
    const rules = [
      {
        conditions: {
          and: [
            { '==': [{ var: ['model', 'dall-e-3'] }, 'dall-e-3'] },
            { '==': [{ var: ['quality', 'standard'] }, 'standard'] }
          ]
        },
        consumption: 0.2
      },
      { conditions: { '==': [{ var: ['model', 'dall-e-3'] }, 'gpt-image-2'] }, consumption: 0.11 },
      { conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-1'] }, consumption: 0.36 },
      { conditions: { '==': [{ var: ['model', 'dall-e-3'] }, 'gpt-image-1'] }, consumption: 0.2 }
    ];

    const filtered = filterServicePricingRules(rules, ['gpt-image-1', 'gpt-image-2'], 'dall-e-3');
    expect(filtered).toEqual([rules[1], rules[3]]);
  });
});

describe('filterServicePricingRows', () => {
  it('keeps only workspace models, narrows model lists, and drops catch-all rules', () => {
    const rows = normalizeServicePricing([
      { conditions: {}, consumption: 0 },
      { conditions: { in: [{ var: ['model', ''] }, ['gpt-image-2', 'dall-e-3']] }, consumption: 0.11 },
      {
        conditions: {
          and: [{ '==': [{ var: ['model', ''] }, 'whisper-1'] }, { '==': [{ var: ['quality', ''] }, 'hd'] }]
        },
        consumption: 0.01
      },
      { conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-1'] }, consumption: 0.2 }
    ]);

    const filtered = filterServicePricingRows(rows, ['gpt-image-1', 'gpt-image-2']);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((row) => row.conditions[0].value)).toEqual(['gpt-image-2', 'gpt-image-1']);
    expect(JSON.stringify(filtered)).not.toContain('dall-e-3');
    expect(JSON.stringify(filtered)).not.toContain('whisper-1');
  });
});

describe('formatCredits', () => {
  it.each([
    [0, '0.0000'],
    [0.00001, '<0.0001'],
    [0.005, '0.0050'],
    [0.14, '0.14'],
    [2, '2.00']
  ])('formats %s as %s', (value, expected) => {
    expect(formatCredits(value)).toBe(expected);
  });
});
