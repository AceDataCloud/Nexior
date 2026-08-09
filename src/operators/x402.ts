import axios, { AxiosResponse } from 'axios';
import type { PaymentRequirement } from '@acedatacloud/x402-client';
import { BASE_URL_PLATFORM, BASE_URL_X402 } from '@/constants';
import { activeEvmWallet, activeWalletRail } from '@/utils/x402/evmWallet';
import { continuousPaymentActive, continuousPaymentHeaders } from '@/utils/x402/continuousPayment';

const BASE_NETWORK = 'eip155:8453';
const SOLANA_NETWORK = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const USDC_DECIMALS = 6;

export type PaymentMode = 'credits' | 'x402';

export interface X402WalletContext {
  publicKey: { toBase58(): string; toString(): string };
  signTransaction(tx: unknown): Promise<unknown>;
}

export function resolveX402WalletContext(walletApi: any): X402WalletContext | undefined {
  if (activeWalletRail() === 'base') {
    const evm = activeEvmWallet();
    if (!evm) return undefined;
    return {
      publicKey: { toBase58: () => evm.address, toString: () => evm.address },
      signTransaction: async () => {
        throw new Error('Solana signing is unavailable while Base is selected');
      }
    };
  }
  const publicKey = walletApi?.publicKey?.value;
  const adapter = walletApi?.wallet?.value?.adapter;
  if (!publicKey || !adapter?.signTransaction) return undefined;
  return { publicKey, signTransaction: adapter.signTransaction.bind(adapter) };
}

export interface X402PaymentQuote {
  amountAtomic: string;
  amountUsdc: string;
  network: string;
  requirement: PaymentRequirement;
}

export interface X402PaymentOptions {
  wallet: X402WalletContext;
  confirm(quote: X402PaymentQuote): Promise<boolean>;
  identityToken?: string;
}

export interface OperatorRequestOptions {
  token?: string;
  mode?: PaymentMode;
  x402?: X402PaymentOptions;
  signal?: AbortSignal;
}

export class X402PaymentCancelledError extends Error {
  constructor() {
    super('X402 payment was cancelled');
    this.name = 'X402PaymentCancelledError';
  }
}

function selectExact(accepts: PaymentRequirement[], rail: 'base' | 'solana' = 'base'): PaymentRequirement | undefined {
  const network = rail === 'base' ? BASE_NETWORK : SOLANA_NETWORK;
  return accepts.find((item) => item.network === network && item.scheme === 'exact');
}

export function formatAtomicUsdc(value: string, decimals = USDC_DECIMALS): string {
  const amount = BigInt(value);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = (absolute % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

function decodePaymentRequired(encoded: string): { accepts: PaymentRequirement[] } {
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as { accepts: PaymentRequirement[] };
}

function paymentRequired(error: unknown): { accepts: PaymentRequirement[] } {
  if (!axios.isAxiosError(error) || error.response?.status !== 402) throw error;
  const header = error.response.headers?.['payment-required'];
  if (typeof header === 'string' && header) return decodePaymentRequired(header);
  return error.response.data as { accepts: PaymentRequirement[] };
}

function quoteFromChallenge(challenge: { accepts: PaymentRequirement[] }): X402PaymentQuote {
  const requirement = selectExact(challenge.accepts || [], activeWalletRail());
  const amountAtomic = requirement?.amount || requirement?.maxAmountRequired;
  if (!requirement || !amountAtomic) throw new Error('No supported exact payment option is available');
  return {
    amountAtomic,
    amountUsdc: formatAtomicUsdc(amountAtomic),
    network: requirement.network,
    requirement
  };
}

export async function quoteX402(
  path: string,
  data: unknown,
  headers: Record<string, string> = { accept: 'application/json', 'content-type': 'application/json' },
  identityToken?: string
): Promise<X402PaymentQuote> {
  try {
    await axios.post(path, data, {
      baseURL: BASE_URL_X402,
      headers: { ...headers, ...(identityToken ? { authorization: `Bearer ${identityToken}` } : {}) }
    });
    throw new Error('x402 endpoint did not return a payment requirement');
  } catch (error) {
    return quoteFromChallenge(paymentRequired(error));
  }
}

async function fetchSolanaBlockhash(network: string): Promise<string> {
  const response = await axios.get<{ blockhash?: string }>('/api/v1/x402/solana/latest-blockhash/', {
    baseURL: BASE_URL_PLATFORM,
    params: { network }
  });
  if (!response.data.blockhash) throw new Error('Invalid Solana blockhash response');
  return response.data.blockhash;
}

export async function postWithX402<T>(
  path: string,
  data: unknown,
  options: X402PaymentOptions,
  headers: Record<string, string> = { accept: 'application/json', 'content-type': 'application/json' }
): Promise<AxiosResponse<T>> {
  if (activeWalletRail() === 'solana' && continuousPaymentActive() && options.identityToken) {
    return axios.post<T>(path, data, {
      baseURL: BASE_URL_X402,
      headers: { ...headers, ...continuousPaymentHeaders(options.identityToken) }
    });
  }
  try {
    return await axios.post<T>(path, data, {
      baseURL: BASE_URL_X402,
      headers: {
        ...headers,
        ...(options.identityToken ? { authorization: `Bearer ${options.identityToken}` } : {})
      }
    });
  } catch (error) {
    const challenge = paymentRequired(error);
    const evmWallet = activeEvmWallet();
    const rail = activeWalletRail();
    const requirement = selectExact(challenge.accepts || [], rail);
    const amountAtomic = requirement?.amount || requirement?.maxAmountRequired;
    if (!requirement || !amountAtomic) throw new Error('No supported exact payment option is available');
    const quote: X402PaymentQuote = {
      amountAtomic,
      amountUsdc: formatAtomicUsdc(amountAtomic),
      network: requirement.network,
      requirement
    };

    const approved = await options.confirm(quote);
    if (!approved) throw new X402PaymentCancelledError();

    const { Buffer } = await import('buffer');
    if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
    let envelope: unknown;
    if (rail === 'base') {
      if (!evmWallet) throw new Error('Connect a Base wallet before signing');
      const { signEVMPayment } = await import('@acedatacloud/x402-client');
      envelope = await signEVMPayment(requirement, evmWallet.provider, evmWallet.address);
    } else {
      const { buildSolanaPayment } = await import('@acedatacloud/x402-client/solana');
      const blockhash = await fetchSolanaBlockhash(requirement.network);
      envelope = await buildSolanaPayment(requirement, options.wallet, blockhash);
    }
    const paymentSignature = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
    return axios.post<T>(path, data, {
      baseURL: BASE_URL_X402,
      headers: {
        ...headers,
        'PAYMENT-SIGNATURE': paymentSignature,
        ...(options.identityToken ? { authorization: `Bearer ${options.identityToken}` } : {})
      }
    });
  }
}
