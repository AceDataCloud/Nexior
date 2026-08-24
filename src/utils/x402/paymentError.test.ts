import { describe, expect, it } from 'vitest';
import { extractX402PaymentError, resolveX402PaymentError } from './paymentError';

describe('X402 payment error resolver', () => {
  it('prefers the structured extension and filters unsafe params', () => {
    const source = {
      message: 'Request failed with status code 402',
      response: {
        data: {
          error: 'raw facilitator error',
          extensions: {
            acedatacloud: {
              paymentError: {
                code: 'insufficient_token_balance',
                params: { network: 'eip155:8453', payer: 'secret-wallet' },
                stage: 'verify',
                retryable: true,
                charged: false
              }
            }
          }
        }
      }
    };
    const canonical = extractX402PaymentError(source);
    expect(canonical).toEqual({
      code: 'insufficient_token_balance',
      params: { network: 'eip155:8453' },
      stage: 'verify',
      retryable: true,
      charged: false
    });
    const view = resolveX402PaymentError(source, (key, params = {}) => `${key}:${JSON.stringify(params)}`, 'order');
    expect(view.safety).toContain('notCharged');
    expect(JSON.stringify(view)).not.toMatch(/secret-wallet|raw facilitator|status code 402/);
  });

  it('falls back safely for an unknown code and never trusts charged=true', () => {
    const value = extractX402PaymentError({
      response: {
        data: {
          extensions: { acedatacloud: { paymentError: { code: 'future_internal_code', charged: true } } }
        }
      }
    });
    expect(value.code).toBe('payment_failed');
    expect(value.charged).toBeUndefined();
  });

  it('narrowly recognizes the historical Solana account fingerprint', () => {
    const historical = (index: number) =>
      extractX402PaymentError({
        metadata: {
          x402: {
            last_error: {
              stage: 'verify',
              reason: 'transaction_simulation_failed',
              details: {
                verify_response: {
                  invalid_message: `Simulation failed: TransactionErrorInstructionError((${index}, Fieldless(InvalidAccountData)))`
                }
              }
            }
          }
        }
      });
    expect(historical(2)).toMatchObject({ code: 'payer_token_account_missing', charged: false });
    expect(historical(3).code).toBe('payment_failed');
  });
});
