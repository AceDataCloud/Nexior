/**
 * Solana X402 Payment Integration
 *
 * This implementation follows Phantom's official guidance for avoiding
 * "could be malicious" warnings:
 * https://docs.phantom.com/solana/domain-and-transaction-warnings
 *
 * Key principles:
 * 1. Always use signAndSendTransaction (not signTransaction)
 * 2. User wallet is both signer AND fee payer
 * 3. Get fresh blockhash directly from Solana RPC
 * 4. Confirm transaction after sending
 */

// `@solana/web3.js` is heavy (~2 MB / 650 KB gzipped). Keep types only at the top
// level so the runtime module is loaded lazily inside the exported helpers and
// never enters the application's static import graph (vendor-web3 chunk stays
// dynamic-only and is no longer preloaded on initial page load).
import type {
  Connection as ConnectionType,
  PublicKey as PublicKeyType,
  Transaction as TransactionType,
  TransactionInstruction as TransactionInstructionType
} from '@solana/web3.js';

type SolanaWeb3 = typeof import('@solana/web3.js');

let solanaWeb3Promise: Promise<SolanaWeb3> | null = null;
const loadSolanaWeb3 = (): Promise<SolanaWeb3> => {
  if (!solanaWeb3Promise) {
    solanaWeb3Promise = import('@solana/web3.js');
  }
  return solanaWeb3Promise;
};

// RPC endpoints
const SOLANA_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

// Solana program IDs (raw strings; `PublicKey` instances are constructed lazily
// after the module is loaded).
const TOKEN_PROGRAM_ID_STR = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM_ID_STR = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

/**
 * Convert Uint8Array to base64 string (browser-compatible, no Node.js Buffer)
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Resolve RPC URL based on network
 */
function resolveRpcUrl(network: string, customRpcUrl?: string): string {
  if (customRpcUrl) return customRpcUrl;
  if (network.includes('devnet')) return SOLANA_DEVNET_RPC;
  return SOLANA_MAINNET_RPC;
}

/**
 * Find Associated Token Account address
 */
function findAta(web3: SolanaWeb3, owner: PublicKeyType, mint: PublicKeyType): PublicKeyType {
  const tokenProgramId = new web3.PublicKey(TOKEN_PROGRAM_ID_STR);
  const associatedTokenProgramId = new web3.PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID_STR);
  const [ata] = web3.PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgramId.toBuffer(), mint.toBuffer()],
    associatedTokenProgramId
  );
  return ata;
}

/**
 * Create TransferChecked instruction data
 */
function createTransferCheckedData(amount: bigint, decimals: number): Uint8Array {
  const data = new Uint8Array(10);
  data[0] = 12; // TransferChecked instruction discriminator
  new DataView(data.buffer).setBigUint64(1, amount, true);
  data[9] = decimals;
  return data;
}

/**
 * Format a raw token amount with the given decimals into a human string.
 */
function formatTokenAmount(raw: bigint, decimals: number): string {
  const dp = Math.min(decimals, 6);
  return (Number(raw) / 10 ** decimals).toFixed(dp);
}

/**
 * Pre-flight check that the payer's USDC token account exists and holds
 * enough for the requested transfer. Throws a user-readable error if not.
 *
 * Skipped silently on transient RPC errors (rate limit / network blip) so a
 * flaky RPC never blocks an otherwise-valid payment — the facilitator will
 * still catch a genuine shortfall at settle time.
 */
async function ensureSufficientUsdcBalance(
  conn: ConnectionType,
  sourceAta: PublicKeyType,
  required: bigint,
  decimals: number,
  network: string
): Promise<void> {
  let have: bigint;
  try {
    const resp = await conn.getTokenAccountBalance(sourceAta, 'confirmed');
    have = BigInt(resp.value.amount || '0');
  } catch (e: any) {
    const msg = String(e?.message ?? '');
    // `getTokenAccountBalance` against a non-existent ATA returns a
    // "could not find account" / "Invalid param: could not find account"
    // error. That deterministically means the user has never received USDC
    // on this network → balance is 0.
    if (/could not find account|account not found|invalid param/i.test(msg)) {
      const requiredHuman = formatTokenAmount(required, decimals);
      throw new Error(
        `Your wallet has no USDC token account on ${network}. ` +
          `Receive at least ${requiredHuman} USDC there, then try again.`
      );
    }
    // Anything else (RPC 429, CORS, timeout): degrade gracefully.
    console.warn('[Solana X402] USDC balance precheck skipped due to RPC error:', e);
    return;
  }
  if (have < required) {
    const requiredHuman = formatTokenAmount(required, decimals);
    const haveHuman = formatTokenAmount(have, decimals);
    throw new Error(
      `Insufficient USDC balance on ${network}: need ${requiredHuman}, have ${haveHuman}. ` +
        `Top up your wallet and try again.`
    );
  }
}

