import type { PaymentRequirement } from '@acedatacloud/x402-client';
import type { INanobananaGenerateRequest, IOpenAIImageGenerateRequest } from '@/models';

const SOLANA_NETWORK = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const X402_BASE_URL = '/x402-api';
const USDC_DECIMALS = 6;
const TASK_STORAGE_PREFIX = 'x402-scenario-tasks';
const MAX_STORED_TASKS = 100;

type WalletTaskService = 'nano-banana' | 'openai';

export interface ScenarioWalletContext {
  publicKey: { toBase58(): string; toString(): string };
  signTransaction(tx: unknown): Promise<unknown>;
}

export interface ScenarioPaymentQuote {
  amountAtomic: string;
  amountUsdc: string;
  network: string;
  requirement: PaymentRequirement;
}

export type ConfirmScenarioPayment = (quote: ScenarioPaymentQuote) => Promise<boolean>;

export class ScenarioPaymentCancelledError extends Error {
  constructor() {
    super('X402 payment was cancelled');
    this.name = 'ScenarioPaymentCancelledError';
  }
}

export class ScenarioApiError extends Error {
  readonly response: { status: number; data: Record<string, any> };

  constructor(status: number, data: Record<string, any>) {
    const detail = data?.error?.message || data?.error || data?.detail || `Request failed (${status})`;
    super(String(detail));
    this.name = 'ScenarioApiError';
    this.response = { status, data };
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

async function responseJson(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { error: { message: text } };
  }
}

function paymentRequired(response: Response, fallback: Record<string, any>): { accepts: PaymentRequirement[] } {
  const encoded = response.headers.get('PAYMENT-REQUIRED');
  if (encoded) {
    try {
      const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)) as { accepts: PaymentRequirement[] };
    } catch {
      throw new ScenarioApiError(402, { error: { message: 'Invalid PAYMENT-REQUIRED header' } });
    }
  }
  return fallback as { accepts: PaymentRequirement[] };
}

async function postWithX402(
  path: string,
  body: Record<string, unknown>,
  wallet: ScenarioWalletContext,
  confirmPayment: ConfirmScenarioPayment
): Promise<Record<string, any>> {
  const url = `${X402_BASE_URL}${path}`;
  const headers = { accept: 'application/json', 'content-type': 'application/json' };
  let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  let payload = await responseJson(response);

  if (response.status === 402) {
    const challenge = paymentRequired(response, payload);
    const requirement = selectSolanaExact(challenge.accepts || []);
    const amountAtomic = requirement?.amount || requirement?.maxAmountRequired;
    if (!requirement || !amountAtomic) {
      throw new ScenarioApiError(402, { error: { message: 'No Solana exact payment option is available' } });
    }
    const approved = await confirmPayment({
      amountAtomic,
      amountUsdc: formatAtomicUsdc(amountAtomic),
      network: requirement.network,
      requirement
    });
    if (!approved) throw new ScenarioPaymentCancelledError();

    const [{ Buffer }, { createX402PaymentHandler }] = await Promise.all([
      import('buffer'),
      import('@acedatacloud/x402-client')
    ]);
    if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
    const signer = createX402PaymentHandler({
      network: 'solana',
      preferScheme: 'exact',
      solanaWallet: wallet
    });
    const signed = await signer({ url, method: 'POST', body, accepts: challenge.accepts });
    response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, ...signed.headers },
      body: JSON.stringify(body)
    });
    payload = await responseJson(response);
  }

  if (!response.ok) throw new ScenarioApiError(response.status, payload);
  return payload;
}

function taskIdFromResult(result: Record<string, any>): string {
  if (typeof result.task_id === 'string') return result.task_id;
  if (typeof result.data?.task_id === 'string') return result.data.task_id;
  if (typeof result.id === 'string') return result.id;
  return '';
}

export async function submitNanoWithX402(
  request: INanobananaGenerateRequest,
  wallet: ScenarioWalletContext,
  confirmPayment: ConfirmScenarioPayment
): Promise<{ taskId: string }> {
  const result = await postWithX402('/nano-banana/images', { ...request, async: true }, wallet, confirmPayment);
  const taskId = taskIdFromResult(result);
  if (!taskId) throw new Error('Nano Banana did not return a task ID');
  return { taskId };
}

export async function submitOpenAIImageWithX402(
  request: IOpenAIImageGenerateRequest,
  wallet: ScenarioWalletContext,
  confirmPayment: ConfirmScenarioPayment
): Promise<{ taskId: string }> {
  const result = await postWithX402('/openai/images/generations', { ...request, async: true }, wallet, confirmPayment);
  const taskId = taskIdFromResult(result);
  if (!taskId) throw new Error('GPT Image 2 did not return a task ID');
  return { taskId };
}

function taskStorageKey(service: WalletTaskService, walletAddress: string): string {
  return `${TASK_STORAGE_PREFIX}:${service}:${walletAddress}`;
}

export function walletTaskIds(service: WalletTaskService, walletAddress: string): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(taskStorageKey(service, walletAddress)) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && id.length > 0) : [];
  } catch {
    return [];
  }
}

export function rememberWalletTask(service: WalletTaskService, walletAddress: string, taskId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const ids = [taskId, ...walletTaskIds(service, walletAddress).filter((id) => id !== taskId)].slice(
      0,
      MAX_STORED_TASKS
    );
    localStorage.setItem(taskStorageKey(service, walletAddress), JSON.stringify(ids));
  } catch {
    // Wallet history remains available in the current response when storage is unavailable.
  }
}

export async function listWalletTasks<T>(
  service: WalletTaskService,
  taskIds: string[],
  filter: { offset?: number; limit?: number; createdAtMin?: number; createdAtMax?: number } = {}
): Promise<{ items: T[]; count: number }> {
  if (taskIds.length === 0) return { items: [], count: 0 };
  const response = await fetch(`${X402_BASE_URL}/${service}/tasks`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'retrieve_batch',
      ids: taskIds,
      offset: filter.offset,
      limit: filter.limit,
      created_at_min: filter.createdAtMin,
      created_at_max: filter.createdAtMax
    })
  });
  const payload = await responseJson(response);
  if (!response.ok) throw new ScenarioApiError(response.status, payload);
  return { items: payload.items || [], count: payload.count || 0 };
}
