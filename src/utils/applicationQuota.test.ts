import { describe, expect, it } from 'vitest';
import { IApplicationScope } from '@/models';
import { getEffectiveApplicationBalance, normalizeApplicationBalance } from './applicationQuota';

describe('application quota', () => {
  it.each([
    [undefined, 0],
    [null, 0],
    [-2, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [3.25, 3.25]
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeApplicationBalance(value)).toBe(expected);
  });

  it('uses only the selected balance when global fallback is disabled', () => {
    expect(
      getEffectiveApplicationBalance(
        { scope: IApplicationScope.INDIVIDUAL, user_id: 'payer', remaining_amount: 2, allow_consume_global: false },
        [{ scope: IApplicationScope.GLOBAL, user_id: 'payer', remaining_amount: 10 }]
      )
    ).toBe(2);
  });

  it('uses the larger eligible wallet without summing balances', () => {
    expect(
      getEffectiveApplicationBalance(
        { scope: IApplicationScope.INDIVIDUAL, user_id: 'payer', remaining_amount: 2, allow_consume_global: true },
        [{ scope: IApplicationScope.GLOBAL, user_id: 'payer', remaining_amount: 10 }]
      )
    ).toBe(10);
  });

  it('does not use a global wallet owned by another payer', () => {
    expect(
      getEffectiveApplicationBalance(
        { scope: IApplicationScope.INDIVIDUAL, user_id: 'payer', remaining_amount: 2, allow_consume_global: true },
        [{ scope: IApplicationScope.GLOBAL, user_id: 'other', remaining_amount: 10 }]
      )
    ).toBe(2);
  });

  it('uses only a selected global application', () => {
    expect(
      getEffectiveApplicationBalance(
        { scope: IApplicationScope.GLOBAL, user_id: 'payer', remaining_amount: 4, allow_consume_global: true },
        [{ scope: IApplicationScope.GLOBAL, user_id: 'payer', remaining_amount: 10 }]
      )
    ).toBe(4);
  });
});
