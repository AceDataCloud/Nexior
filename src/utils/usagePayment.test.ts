import { describe, expect, it } from 'vitest';
import { IApiUsage } from '@/models/usage';
import { getX402CopyableTransaction, getX402UsagePayment, isX402Usage, omitX402Metadata } from './usagePayment';

function usage(metadata: IApiUsage['metadata']): IApiUsage {
  return { metadata };
}

const settled = usage({
  x402: true,
  x402_settlement_status: 'settled',
  x402_amount_atomic: '13330',
  x402_decimals: 6,
  x402_currency: 'USDC',
  x402_network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  x402_tx: 'signature',
  x402_payer: 'payer'
});

describe('x402 usage payment', () => {
  it('extracts a settled USDC payment and explorer URL', () => {
    expect(getX402UsagePayment(settled)).toEqual({
      amount: '0.01333',
      currency: 'USDC',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      transaction: 'signature',
      payer: 'payer',
      explorerUrl: 'https://solscan.io/tx/signature'
    });
  });

  it('does not claim old or unconfirmed records are paid', () => {
    expect(getX402UsagePayment(usage({ x402: true, x402_tx: 'legacy-tx' }))).toBeUndefined();
    expect(
      getX402UsagePayment(
        usage({
          ...settled.metadata,
          x402_settlement_status: 'unconfirmed'
        })
      )
    ).toBeUndefined();
  });

  it('rejects malformed atomic amounts and decimals', () => {
    expect(getX402UsagePayment(usage({ ...settled.metadata, x402_amount_atomic: '1.5' }))).toBeUndefined();
    expect(getX402UsagePayment(usage({ ...settled.metadata, x402_decimals: 256 }))).toBeUndefined();
  });

  it('keeps unknown networks copyable without inventing a link', () => {
    const payment = getX402UsagePayment(usage({ ...settled.metadata, x402_network: 'eip155:1' }));
    expect(payment?.transaction).toBe('signature');
    expect(payment?.explorerUrl).toBeUndefined();
  });

  it('exposes attempt transactions for copying and hides x402 metadata tags', () => {
    const record = usage({ x402: true, x402_settle_attempt_tx: 'attempt', task_id: 'task-1', request: {} });
    expect(isX402Usage(record)).toBe(true);
    expect(getX402CopyableTransaction(record)).toBe('attempt');
    expect(omitX402Metadata(record.metadata)).toEqual({ task_id: 'task-1' });
  });
});