/**
 * After `signAndSendTransaction` returns a signature, the wallet's RPC has
 * the tx but the X402 facilitator's RPC may not yet have indexed it. If we
 * submit the signature too quickly the facilitator returns
 * "Missing transaction payload" while it polls its RPC.
 *
 * We poll `getSignatureStatus` via plain HTTP (no WebSocket → no CORS
 * issues with public Solana RPC) until the tx is at least `confirmed`,
 * giving gossip propagation time to reach the facilitator's RPC.
 *
 * Times out silently — if our RPC is slow, the facilitator's built-in
 * retry (~15 s) is still the last line of defence.
 */
async function waitForSignatureConfirmation(conn: ConnectionType, signature: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  let pollInterval = 600;
  while (Date.now() - start < timeoutMs) {
    try {
      const status = await conn.getSignatureStatus(signature, { searchTransactionHistory: true });
      const value = status?.value;
      if (value?.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(value.err)}`);
      }
      const conf = value?.confirmationStatus;
      if (conf === 'confirmed' || conf === 'finalized') return;
    } catch (e: any) {
      if (e?.message?.startsWith('Transaction failed on-chain')) throw e;
      // Other errors are transient — continue polling.
    }
    await new Promise((r) => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval + 200, 1500);
  }
  console.warn(
    `[Solana X402] Confirmation polling timed out after ${timeoutMs}ms for ${signature.slice(0, 16)}… ` +
      `Submitting to facilitator anyway (its own retry will cover propagation lag).`
  );
}

/**
 * Build SPL Token TransferChecked instruction
 */
function buildTransferCheckedInstruction(
  web3: SolanaWeb3,
  source: PublicKeyType,
  mint: PublicKeyType,
  destination: PublicKeyType,
  authority: PublicKeyType,
  amount: bigint,
  decimals: number
): TransactionInstructionType {
  const instructionData = createTransferCheckedData(amount, decimals);
  const tokenProgramId = new web3.PublicKey(TOKEN_PROGRAM_ID_STR);
  return new web3.TransactionInstruction({
    programId: tokenProgramId,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false }
    ],
    data: Buffer.from(instructionData)
  });
}

export interface SolanaPaymentRequirements {
  payTo?: string;
  pay_to?: string;
  asset: string;
  maxAmountRequired?: string;
  max_amount_required?: string;
  scheme?: string;
  network?: string;
  extra?: {
    decimals?: number;
    computeUnitLimit?: number;
    compute_unit_limit?: number;
    computeUnitPriceMicroLamports?: number;
    compute_unit_price_micro_lamports?: number;
    rpcUrl?: string;
    rpc_url?: string;
  };
}

export interface SolanaPaymentResult {
  signature: string;
  header: string;
}

/**
 * Execute Solana payment using signAndSendTransaction
 *
 * This is the recommended approach by Phantom to avoid security warnings.
 * The user's wallet handles both signing and submitting the transaction,
 * allowing Phantom to properly simulate and protect against malicious transactions.
 */
export async function executeSolanaPayment(args: {
  requirements: SolanaPaymentRequirements;
  payerAddress: string;
  signAndSendTransaction: (tx: TransactionType) => Promise<string | { signature: string }>;
  fetchBlockhash?: (network: string) => Promise<string>;
}): Promise<SolanaPaymentResult> {
  const { requirements, payerAddress, signAndSendTransaction, fetchBlockhash } = args;

  const payTo = requirements.payTo || requirements.pay_to;
  if (!payTo) {
    throw new Error('Missing payTo in requirements');
  }

  const extra = requirements.extra || {};
  const decimals = Number(extra.decimals ?? 6);
  const computeUnitLimit = Number(extra.computeUnitLimit ?? extra.compute_unit_limit ?? 200_000);
  const computeUnitPriceMicroLamports = Number(
    extra.computeUnitPriceMicroLamports ?? extra.compute_unit_price_micro_lamports ?? 1
  );

  const amountStr = requirements.maxAmountRequired || requirements.max_amount_required || '0';
  const amount = BigInt(amountStr);
  if (amount <= 0n) {
    throw new Error(`Invalid payment amount: ${amountStr}`);
  }

  const network = String(requirements.network || 'solana').toLowerCase();
  const rpcUrl = resolveRpcUrl(network, extra.rpcUrl || extra.rpc_url);

  const web3 = await loadSolanaWeb3();
  const connection = new web3.Connection(rpcUrl, 'confirmed');

  const payerPubkey = new web3.PublicKey(payerAddress);
  const payToPubkey = new web3.PublicKey(payTo);
  const mint = new web3.PublicKey(requirements.asset);

  const sourceAta = findAta(web3, payerPubkey, mint);
  const destAta = findAta(web3, payToPubkey, mint);

  const tx = new web3.Transaction();

  if (computeUnitLimit > 0) {
    tx.add(web3.ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  }
  if (computeUnitPriceMicroLamports > 0) {
    tx.add(web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPriceMicroLamports }));
  }

  tx.add(buildTransferCheckedInstruction(web3, sourceAta, mint, destAta, payerPubkey, amount, decimals));

  // CRITICAL: User wallet is the fee payer
  tx.feePayer = payerPubkey;

  let blockhash: string;
  if (fetchBlockhash) {
    blockhash = await fetchBlockhash(network);
  } else {
    const { blockhash: rpcBlockhash } = await connection.getLatestBlockhash('confirmed');
    blockhash = rpcBlockhash;
  }
  tx.recentBlockhash = blockhash;

  // Pre-flight USDC balance check — fail fast (no gas spent, no wallet
  // popup) when the user's USDC is short. Without this we'd waste a
  // signature + on-chain attempt and the user only learns of the shortfall
  // from the facilitator's settle-stage "Payer has insufficient USDC
  // balance" error, which is responsible for ~35 % of historical X402
  // failures.
  await ensureSufficientUsdcBalance(connection, sourceAta, amount, decimals, network);

  const result = await signAndSendTransaction(tx);

  let signature: string | undefined;
  if (typeof result === 'string') {
    signature = result;
  } else if (result && typeof result === 'object') {
    signature = (result as any).signature || (result as any).txid || (result as any).transactionId;
  }

  if (!signature || typeof signature !== 'string') {
    throw new Error('Wallet did not return a valid transaction signature');
  }

  // Wait for the tx to land on our RPC before handing the signature to the
  // backend. Otherwise the facilitator's RPC race window shows up as
  // "Missing transaction payload" (~23 % of historical X402 failures).
  await waitForSignatureConfirmation(connection, signature);

  const payload = {
    x402Version: 1,
    scheme: requirements.scheme || 'exact',
    network: requirements.network || 'solana',
    payload: {
      signature
    }
  };

  const header = btoa(JSON.stringify(payload));

  return { signature, header };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use executeSolanaPayment instead
 */
export async function buildSolanaX402Header(args: {
  requirements: Record<string, any>;
  payerAddress: string;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction?: (tx: any, options?: any) => Promise<string | { signature: string }>;
  fetchLatestBlockhash?: (network: string) => Promise<string>;
  connection?: any;
}): Promise<string> {
  const {
    requirements,
    payerAddress,
    signAndSendTransaction,
    signTransaction,
    signAllTransactions,
    fetchLatestBlockhash
  } = args;

  // If signAndSendTransaction is available, use the new recommended approach
  if (signAndSendTransaction) {
    const result = await executeSolanaPayment({
      requirements: requirements as SolanaPaymentRequirements,
      payerAddress,
      signAndSendTransaction,
      fetchBlockhash: fetchLatestBlockhash
    });
    return result.header;
  }

  // Fallback to signTransaction for non-Phantom wallets
  console.warn(
    'Using signTransaction fallback. This may trigger security warnings in Phantom. ' +
      'Consider using signAndSendTransaction for better user experience.'
  );

  const extra = (requirements.extra || {}) as Record<string, any>;
  const network = String(requirements.network || 'solana').toLowerCase();
  const rpcUrl = resolveRpcUrl(network, extra.rpcUrl || extra.rpc_url);

  const web3 = await loadSolanaWeb3();
  const connection: ConnectionType = args.connection || new web3.Connection(rpcUrl, 'confirmed');

  const payerPubkey = new web3.PublicKey(payerAddress);
  const payTo = new web3.PublicKey(String(requirements.payTo || requirements.pay_to));
  const mint = new web3.PublicKey(String(requirements.asset));

  const localDecimals = Number(extra.decimals ?? 6);
  const localComputeUnitLimit = Number(extra.computeUnitLimit ?? extra.compute_unit_limit ?? 200_000);
  const localComputeUnitPriceMicroLamports = Number(
    extra.computeUnitPriceMicroLamports ?? extra.compute_unit_price_micro_lamports ?? 1
  );

  const amount = BigInt(String(requirements.maxAmountRequired || requirements.max_amount_required || '0'));
  if (amount <= 0n) throw new Error('Invalid amount');

  const sourceAta = findAta(web3, payerPubkey, mint);
  const destAta = findAta(web3, payTo, mint);

  const tx = new web3.Transaction();
  tx.feePayer = payerPubkey;

  if (localComputeUnitLimit > 0) {
    tx.add(web3.ComputeBudgetProgram.setComputeUnitLimit({ units: localComputeUnitLimit }));
  }
  if (localComputeUnitPriceMicroLamports > 0) {
    tx.add(web3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: localComputeUnitPriceMicroLamports }));
  }
  tx.add(buildTransferCheckedInstruction(web3, sourceAta, mint, destAta, payerPubkey, amount, localDecimals));

  if (args.fetchLatestBlockhash) {
    tx.recentBlockhash = await args.fetchLatestBlockhash(network);
  } else {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
  }

  let signed: any;
  if (signTransaction) {
    signed = await signTransaction(tx);
  } else if (signAllTransactions) {
    const signedTxs = await signAllTransactions([tx]);
    signed = Array.isArray(signedTxs) ? signedTxs[0] : undefined;
  }

  if (!signed) {
    throw new Error('Wallet did not return a signed transaction');
  }

  const serialized = signed.serialize({ requireAllSignatures: false, verifySignatures: false });
  const serializedB64 = uint8ArrayToBase64(serialized);

  const payloadObj = {
    x402Version: 1,
    scheme: requirements.scheme || 'exact',
    network: requirements.network || 'solana',
    payload: { serializedTransaction: serializedB64, transaction: serializedB64 }
  };

  return btoa(JSON.stringify(payloadObj));
}
