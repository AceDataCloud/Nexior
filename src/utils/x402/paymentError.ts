export const X402_PAYMENT_ERROR_CODES = [
  'payer_token_account_missing',
  'insufficient_token_balance',
  'authorization_expired',
  'wallet_rejected',
  'network_mismatch',
  'invalid_signature',
  'payment_requirements_unavailable',
  'facilitator_unavailable',
  'settlement_pending',
  'settlement_failed',
  'payment_failed'
] as const;

export type X402PaymentErrorCode = (typeof X402_PAYMENT_ERROR_CODES)[number];
export type X402ErrorContext = 'order' | 'request';

export interface CanonicalX402PaymentError {
  code: X402PaymentErrorCode;
  params: Record<string, string>;
  stage?: 'sign' | 'verify' | 'settle';
  retryable: boolean;
  charged?: boolean;
}

export interface X402ErrorPresentation extends CanonicalX402PaymentError {
  title: string;
  description: string;
  safety?: string;
  nextStep: string;
  technicalCode: string;
  severity: 'error' | 'warning';
}

type Translate = (key: string, params?: Record<string, string>) => unknown;

const codes = new Set<string>(X402_PAYMENT_ERROR_CODES);
const safeParamKeys = new Set(['network', 'asset', 'requiredAmount', 'currency']);
const legacyReasons: Record<string, X402PaymentErrorCode> = {
  payer_token_account_missing: 'payer_token_account_missing',
  invalid_exact_evm_insufficient_balance: 'insufficient_token_balance',
  permit2_insufficient_balance: 'insufficient_token_balance',
  INSUFFICIENT_FUNDS: 'insufficient_token_balance',
  invalid_exact_evm_payload_authorization_valid_before: 'authorization_expired',
  permit2_deadline_expired: 'authorization_expired',
  network_mismatch: 'network_mismatch',
  invalid_exact_evm_payload_signature: 'invalid_signature',
  invalid_exact_svm_payload_signature: 'invalid_signature',
  invalid_permit2_signature: 'invalid_signature'
};

function record(value: unknown): Record<string, any> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : undefined;
}

function safeParams(value: unknown): Record<string, string> {
  const source = record(value);
  if (!source) return {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key, item]) => safeParamKeys.has(key) && (typeof item === 'string' || typeof item === 'number'))
      .map(([key, item]) => [key, String(item).slice(0, 128)])
  );
}

function isWalletRejection(source: Record<string, any>): boolean {
  return (
    source.code === 4001 ||
    source.code === 'ACTION_REJECTED' ||
    source.name === 'WalletSignTransactionError' ||
    source.cause?.code === 4001
  );
}

function historicalCode(source: Record<string, any>): X402PaymentErrorCode | undefined {
  const reason = typeof source.reason === 'string' ? source.reason : '';
  if (legacyReasons[reason]) return legacyReasons[reason];
  const details = record(source.details);
  const response = record(details?.verify_response) || record(details?.verifyResponse);
  const diagnostic = String(response?.invalid_message || response?.invalidMessage || '');
  if (
    source.stage === 'verify' &&
    reason === 'transaction_simulation_failed' &&
    diagnostic.includes('TransactionErrorInstructionError((2, Fieldless(InvalidAccountData)))')
  ) {
    return 'payer_token_account_missing';
  }
  return undefined;
}

export function extractX402PaymentError(source: unknown): CanonicalX402PaymentError {
  const root = record(source) || {};
  if (isWalletRejection(root)) {
    return { code: 'wallet_rejected', params: {}, stage: 'sign', retryable: true };
  }
  const response = record(root.response);
  const data = record(response?.data) || root;
  const extensions = record(data.extensions);
  const namespace = record(extensions?.acedatacloud);
  const extensionError = record(namespace?.paymentError);
  const metadataError = record(record(record(data.metadata)?.x402)?.last_error);
  const structuredMetadata = metadataError?.code ? metadataError : undefined;
  const candidate = extensionError || structuredMetadata || (codes.has(String(data.code)) ? data : undefined);
  if (candidate) {
    const rawCode = String(candidate.code || '');
    const code = (codes.has(rawCode) ? rawCode : 'payment_failed') as X402PaymentErrorCode;
    const stage = ['sign', 'verify', 'settle'].includes(candidate.stage) ? candidate.stage : undefined;
    return {
      code,
      params: safeParams(candidate.params),
      stage,
      retryable: Boolean(candidate.retryable),
      ...(candidate.charged === false ? { charged: false } : {})
    };
  }
  const historical = metadataError || data;
  const code = historicalCode(historical) || 'payment_failed';
  return {
    code,
    params: safeParams(historical.params),
    stage: ['sign', 'verify', 'settle'].includes(historical.stage) ? historical.stage : undefined,
    retryable: code !== 'payment_failed',
    ...(historical.stage === 'verify' && code !== 'payment_failed' ? { charged: false } : {})
  };
}

function translated(translate: Translate, key: string, params: Record<string, string>): string {
  const value = String(translate(key, params));
  return value === key ? '' : value;
}

export function resolveX402PaymentError(
  source: unknown,
  translate: Translate,
  context: X402ErrorContext = 'order'
): X402ErrorPresentation {
  const error = extractX402PaymentError(source);
  const base = `order.x402Errors.codes.${error.code}`;
  return {
    ...error,
    title: translated(translate, `${base}.title`, error.params),
    description: translated(translate, `${base}.description`, error.params),
    safety: error.charged === false ? translated(translate, 'order.x402Errors.safety.notCharged', {}) : undefined,
    nextStep: translated(
      translate,
      `${base}.${context === 'order' ? 'nextStepOrder' : 'nextStepRequest'}`,
      error.params
    ),
    technicalCode: `${translated(translate, 'order.x402Errors.labels.technicalCode', {})}: ${error.code}`,
    severity: error.code === 'settlement_pending' ? 'warning' : 'error'
  };
}

export function isX402Challenge(error: unknown): boolean {
  const root = record(error);
  const response = record(root?.response);
  const data = record(response?.data);
  return response?.status === 402 && Array.isArray(data?.accepts) && data.accepts.length > 0;
}
