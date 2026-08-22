import axios from 'axios';
import { Buffer } from 'buffer';
import { Transaction } from '@solana/web3.js';
import { reactive } from 'vue';
import { BASE_URL_PLATFORM } from '@/constants';
import { track } from '@/plugins/telemetry';

export const CONTINUOUS_PAYMENT_PROFILE = 'solana-recurring-delegation-v1';
export const CONTINUOUS_PAYMENT_HEADER = 'X-X402-Authorization';

export interface ContinuousPaymentAuthorization {
  id: string;
  wallet: string;
  source_token_account: string;
  subscription_authority: string;
  delegation: string;
  delegatee: string;
  delegation_nonce: string;
  daily_limit_atomic: string;
  period_seconds: number;
  expires_at: string;
  state: 'pending' | 'active' | 'disabled' | 'revoked' | 'expired' | 'invalid';
}

export interface SetupResponse {
  setup_token: string;
  wallet: string;
  authority_init_id?: number | null;
  transactions?: Partial<Record<TransactionAction, SubmittedTransaction>>;
}

interface PreparedTransaction {
  action: TransactionAction;
  transaction: string;
  last_valid_block_height: number;
  authority_init_id?: number | null;
  delegation?: string | null;
}

interface SubmittedTransaction {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
}

type TransactionAction = 'init_authority' | 'create_delegation' | 'revoke_delegation';

const state = reactive<{ authorization?: ContinuousPaymentAuthorization; selected: boolean }>({ selected: false });

export function continuousPaymentAuthorization() {
  return state.authorization;
}

export function selectContinuousPayment(selected: boolean) {
  state.selected = selected;
}

export function continuousPaymentActive() {
  return state.selected && state.authorization?.state === 'active';
}

export function continuousPaymentHeaders(token?: string): Record<string, string> {
  if (!token || !continuousPaymentActive()) return {};
  return { authorization: `Bearer ${token}`, [CONTINUOUS_PAYMENT_HEADER]: CONTINUOUS_PAYMENT_PROFILE };
}

function headers(token: string) {
  return { authorization: `Bearer ${token}` };
}

function errorCode(error: any): string {
  return String(error?.response?.data?.code || error?.response?.data?.detail || error?.name || 'unknown').slice(0, 120);
}

function traceId(error: any): string | undefined {
  return error?.response?.data?.trace_id || error?.response?.headers?.['x-request-id'];
}

function event(name: string, action: string, error?: any) {
  track(name, {
    action,
    ...(error ? { error: errorCode(error), trace_id: traceId(error) } : {})
  });
}

export async function refreshContinuousPaymentAuthorization(token?: string) {
  const response = await axios.get<{ authorization?: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/',
    { baseURL: BASE_URL_PLATFORM, headers: token ? headers(token) : {} }
  );
  state.authorization = response.data.authorization;
  return state.authorization;
}

function walletSigner(walletApi: any) {
  const wallet = walletApi?.publicKey?.value?.toBase58?.();
  const signTransaction = walletApi?.signTransaction?.value;
  if (!wallet || typeof signTransaction !== 'function') throw new Error('Connect a Solana wallet first');
  return { wallet, signTransaction };
}

async function signPreparedTransaction(walletApi: any, encoded: string): Promise<string> {
  const { signTransaction } = walletSigner(walletApi);
  const transaction = Transaction.from(Buffer.from(encoded, 'base64'));
  const signed = await signTransaction(transaction);
  return Buffer.from(signed.serialize()).toString('base64');
}

