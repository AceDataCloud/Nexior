import axios from 'axios';
import { Buffer } from 'buffer';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction, type Connection } from '@solana/web3.js';
import { reactive } from 'vue';
import { BASE_URL_PLATFORM } from '@/constants';

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
  program_id: string;
  asset: string;
  token_program: string;
  wallet: string;
  source_token_account: string;
  subscription_authority: string;
  delegatee: string;
  nonce: string;
  daily_limit_atomic: string;
  period_seconds: number;
  expiry_ts: number;
  memo: string;
}

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

export async function refreshContinuousPaymentAuthorization(token?: string) {
  const response = await axios.get<{ authorization?: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/',
    { baseURL: BASE_URL_PLATFORM, headers: token ? { authorization: `Bearer ${token}` } : {} }
  );
  state.authorization = response.data.authorization;
  return state.authorization;
}

function instruction(
  programId: string,
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>,
  data: Uint8Array
) {
  return new TransactionInstruction({
    programId: new PublicKey(programId),
    keys: keys.map((key) => ({ ...key, pubkey: new PublicKey(key.pubkey) })),
    data: Buffer.from(data)
  });
}

async function signAndSend(adapter: any, connection: Connection, transaction: Transaction) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = adapter.publicKey;
  const signed = await adapter.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

function authorityInitId(data: Buffer) {
  if (data.length < 106 || data[0] !== 0) throw new Error('Invalid subscription authority account');
  return data.readBigInt64LE(98);
}

export function recurringDelegationData(setup: SetupResponse, initId: bigint) {
  const data = Buffer.alloc(49);
  data[0] = 2;
  data.writeBigUInt64LE(BigInt(setup.nonce), 1);
  data.writeBigUInt64LE(BigInt(setup.daily_limit_atomic), 9);
  data.writeBigUInt64LE(BigInt(setup.period_seconds), 17);
  data.writeBigInt64LE(0n, 25);
  data.writeBigInt64LE(BigInt(setup.expiry_ts), 33);
  data.writeBigInt64LE(initId, 41);
  return data;
}

function memoInstruction(memo: string) {
  return new TransactionInstruction({
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    keys: [],
    data: Buffer.from(memo, 'utf8')
  });
}

export async function enableContinuousPayment(options: {
  token: string;
  walletApi: any;
  connection: Connection;
  dailyLimitAtomic: string;
  expiryTs: number;
}) {
  const adapter = options.walletApi?.wallet?.value?.adapter;
  const wallet = options.walletApi?.publicKey?.value?.toBase58?.();
  if (!adapter?.signTransaction || !adapter.publicKey || !wallet) throw new Error('Connect a Solana wallet first');
  const setup = (
    await axios.post<SetupResponse>(
      '/api/v1/x402/payment-authorization/setup/',
      { wallet, daily_limit_atomic: options.dailyLimitAtomic, expiry_ts: options.expiryTs },
      { baseURL: BASE_URL_PLATFORM, headers: { authorization: `Bearer ${options.token}` } }
    )
  ).data;

  let setupTx: string | undefined;
  let authorityInfo = await options.connection.getAccountInfo(new PublicKey(setup.subscription_authority), 'confirmed');
  if (!authorityInfo) {
    const init = instruction(
      setup.program_id,
      [
        { pubkey: setup.wallet, isSigner: true, isWritable: true },
        { pubkey: setup.subscription_authority, isSigner: false, isWritable: true },
        { pubkey: setup.asset, isSigner: false, isWritable: false },
        { pubkey: setup.source_token_account, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId.toBase58(), isSigner: false, isWritable: false },
        { pubkey: setup.token_program, isSigner: false, isWritable: false }
      ],
      Buffer.from([0])
    );
    setupTx = await signAndSend(adapter, options.connection, new Transaction().add(init));
    authorityInfo = await options.connection.getAccountInfo(new PublicKey(setup.subscription_authority), 'confirmed');
  }
  if (!authorityInfo) throw new Error('Subscription authority was not created');
  const initId = authorityInitId(authorityInfo.data);
  const nonceBytes = Buffer.alloc(8);
  nonceBytes.writeBigUInt64LE(BigInt(setup.nonce));
  const [delegation] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('delegation'),
      new PublicKey(setup.subscription_authority).toBuffer(),
      new PublicKey(setup.wallet).toBuffer(),
      new PublicKey(setup.delegatee).toBuffer(),
      nonceBytes
    ],
    new PublicKey(setup.program_id)
  );
  const data = recurringDelegationData(setup, initId);
  const create = instruction(
    setup.program_id,
    [
      { pubkey: setup.wallet, isSigner: true, isWritable: true },
      { pubkey: setup.subscription_authority, isSigner: false, isWritable: false },
      { pubkey: delegation.toBase58(), isSigner: false, isWritable: true },
      { pubkey: setup.delegatee, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId.toBase58(), isSigner: false, isWritable: false }
    ],
    data
  );
  const delegationTx = await signAndSend(
    adapter,
    options.connection,
    new Transaction().add(create, memoInstruction(setup.memo))
  );
  const confirmed = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/confirm/',
    {
      setup_token: setup.setup_token,
      setup_tx: setupTx,
      delegation: delegation.toBase58(),
      delegation_tx: delegationTx
    },
    { baseURL: BASE_URL_PLATFORM, headers: { authorization: `Bearer ${options.token}` } }
  );
  state.authorization = confirmed.data.authorization;
  return state.authorization;
}

export async function enableExistingContinuousPayment(token: string) {
  const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/enable/',
    {},
    { baseURL: BASE_URL_PLATFORM, headers: { authorization: `Bearer ${token}` } }
  );
  state.authorization = response.data.authorization;
}

export async function disableContinuousPayment(token: string) {
  const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/disable/',
    {},
    { baseURL: BASE_URL_PLATFORM, headers: { authorization: `Bearer ${token}` } }
  );
  state.authorization = response.data.authorization;
}

export async function revokeContinuousPayment(token: string, walletApi: any, connection: Connection) {
  if (!state.authorization) return;
  const adapter = walletApi?.wallet?.value?.adapter;
  if (!adapter?.signTransaction || !adapter.publicKey) throw new Error('Connect the authorized Solana wallet first');
  if (adapter.publicKey.toBase58() !== state.authorization.wallet) {
    throw new Error('Connect the wallet that created this authorization');
  }
  const revoke = instruction(
    'De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44',
    [
      { pubkey: state.authorization.wallet, isSigner: true, isWritable: false },
      { pubkey: state.authorization.delegation, isSigner: false, isWritable: true }
    ],
    Buffer.from([3])
  );
  const revokedTx = await signAndSend(adapter, connection, new Transaction().add(revoke));
  const response = await axios.post<{ authorization: ContinuousPaymentAuthorization }>(
    '/api/v1/x402/payment-authorization/revoke-confirm/',
    { revoked_tx: revokedTx },
    { baseURL: BASE_URL_PLATFORM, headers: { authorization: `Bearer ${token}` } }
  );
  state.authorization = response.data.authorization;
}
