import { describe, expect, it } from 'vitest';
import { formatCredits, normalizeServicePricing } from './servicePricing';

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