async function prepare(token: string, setupToken: string, action: TransactionAction): Promise<PreparedTransaction> {
  return (
    await axios.post<PreparedTransaction>(
      '/api/v1/x402/payment-authorization/transaction/prepare/',
      { setup_token: setupToken, action },
      { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
    )
  ).data;
}

async function submit(
  token: string,
  setupToken: string,
  action: TransactionAction,
  signedTransaction: string
): Promise<SubmittedTransaction> {
  return (
    await axios.post<SubmittedTransaction>(
      '/api/v1/x402/payment-authorization/transaction/submit/',
      { setup_token: setupToken, action, signed_transaction: signedTransaction },
      { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
    )
  ).data;
}

async function status(token: string, setupToken: string, action: TransactionAction): Promise<SubmittedTransaction> {
  return (
    await axios.post<SubmittedTransaction>(
      '/api/v1/x402/payment-authorization/transaction/status/',
      { setup_token: setupToken, action },
      { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
    )
  ).data;
}

async function waitForConfirmation(
  token: string,
  setupToken: string,
  action: TransactionAction,
  initial: SubmittedTransaction
) {
  let result = initial;
  for (let attempt = 0; result.status === 'pending' && attempt < 30; attempt += 1) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 2_000));
    result = await status(token, setupToken, action);
  }
  if (result.status === 'confirmed') return result;
  throw new Error(`Transaction ${result.status}; retry to resume setup`);
}

async function signAndSubmit(
  token: string,
  setupToken: string,
  action: TransactionAction,
  walletApi: any,
  existing?: SubmittedTransaction
) {
  if (existing) return waitForConfirmation(token, setupToken, action, existing);
  event('x402_continuous_payment_submit', `${action}:prepare`);
  const prepared = await prepare(token, setupToken, action);
  event('x402_continuous_payment_submit', `${action}:sign`);
  const signed = await signPreparedTransaction(walletApi, prepared.transaction);
  event('x402_continuous_payment_submit', `${action}:submit`);
  const result = await submit(token, setupToken, action, signed);
  return waitForConfirmation(token, setupToken, action, result);
}

export async function enableContinuousPayment(options: {
  token: string;
  walletApi: any;
  dailyLimitAtomic: string;
  expiryTs: number;
}) {
  const { wallet } = walletSigner(options.walletApi);
  try {
    event('x402_continuous_payment_submit', 'enable:setup');
    const setup = (
      await axios.post<SetupResponse>(
        '/api/v1/x402/payment-authorization/setup/',
        { wallet, daily_limit_atomic: options.dailyLimitAtomic, expiry_ts: options.expiryTs },
        { baseURL: BASE_URL_PLATFORM, headers: headers(options.token) }
      )
    ).data;
    if (setup.authority_init_id == null) {
      await signAndSubmit(
        options.token,
        setup.setup_token,
        'init_authority',
        options.walletApi,
        setup.transactions?.init_authority
      );
    }
    await signAndSubmit(
      options.token,
      setup.setup_token,
      'create_delegation',
      options.walletApi,
      setup.transactions?.create_delegation
    );
    const confirmed = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
      '/api/v1/x402/payment-authorization/confirm/',
      { setup_token: setup.setup_token },
      { baseURL: BASE_URL_PLATFORM, headers: headers(options.token) }
    );
    state.authorization = confirmed.data.authorization;
    event('x402_continuous_payment_success', 'enable:confirm');
    return state.authorization;
  } catch (error) {
    event('x402_continuous_payment_failed', 'enable', error);
    throw error;
  }
}

export async function enableExistingContinuousPayment(token: string) {
  const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/enable/',
    {},
    { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
  );
  state.authorization = response.data.authorization;
  return state.authorization;
}

export async function disableContinuousPayment(token: string) {
  const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/disable/',
    {},
    { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
  );
  state.authorization = response.data.authorization;
  return state.authorization;
}

export async function revokeContinuousPayment(token: string, walletApi: any) {
  const { wallet } = walletSigner(walletApi);
  if (!state.authorization || wallet !== state.authorization.wallet) {
    throw new Error('Connect the wallet that created this authorization');
  }
  try {
    const setup = (
      await axios.post<SetupResponse>(
        '/api/v1/x402/payment-authorization/revoke-setup/',
        {},
        { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
      )
    ).data;
    await signAndSubmit(token, setup.setup_token, 'revoke_delegation', walletApi);
    const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
      '/api/v1/x402/payment-authorization/revoke-confirm/',
      { setup_token: setup.setup_token },
      { baseURL: BASE_URL_PLATFORM, headers: headers(token) }
    );
    state.authorization = response.data.authorization;
    event('x402_continuous_payment_success', 'revoke:confirm');
    return state.authorization;
  } catch (error) {
    event('x402_continuous_payment_failed', 'revoke', error);
    throw error;
  }
}
