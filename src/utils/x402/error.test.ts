import { describe, expect, it } from 'vitest';
import { continuousPaymentErrorMessage } from './error';

describe('continuousPaymentErrorMessage', () => {
  it('renders the first DRF detail and trace id', () => {
    expect(
      continuousPaymentErrorMessage(
        { response: { data: { detail: ['transaction_message_mismatch'], trace_id: 'trace-1' } } },
        'fallback'
      )
    ).toBe('transaction_message_mismatch (trace-1)');
  });

  it('uses nested API errors and fallback text', () => {
    expect(
      continuousPaymentErrorMessage({ response: { data: { error: { message: 'RPC unavailable' } } } }, 'fallback')
    ).toBe('RPC unavailable');
    expect(continuousPaymentErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
