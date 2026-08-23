import { describe, expect, it, vi } from 'vitest';
import { signEVMPayment, type PaymentRequirement } from '@acedatacloud/x402-client';

const requirement: PaymentRequirement = {
  scheme: 'exact',
  network: 'eip155:8453',
  amount: '12263',
  maxAmountRequired: '12263',
  maxTimeoutSeconds: 3600,
  resource: 'https://x402.acedata.cloud/nano-banana/images',
  description: 'AceDataCloud API call',
  payTo: '0x4F0E2D3477a1B94CF33d16E442CEe4733dadCeE7',
  asset: '0x833589fCD6e08f4c7C32D4f71b54bdA02913',
  extra: {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: '0x833589fCD6e08f4c7C32D4f71b54bdA02913'
  }
};

describe('@acedatacloud/x402-client EVM contract', () => {
  it('declares the complete EIP-712 domain for browser wallets', async () => {
    const request = vi.fn(async (_args: { method: string; params?: unknown[] }) => `0x${'11'.repeat(65)}`);

    await signEVMPayment(requirement, { request }, '0x1111111111111111111111111111111111111111');

    expect(request).toHaveBeenCalledTimes(1);
    const call = request.mock.calls[0][0];
    expect(call.method).toBe('eth_signTypedData_v4');
    const typedData = JSON.parse(String(call.params?.[1]));
    expect(typedData.types.EIP712Domain).toEqual([
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]);
    expect(typedData.domain).toEqual({
      name: 'USD Coin',
      version: '2',
      chainId: 8453,
      verifyingContract: requirement.asset
    });
  });
});
