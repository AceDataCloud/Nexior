import { describe, expect, it } from 'vitest';
import { recurringDelegationData, type SetupResponse } from './continuousPayment';

const setup = {
  nonce: '72623859790382856',
  daily_limit_atomic: '1234567',
  period_seconds: 86400,
  expiry_ts: 1_900_000_000
} as SetupResponse;

describe('Solana recurring delegation v0.4 encoding', () => {
  it('encodes the frozen discriminator and little-endian field layout', () => {
    const data = recurringDelegationData(setup, 42n);
    expect(data).toHaveLength(49);
    expect(data[0]).toBe(2);
    expect(data.readBigUInt64LE(1)).toBe(72623859790382856n);
    expect(data.readBigUInt64LE(9)).toBe(1234567n);
    expect(data.readBigUInt64LE(17)).toBe(86400n);
    expect(data.readBigInt64LE(25)).toBe(0n);
    expect(data.readBigInt64LE(33)).toBe(1900000000n);
    expect(data.readBigInt64LE(41)).toBe(42n);
  });
});
