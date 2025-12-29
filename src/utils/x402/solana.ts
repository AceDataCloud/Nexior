export type X402SolanaBlockhashFetcher = (network: string) => Promise<string>;

export async function buildSolanaX402Header(args: {
  requirements: Record<string, any>;
  payerAddress: string;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  fetchLatestBlockhash: X402SolanaBlockhashFetcher;
}): Promise<string> {
  const { requirements, payerAddress, signTransaction, signAllTransactions, fetchLatestBlockhash } = args;

  const { PublicKey, Transaction, ComputeBudgetProgram, TransactionInstruction } = await import('@solana/web3.js');
  const { Buffer } = await import('buffer');

  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

  const payerPubkey = new PublicKey(payerAddress);
  const payTo = new PublicKey(String(requirements.payTo || requirements.pay_to));
  const mint = new PublicKey(String(requirements.asset));

  const extra = (requirements.extra || {}) as Record<string, any>;
  const feePayerStr = String(extra.feePayer || extra.fee_payer || '');
  if (!feePayerStr) {
    throw new Error('Missing feePayer in Solana payment requirements');
  }
  if (feePayerStr === payerAddress) {
    throw new Error('Invalid Solana payment: payer wallet must not be the fee payer wallet (switch wallet and try again).');
  }
  const feePayer = new PublicKey(feePayerStr);
  const decimals = Number(extra.decimals ?? 6);
  const computeUnitLimit = Number(extra.computeUnitLimit ?? extra.compute_unit_limit ?? 0);
  const computeUnitPriceMicroLamports = Number(
    extra.computeUnitPriceMicroLamports ??
      extra.compute_unit_price_micro_lamports ??
      extra.computeUnitPriceLamports ??
      0
  );

  const amount = BigInt(String(requirements.maxAmountRequired || requirements.max_amount_required || '0'));
  if (amount <= 0n) throw new Error('Invalid amount');

  const findAta = (owner: any, mintPk: any) => {
    const [ata] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return ata;
  };

  const sourceAta = findAta(payerPubkey, mint);
  const destAta = findAta(payTo, mint);

  const transferCheckedData = new Uint8Array(10);
  transferCheckedData[0] = 12;
  new DataView(transferCheckedData.buffer).setBigUint64(1, amount, true);
  transferCheckedData[9] = decimals;

  const transferIx = new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: sourceAta, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destAta, isSigner: false, isWritable: true },
      { pubkey: payerPubkey, isSigner: true, isWritable: false }
    ],
    data: Buffer.from(transferCheckedData)
  });

  const tx = new Transaction();
  tx.feePayer = feePayer;
  if (Number.isFinite(computeUnitLimit) && computeUnitLimit > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: Math.floor(computeUnitLimit) }));
  }
  if (Number.isFinite(computeUnitPriceMicroLamports) && computeUnitPriceMicroLamports > 0) {
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Math.floor(computeUnitPriceMicroLamports) }));
  }
  tx.add(transferIx);

  const network = String(requirements.network || 'solana').toLowerCase();
  tx.recentBlockhash = await fetchLatestBlockhash(network);

  const describeError = (error: any): string => {
    if (!error) return 'Unknown error';
    const message = typeof error?.message === 'string' ? error.message : String(error);
    const name = typeof error?.name === 'string' ? error.name : '';
    if (name && name !== 'Error' && !message.startsWith(name)) return `${name}: ${message}`;
    return message;
  };

  const signViaAll = async () => {
    if (!signAllTransactions) return undefined;
    const signedTxs = await signAllTransactions([tx]);
    return Array.isArray(signedTxs) ? signedTxs[0] : undefined;
  };

  let signed: any;
  try {
    if (signTransaction) {
      signed = await signTransaction(tx);
    } else {
      signed = await signViaAll();
    }
  } catch (error: any) {
    if (signTransaction && signAllTransactions) {
      try {
        signed = await signViaAll();
      } catch (fallbackError: any) {
        throw new Error(
          `Solana wallet signing failed: ${describeError(error)} (fallback failed: ${describeError(fallbackError)})`
        );
      }
    } else {
      throw new Error(`Solana wallet signing failed: ${describeError(error)}`);
    }
  }
  if (!signed) {
    throw new Error('Solana wallet did not return a signed transaction');
  }

  const serialized = signed.serialize({ requireAllSignatures: false, verifySignatures: false });
  const serializedB64 = Buffer.from(serialized).toString('base64');

  const payload = {
    x402Version: 1,
    scheme: requirements.scheme || 'exact',
    network: requirements.network || 'solana',
    payload: { serializedTransaction: serializedB64, transaction: serializedB64 }
  };
  return btoa(JSON.stringify(payload));
}

