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

import { Connection, PublicKey, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';

// RPC endpoints
const SOLANA_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

// Solana program IDs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

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
function findAta(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
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
 * Build SPL Token TransferChecked instruction
 */
function buildTransferCheckedInstruction(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: bigint,
  decimals: number
): TransactionInstruction {
  const instructionData = createTransferCheckedData(amount, decimals);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
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
  signAndSendTransaction: (tx: Transaction) => Promise<string | { signature: string }>;
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

  const connection = new Connection(rpcUrl, 'confirmed');

  const payerPubkey = new PublicKey(payerAddress);
  const payToPubkey = new PublicKey(payTo);
  const mint = new PublicKey(requirements.asset);

  const sourceAta = findAta(payerPubkey, mint);
  const destAta = findAta(payToPubkey, mint);

  const tx = new Transaction();

  if (computeUnitLimit > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  }
  if (computeUnitPriceMicroLamports > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPriceMicroLamports }));
  }

  tx.add(buildTransferCheckedInstruction(sourceAta, mint, destAta, payerPubkey, amount, decimals));

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

  const connection = args.connection || new Connection(rpcUrl, 'confirmed');

  const payerPubkey = new PublicKey(payerAddress);
  const payTo = new PublicKey(String(requirements.payTo || requirements.pay_to));
  const mint = new PublicKey(String(requirements.asset));

  const localDecimals = Number(extra.decimals ?? 6);
  const localComputeUnitLimit = Number(extra.computeUnitLimit ?? extra.compute_unit_limit ?? 200_000);
  const localComputeUnitPriceMicroLamports = Number(
    extra.computeUnitPriceMicroLamports ?? extra.compute_unit_price_micro_lamports ?? 1
  );

  const amount = BigInt(String(requirements.maxAmountRequired || requirements.max_amount_required || '0'));
  if (amount <= 0n) throw new Error('Invalid amount');

  const sourceAta = findAta(payerPubkey, mint);
  const destAta = findAta(payTo, mint);

  const tx = new Transaction();
  tx.feePayer = payerPubkey;

  if (localComputeUnitLimit > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: localComputeUnitLimit }));
  }
  if (localComputeUnitPriceMicroLamports > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: localComputeUnitPriceMicroLamports }));
  }
  tx.add(buildTransferCheckedInstruction(sourceAta, mint, destAta, payerPubkey, amount, localDecimals));

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
