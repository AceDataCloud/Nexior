import axios, { AxiosResponse } from 'axios';
import type { PaymentRequirement } from '@acedatacloud/x402-client';
import { BASE_URL_PLATFORM, BASE_URL_X402 } from '@/constants';

const SOLANA_NETWORK = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const USDC_DECIMALS = 6;

export type PaymentMode = 'credits' | 'x402';

export interface X402WalletContext {
  publicKey: { toBase58(): string; toString(): string };
  signTransaction(tx: unknown): Promise<unknown>;
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

function selectSolanaExact(accepts: PaymentRequirement[]): PaymentRequirement | undefined {
  return accepts.find((item) => item.network === SOLANA_NETWORK && item.scheme === 'exact');
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
  try {
    return await axios.post<T>(path, data, { baseURL: BASE_URL_X402, headers });
  } catch (error) {
    const challenge = paymentRequired(error);
    const requirement = selectSolanaExact(challenge.accepts || []);
    const amountAtomic = requirement?.amount || requirement?.maxAmountRequired;
    if (!requirement || !amountAtomic) throw new Error('No Solana exact payment option is available');

    const approved = await options.confirm({
      amountAtomic,
      amountUsdc: formatAtomicUsdc(amountAtomic),
      network: requirement.network,
      requirement
    });
    if (!approved) throw new X402PaymentCancelledError();

    const [{ Buffer }, { buildSolanaPayment }] = await Promise.all([
      import('buffer'),
      import('@acedatacloud/x402-client/solana')
    ]);
    if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
    const blockhash = await fetchSolanaBlockhash(requirement.network);
    const envelope = await buildSolanaPayment(requirement, options.wallet, blockhash);
    const paymentSignature = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
    return axios.post<T>(path, data, {
      baseURL: BASE_URL_X402,
      headers: { ...headers, 'PAYMENT-SIGNATURE': paymentSignature }
    });
  }
}
