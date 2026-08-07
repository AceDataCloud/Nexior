declare module '@acedatacloud/x402-client/solana' {
  import type { PaymentRequirement, SolanaWalletAdapter, X402PaymentEnvelope } from '@acedatacloud/x402-client';

  export function buildSolanaPayment(
    requirements: PaymentRequirement,
    wallet: SolanaWalletAdapter,
    blockhash: string
  ): Promise<X402PaymentEnvelope>;
}
