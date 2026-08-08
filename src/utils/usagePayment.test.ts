import { describe, expect, it } from 'vitest';
import { IApiUsage } from '@/models/usage';
import { getX402CopyableTransaction, getX402UsagePayment, isX402Usage, omitX402Metadata } from './usagePayment';

function usage(metadata: IApiUsage['metadata']): IApiUsage {
  return { metadata };
}

const settled = usage({
  x402: true,
  x402_settlement_status: 'settled',
  x402_list_amount_atomic: '13330',
  x402_amount_atomic: '12263',
  x402_discount_percent: '0.08',
  x402_discount_type: 'Coin',
  x402_discount_coin_policy_id: 'policy-1',
  x402_decimals: 6,
  x402_currency: 'USDC',
  x402_network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  x402_tx: 'signature',
  x402_payer: 'payer'
});

describe('x402 usage payment', () => {
  it('extracts a settled USDC payment and explorer URL', () => {
    expect(getX402UsagePayment(settled)).toEqual({
      amount: '0.012263',
      originalAmount: '0.01333',
      discountPercent: '8',
      discountSource: 'ace',
      currency: 'USDC',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      transaction: 'signature',
      payer: 'payer',
      explorerUrl: 'https://solscan.io/tx/signature'
    });
  });

  it('keeps a settled legacy payment without inventing a discount', () => {
    const payment = getX402UsagePayment(
      usage({
        ...settled.metadata,
        x402_list_amount_atomic: undefined,
        x402_discount_percent: undefined,
        x402_discount_type: undefined,
        x402_discount_coin_policy_id: undefined
      })
    );
    expect(payment?.amount).toBe('0.012263');
    expect(payment?.originalAmount).toBeUndefined();
    expect(payment?.discountSource).toBeUndefined();
  });

  it('does not claim incomplete or unconfirmed records are paid', () => {
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

  it('uses a neutral source for a manual discount and ignores malformed list prices', () => {
    const manual = getX402UsagePayment(
      usage({ ...settled.metadata, x402_discount_type: 'Manual', x402_discount_coin_policy_id: undefined })
    );
    expect(manual?.discountSource).toBe('manual');

    const fractional = getX402UsagePayment(
      usage({ ...settled.metadata, x402_discount_type: 'Manual', x402_discount_percent: '0.075' })
    );
    expect(fractional?.discountPercent).toBe('7.5');

    const unknown = getX402UsagePayment(usage({ ...settled.metadata, x402_discount_type: undefined }));
    expect(unknown?.originalAmount).toBe('0.01333');
    expect(unknown?.discountPercent).toBeUndefined();

    const malformed = getX402UsagePayment(usage({ ...settled.metadata, x402_list_amount_atomic: '13.330' }));
    expect(malformed?.amount).toBe('0.012263');
    expect(malformed?.originalAmount).toBeUndefined();
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
