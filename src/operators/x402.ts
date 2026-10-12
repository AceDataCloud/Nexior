import { isX402NetworkEnabled, assertX402NetworkEnabled } from '@/utils/x402/featureGate';
import axios, { AxiosResponse } from 'axios';
import type { PaymentRequirement } from '@acedatacloud/x402-client';
import { BASE_URL_PLATFORM, BASE_URL_X402 } from '@/constants';
import { activeEvmWallet, activeWalletRail } from '@/utils/x402/evmWallet';
import { continuousPaymentActive, continuousPaymentHeaders } from '@/utils/x402/continuousPayment';
import { extractX402PaymentError, type CanonicalX402PaymentError } from '@acedatacloud/core/x402';
import { clearScenarioPaymentError, setScenarioPaymentError } from '@/utils/x402/paymentErrorState';

import { paymentNetworkForRail, type WalletRail } from '@/utils/x402/networks';
const USDC_DECIMALS = 6;

export type PaymentMode = 'credits' | 'x402';

export interface X402WalletContext {
  publicKey: { toBase58(): string; toString(): string };
  signTransaction(tx: unknown): Promise<unknown>;
}

export function resolveX402WalletContext(walletApi: any): X402WalletContext | undefined {
  if (activeWalletRail() !== 'solana') {
    const evm = activeEvmWallet();
    if (!evm) return undefined;
    return {
      publicKey: { toBase58: () => evm.address, toString: () => evm.address },
      signTransaction: async () => {
        throw new Error('Solana signing is unavailable while an EVM network is selected');
      }
    };
  }
  const publicKey = walletApi?.publicKey?.value;
  const signTransaction = walletApi?.signTransaction?.value;
  if (!publicKey || typeof signTransaction !== 'function') return undefined;
  return { publicKey, signTransaction };
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

export class X402PaymentError extends Error {
  readonly paymentError: CanonicalX402PaymentError;

  constructor(paymentError: CanonicalX402PaymentError) {
    super(`X402 payment failed (${paymentError.code})`);
    this.name = 'X402PaymentError';
    this.paymentError = paymentError;
  }
}

const scenarioByPath: Array<[string, string]> = [
  ['/nano-banana/', 'nanobanana'],
  ['/openai/images/', 'openaiimage'],
  ['/digital-human/', 'digitalhuman'],
  ['/grok/', 'grokvideo'],
  ['/midjourney/', 'midjourney'],
  ['/producer/', 'producer'],
  ['/seedance/', 'seedance'],
  ['/minimax/', 'minimax'],
  ['/serp/', 'serp'],
  ['/suno/', 'suno'],
  ['/kling/', 'kling'],
  ['/maestro/', 'maestro'],
  ['/flux/', 'flux'],
  ['/qrart/', 'qrart'],
  ['/luma/', 'luma'],
  ['/pika/', 'pika'],
  ['/pixverse/', 'pixverse'],
  ['/hailuo/', 'hailuo'],
  ['/veo/', 'veo'],
  ['/sora/', 'sora'],
  ['/wan/', 'wan'],
  ['/omni/', 'omni'],
  ['/gemini/videos', 'omni']
];

function scenarioForPath(path: string): string | undefined {
  return scenarioByPath.find(([prefix]) => path.startsWith(prefix))?.[1];
}

export class X402PaymentCancelledError extends Error {
  constructor() {
    super('X402 payment was cancelled');
    this.name = 'X402PaymentCancelledError';
  }
}

function selectExact(accepts: PaymentRequirement[], rail: WalletRail = 'base'): PaymentRequirement | undefined {
  const network = paymentNetworkForRail(rail);
  if (!isX402NetworkEnabled(network)) return undefined;
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

function missingQuoteError(): X402PaymentError {
  return new X402PaymentError({
    code: 'payment_requirements_unavailable',
    params: { network: paymentNetworkForRail(activeWalletRail()) },
    stage: 'verify',
    retryable: true,
    charged: false
  });
}

function quoteFromChallenge(challenge: { accepts: PaymentRequirement[] }): X402PaymentQuote {
  const requirement = selectExact(challenge.accepts || [], activeWalletRail());
  const amountAtomic = requirement?.amount || requirement?.maxAmountRequired;
  if (!requirement || !amountAtomic) throw missingQuoteError();
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

export async function buildEVMPaymentSignatureHeader(
  requirement: PaymentRequirement,
  provider: { request(args: { method: string; params?: unknown[] }): Promise<unknown> },
  address: string
): Promise<string> {
  assertX402NetworkEnabled(requirement.network);
  const chainId = Number(/^eip155:([1-9][0-9]*)$/.exec(requirement.network)?.[1]);
  const actual = Number(await provider.request({ method: 'eth_chainId' }));
  if (!Number.isSafeInteger(chainId) || chainId !== actual || requirement.extra?.chainId !== chainId) {
    throw {
      code: 'network_mismatch',
      params: { network: requirement.network },
      stage: 'sign',
      retryable: true,
      charged: false
    };
  }
  const { Buffer } = await import('buffer');
  const { signEVMPayment } = await import('@acedatacloud/x402-client');
  const envelope = await signEVMPayment(requirement, provider, address);
  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
}

export async function postWithX402<T>(
  path: string,
  data: unknown,
  options: X402PaymentOptions,
  headers: Record<string, string> = { accept: 'application/json', 'content-type': 'application/json' }
): Promise<AxiosResponse<T>> {
  const scenario = scenarioForPath(path);
  if (scenario) clearScenarioPaymentError(scenario);
  if (activeWalletRail() === 'solana' && continuousPaymentActive() && options.identityToken) {
    try {
      const response = await axios.post<T>(path, data, {
        baseURL: BASE_URL_X402,
        headers: { ...headers, ...continuousPaymentHeaders(options.identityToken) }
      });
      if (scenario) clearScenarioPaymentError(scenario);
      return response;
    } catch (paymentFailure) {
      const canonical = extractX402PaymentError(paymentFailure);
      if (scenario) setScenarioPaymentError(scenario, canonical);
      throw new X402PaymentError(canonical);
    }
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
    if (!requirement || !amountAtomic) {
      const error = missingQuoteError();
      if (scenario) setScenarioPaymentError(scenario, error.paymentError);
      throw error;
    }
    const quote: X402PaymentQuote = {
      amountAtomic,
      amountUsdc: formatAtomicUsdc(amountAtomic),
      network: requirement.network,
      requirement
    };

    const approved = await options.confirm(quote);
    if (!approved) throw new X402PaymentCancelledError();

    try {
      let paymentSignature: string;
      if (rail !== activeWalletRail())
        throw {
          code: 'network_mismatch',
          params: { network: requirement.network },
          stage: 'sign',
          retryable: true,
          charged: false
        };
      if (rail !== 'solana') {
        if (!evmWallet) throw { code: 'signer_unavailable' };
        paymentSignature = await buildEVMPaymentSignatureHeader(requirement, evmWallet.provider, evmWallet.address);
      } else {
        const { Buffer } = await import('buffer');
        globalThis.Buffer ??= Buffer;
        const { buildSolanaPayment } = await import('@acedatacloud/x402-client/solana');
        const blockhash = await fetchSolanaBlockhash(requirement.network);
        const envelope = await buildSolanaPayment(requirement, options.wallet, blockhash);
        paymentSignature = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
      }
      const response = await axios.post<T>(path, data, {
        baseURL: BASE_URL_X402,
        headers: {
          ...headers,
          'PAYMENT-SIGNATURE': paymentSignature,
          ...(options.identityToken ? { authorization: `Bearer ${options.identityToken}` } : {})
        }
      });
      if (scenario) clearScenarioPaymentError(scenario);
      return response;
    } catch (paymentFailure) {
      const canonical = extractX402PaymentError(paymentFailure);
      if (canonical.code === 'wallet_rejected') throw new X402PaymentCancelledError();
      if (scenario) setScenarioPaymentError(scenario, canonical);
      throw new X402PaymentError(canonical);
    }
  }
}
