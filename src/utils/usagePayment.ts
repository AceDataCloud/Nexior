import { formatAtomicTokenAmount, getX402TransactionExplorerUrl } from '@acedatacloud/core/x402';
import { IApiUsage, IX402UsageMetadata } from '@/models/usage';

export interface X402UsagePayment {
  amount: string;
  originalAmount?: string;
  discountPercent?: string;
  discountSource?: 'ace' | 'manual';
  currency: string;
  network: string;
  transaction: string;
  payer?: string;
  explorerUrl?: string;
}

export function isX402Usage(usage: IApiUsage): boolean {
  return usage.metadata?.x402 === true;
}

export function getX402UsagePayment(usage: IApiUsage): X402UsagePayment | undefined {
  const metadata = usage.metadata;
  if (!isSettledMetadata(metadata)) return undefined;

  try {
    const paidAtomic = BigInt(metadata.x402_amount_atomic);
    const amount = formatAtomicTokenAmount(paidAtomic, metadata.x402_decimals);
    let originalAmount: string | undefined;
    let discountPercent: string | undefined;
    let discountSource: 'ace' | 'manual' | undefined;
    if (typeof metadata.x402_list_amount_atomic === 'string' && /^\d+$/.test(metadata.x402_list_amount_atomic)) {
      const listAtomic = BigInt(metadata.x402_list_amount_atomic);
      const percent = Number(metadata.x402_discount_percent);
      if (listAtomic > paidAtomic && Number.isFinite(percent) && percent > 0 && percent < 1) {
        originalAmount = formatAtomicTokenAmount(listAtomic, metadata.x402_decimals);
        if (metadata.x402_discount_type === 'Coin' && metadata.x402_discount_coin_policy_id) discountSource = 'ace';
        else if (metadata.x402_discount_type === 'Manual') discountSource = 'manual';
        if (discountSource) discountPercent = Number((percent * 100).toFixed(2)).toString();
      }
    }
    return {
      amount,
      originalAmount,
      discountPercent,
      discountSource,
      currency: metadata.x402_currency,
      network: metadata.x402_network,
      transaction: metadata.x402_tx,
      payer: typeof metadata.x402_payer === 'string' ? metadata.x402_payer : undefined,
      explorerUrl: getX402TransactionExplorerUrl(metadata.x402_network, metadata.x402_tx)
    };
  } catch {
    return undefined;
  }
}

export function getX402CopyableTransaction(usage: IApiUsage): string | undefined {
  const tx = usage.metadata?.x402_tx || usage.metadata?.x402_settle_attempt_tx;
  return typeof tx === 'string' && tx.length > 0 ? tx : undefined;
}

export function omitX402Metadata(metadata?: IX402UsageMetadata): Record<string, unknown> {
  if (!metadata) return {};
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) =>
        !key.startsWith('x402') &&
        key !== 'request' &&
        key !== 'response' &&
        (typeof value !== 'object' || value === null)
    )
  );
}

function isSettledMetadata(
  metadata?: IX402UsageMetadata
): metadata is IX402UsageMetadata &
  Required<
    Pick<IX402UsageMetadata, 'x402_amount_atomic' | 'x402_decimals' | 'x402_currency' | 'x402_network' | 'x402_tx'>
  > {
  return Boolean(
    metadata?.x402 === true &&
    metadata.x402_settlement_status === 'settled' &&
    typeof metadata.x402_amount_atomic === 'string' &&
    /^\d+$/.test(metadata.x402_amount_atomic) &&
    Number.isSafeInteger(metadata.x402_decimals) &&
    metadata.x402_decimals! >= 0 &&
    metadata.x402_decimals! <= 255 &&
    typeof metadata.x402_currency === 'string' &&
    metadata.x402_currency.length > 0 &&
    typeof metadata.x402_network === 'string' &&
    metadata.x402_network.length > 0 &&
    typeof metadata.x402_tx === 'string' &&
    metadata.x402_tx.length > 0
  );
}
