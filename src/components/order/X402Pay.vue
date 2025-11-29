<template>
  <el-dialog :model-value="visible" :title="$t('order.title.x402')" :width="dialogWidth" top="8vh" class="x402-dialog">
    <section class="flex flex-col gap-[16px]">
      <header class="flex items-start gap-[12px]">
        <el-icon
          :size="22"
          class="inline-flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]"
          ><credit-card
        /></el-icon>
        <div>
          <p class="m-0 text-[14px] leading-[1.6]">
            {{ $t('order.message.x402IntroShort') }}
          </p>
        </div>
      </header>
      <el-tabs v-model="activeTab" type="border-card" class="mt-[8px]">
        <el-tab-pane :label="$t('order.message.x402TabWallet')" name="wallet">
          <section class="flex flex-col gap-[10px]">
            <div class="flex items-center gap-[10px]">
              <span class="text-[14px] font-semibold text-[var(--el-text-color-primary)]">
                {{ $t('order.message.x402WalletTitle') }}
              </span>
            </div>
            <div class="flex flex-col items-center gap-3 sm:grid-cols-2">
              <template v-for="wallet in walletOptions" :key="wallet.key">
                <div
                  :class="[
                    'flex w-[300px] items-center gap-3 rounded-[10px] border-2 px-4 py-3 min-h-[56px] transition-colors',
                    walletStates[wallet.key].connected && activeWallet === wallet.key
                      ? 'border-[color:var(--el-color-primary)] bg-[color:var(--el-color-primary-light-9)] cursor-pointer'
                      : walletStates[wallet.key].connected
                      ? 'border-[var(--el-border-color)] bg-[var(--el-fill-color-blank)] cursor-pointer'
                      : 'border-[var(--el-border-color)] bg-[var(--el-fill-color-blank)] opacity-90 cursor-default'
                  ]"
                  @click="selectWallet(wallet.key)"
                >
                  <img :src="wallet.icon" :alt="wallet.label" class="w-[20px] h-[20px] rounded-[6px]" />
                  <span class="text-[14px] text-[var(--el-text-color-primary)]">{{ wallet.label }}</span>
                  <div class="ml-auto flex items-center gap-2">
                    <el-tag
                      v-if="walletStates[wallet.key].connected"
                      class="text-[12px] text-[var(--el-color-success)] whitespace-nowrap"
                    >
                      {{ $t('order.message.x402WalletConnected') }}
                    </el-tag>
                    <el-button v-else size="small" type="primary" @click.stop="connectWallet(wallet.key)">
                      {{ $t('order.message.x402ConnectWallet') }}
                    </el-button>
                  </div>
                </div>
              </template>
            </div>
            <el-alert
              v-if="!hasEvmProvider"
              type="info"
              :closable="false"
              class="mt-[8px]"
              :description="$t('order.message.x402NoWalletDesc')"
            />
            <el-alert
              v-else-if="networkMismatch"
              type="warning"
              :closable="false"
              show-icon
              class="mt-[8px]"
              :title="$t('order.message.x402SwitchNetwork', { network: displayNetwork || expectedNetwork })"
            />
            <el-alert
              v-else-if="!hasEvmAccount"
              type="info"
              :closable="false"
              show-icon
              :title="$t('order.message.x402NeedConnectAccount')"
            />
            <div v-if="evmAddress" class="text-center text-[var(--el-text-color-secondary)] text-sm">
              <p>{{ evmAddress?.substring(0, 12) }}...{{ evmAddress?.substring(evmAddress.length - 12) }}</p>
            </div>
            <div class="flex items-center justify-center gap-[12px] flex-wrap mt-[8px]">
              <template v-if="hasEvmProvider">
                <el-button
                  type="primary"
                  :disabled="!evmAddress || !requirementsAvailable || networkMismatch || !hasEvmAccount"
                  :loading="signing || paying"
                  @click="onPayWithWallet"
                >
                  {{ $t('order.message.x402WalletPayCta') }}
                </el-button>
              </template>
            </div>
            <div class="mt-[6px]">
              <p class="m-0 mb-[6px] text-[14px] font-semibold text-[var(--el-text-color-primary)]">
                {{ $t('order.message.x402StepsTitle') }}
              </p>
              <ul class="m-0 pl-[18px] text-[var(--el-text-color-regular)] text-[13px] leading-[1.6] list-disc">
                <li>{{ $t('order.message.x402Step1') }}</li>
                <li>{{ $t('order.message.x402Step2', { network: displayNetwork || expectedNetwork }) }}</li>
                <li>{{ $t('order.message.x402Step3') }}</li>
                <li>{{ $t('order.message.x402Step4') }}</li>
              </ul>
            </div>
          </section>
        </el-tab-pane>
        <el-tab-pane :label="$t('order.message.x402TabApi')" name="api">
          <section v-if="hasDetails" class="flex flex-col gap-[12px]">
            <el-descriptions :column="1" size="small" class="x402-descriptions">
              <el-descriptions-item v-if="displayResource">
                <template #label>{{ $t('order.message.x402IntegrationResourceLabel') }}</template>
                <div class="inline-flex items-center gap-[8px] break-all min-h-[24px]">
                  <template v-if="isUrl(displayResource)">
                    <a
                      :href="displayResource"
                      target="_blank"
                      rel="noopener"
                      class="text-[var(--el-color-primary)] break-all"
                      >{{ displayResource }}</a
                    >
                  </template>
                  <template v-else>
                    <span class="font-mono text-[var(--el-text-color-regular)]">{{ displayResource }}</span>
                  </template>
                  <copy-to-clipboard :content="displayResource" class="inline-flex" />
                </div>
              </el-descriptions-item>
              <el-descriptions-item v-if="displayPayTo">
                <template #label>{{ $t('order.message.x402IntegrationPayToLabel') }}</template>
                <div class="inline-flex items-center gap-[8px] break-all min-h-[24px]">
                  <span class="font-mono text-[var(--el-text-color-regular)]">{{ displayPayTo }}</span>
                  <copy-to-clipboard :content="displayPayTo" class="inline-flex" />
                </div>
              </el-descriptions-item>
              <el-descriptions-item v-if="displayNetwork">
                <template #label>{{ $t('order.message.x402IntegrationNetworkLabel') }}</template>
                <span>{{ displayNetwork }}</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="displayAsset">
                <template #label>{{ $t('order.message.x402IntegrationAssetLabel') }}</template>
                <span>{{ displayAsset }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </section>
          <section
            v-else
            class="my-[12px] px-[16px] py-[14px] rounded-[10px] bg-[var(--el-color-primary-light-9)] text-[var(--el-text-color-regular)] text-[13px] leading-[1.6] text-center"
          >
            <p>{{ $t('order.message.x402IntegrationFallback') }}</p>
          </section>
          <div class="mt-[12px] flex flex-col items-center gap-[8px] text-center">
            <el-button type="primary" class="inline-flex items-center gap-[6px]" @click="onOpenDocs">
              <el-icon><document /></el-icon>
              <span>{{ $t('order.message.x402IntegrationDocsCta') }}</span>
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </el-dialog>
  <el-dialog
    :model-value="installGuideVisible"
    class="x402-dialog x402-guide-dialog"
    width="520px"
    top="15vh"
    :title="$t('order.message.x402InstallGuideTitle')"
    @close="installGuideVisible = false"
  >
    <div class="flex flex-col gap-[12px]">
      <p class="m-0 text-[14px] leading-[1.6] text-[var(--el-text-color-regular)]">
        {{ $t('order.message.x402InstallGuideDesc', { wallet: installGuideWalletLabel }) }}
      </p>
      <ol class="m-0 pl-[18px] text-[13px] leading-[1.6] text-[var(--el-text-color-primary)] list-decimal">
        <li v-for="(step, index) in installGuideSteps" :key="index">{{ step }}</li>
      </ol>
    </div>
    <template #footer>
      <div class="w-full flex justify-center">
        <el-button type="primary" round @click="onInstallGuideConfirm">
          {{ $t('order.message.x402InstallGuideConfirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    :model-value="networkGuideVisible"
    class="x402-dialog x402-guide-dialog"
    width="520px"
    top="15vh"
    :title="$t('order.message.x402NetworkGuideTitle')"
    @close="networkGuideVisible = false"
  >
    <div class="flex flex-col gap-[12px]">
      <p class="m-0 text-[14px] leading-[1.6] text-[var(--el-text-color-regular)]">
        {{ $t('order.message.x402NetworkGuideDesc', { network: displayNetwork || expectedNetwork }) }}
      </p>
      <ol class="m-0 pl-[18px] text-[13px] leading-[1.6] text-[var(--el-text-color-primary)] list-decimal">
        <li v-for="(step, index) in networkGuideSteps" :key="index">{{ step }}</li>
      </ol>
    </div>
    <template #footer>
      <div class="w-full flex justify-center">
        <el-button type="primary" round @click="onNetworkGuideConfirm">
          {{ $t('order.message.x402NetworkGuideConfirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElAlert,
  ElButton,
  ElMessage,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem,
  ElIcon,
  ElTabs,
  ElTag,
  ElTabPane
} from 'element-plus';
import { CreditCard, Document } from '@element-plus/icons-vue';
import { IOrder } from '@/models';
import { orderOperator } from '@/operators/order';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { isMobile } from '@/utils';

type WalletKey = 'phantom' | 'metamask';

interface IWalletState {
  connected: boolean;
  address?: string;
}

interface IData {
  docsUrl: string;
  walletStates: Record<WalletKey, IWalletState>;
  activeWallet: WalletKey;
  connecting: boolean;
  signing: boolean;
  paying: boolean;
  chainId?: string;
  activeTab: 'wallet' | 'api';
  installGuideVisible: boolean;
  installGuideWallet?: WalletKey | null;
}

export default defineComponent({
  name: 'X402PayOrderDialog',
  components: {
    ElDialog,
    ElButton,
    ElAlert,
    ElDescriptions,
    ElTag,
    ElDescriptionsItem,
    ElIcon,
    ElTabs,
    ElTabPane,
    CreditCard,
    Document,
    CopyToClipboard
  },
  props: {
    modelValue: { type: Object as () => IOrder, required: true },
    session: { type: Object as () => Record<string, any> | undefined, default: undefined },
    visible: { type: Boolean, default: false }
  },
  emits: ['hide', 'update:modelValue'],
  data(): IData {
    return {
      docsUrl:
        'https://platform.acedata.cloud/documents/35bf9f88-e972-4c61-a795-b0096d261256#1.%20查看订单并记录收款信息',
      walletStates: {
        phantom: { connected: false, address: undefined },
        metamask: { connected: false, address: undefined }
      },
      connecting: false,
      signing: false,
      paying: false,
      chainId: undefined,
      activeTab: 'wallet',
      activeWallet: 'phantom',
      installGuideVisible: false,
      installGuideWallet: undefined
    };
  },
  computed: {
    dialogWidth(): string {
      return isMobile() ? '100%' : '680px';
    },
    walletOptions(): Array<{ key: WalletKey; label: string; icon: string }> {
      return [
        { key: 'phantom', label: 'Phantom', icon: 'https://cdn.acedata.cloud/42inc8.png' },
        { key: 'metamask', label: 'MetaMask', icon: 'https://cdn.acedata.cloud/jvb98h.png' }
      ];
    },
    currentWalletState(): IWalletState {
      return this.walletStates[this.activeWallet];
    },
    evmAddress(): string | undefined {
      return this.currentWalletState.address;
    },
    primaryAccept(): Record<string, any> | undefined {
      if (Array.isArray(this.session?.accepts) && this.session?.accepts.length > 0)
        return this.session?.accepts[0] as Record<string, any>;
      return undefined;
    },
    orderMetadata(): Record<string, any> | undefined {
      const metadata = (this.modelValue as Record<string, any> | undefined)?.metadata;
      return metadata && typeof metadata === 'object' ? (metadata as Record<string, any>) : undefined;
    },
    paymentRequirements(): Record<string, any> | undefined {
      const s = this.session?.payment_requirements || this.session?.paymentRequirements;
      if (s && typeof s === 'object') return s as Record<string, any>;
      const m = this.orderMetadata?.payment_requirements || this.orderMetadata?.paymentRequirements;
      if (m && typeof m === 'object') return m as Record<string, any>;
      return undefined;
    },
    x402Metadata(): Record<string, any> | undefined {
      const s = this.session?.x402;
      if (s && typeof s === 'object') return s as Record<string, any>;
      const m = this.orderMetadata?.x402;
      if (m && typeof m === 'object') return m as Record<string, any>;
      return undefined;
    },
    displayResource(): string | undefined {
      return this.ensureHttps(
        this.pickFirstString([
          this.primaryAccept?.resource,
          this.primaryAccept?.resource_url,
          this.paymentRequirements?.resource,
          this.paymentRequirements?.resource_url,
          this.session?.resource,
          this.session?.resource_url,
          this.session?.facilitatorUrl,
          this.session?.facilitator_url,
          this.x402Metadata?.resource,
          this.x402Metadata?.facilitator_url,
          this.orderMetadata?.resource,
          this.orderMetadata?.resource_url,
          this.modelValue?.pay_url
        ])
      );
    },
    displayPayTo(): string | undefined {
      return this.pickFirstString([
        this.primaryAccept?.payTo,
        this.primaryAccept?.pay_to,
        this.paymentRequirements?.payTo,
        this.paymentRequirements?.pay_to,
        this.session?.pay_to,
        this.session?.payTo,
        this.x402Metadata?.pay_to,
        this.orderMetadata?.pay_to
      ]);
    },
    displayNetwork(): string | undefined {
      return this.pickFirstString([
        this.primaryAccept?.network,
        this.paymentRequirements?.network,
        this.session?.network,
        this.x402Metadata?.network
      ]);
    },
    displayAsset(): string | undefined {
      const extraName =
        this.paymentRequirements?.extra?.name || this.primaryAccept?.extra?.name || this.session?.extra?.name;
      const asset = this.pickFirstString([
        this.paymentRequirements?.asset,
        this.primaryAccept?.asset,
        this.session?.asset
      ]);
      if (extraName && asset) return `${extraName as string} (${asset})`;
      return extraName || asset;
    },
    hasDetails(): boolean {
      return Boolean(this.displayResource || this.displayPayTo || this.displayNetwork || this.displayAsset);
    },
    expectedNetwork(): string | undefined {
      return this.displayNetwork;
    },
    expectedChainIdHex(): string | undefined {
      const mapping: Record<string, string> = {
        base: '0x2105',
        'base-sepolia': '0x14A34',
        ethereum: '0x1',
        sepolia: '0xAA36A7',
        polygon: '0x89',
        arbitrum: '0xA4B1',
        optimism: '0xA',
        bsc: '0x38',
        avalanche: '0xA86A'
      };
      const key = (this.expectedNetwork || '').toLowerCase();
      return mapping[key];
    },
    networkMismatch(): boolean {
      return Boolean(
        this.evmAddress &&
          this.chainId &&
          this.expectedChainIdHex &&
          this.chainId.toLowerCase() !== this.expectedChainIdHex.toLowerCase()
      );
    },
    hasEvmProvider(): boolean {
      return this.walletOptions.some((opt) => this.isWalletAvailable(opt.key));
    },
    hasEvmAccount(): boolean {
      return Boolean(this.currentWalletState.address);
    },
    requirementsAvailable(): boolean {
      return Boolean(this.pickRequirements());
    },
    evmProvider(): any | undefined {
      if (!this.currentWalletState.connected) return undefined;
      return this.getWalletProvider(this.activeWallet);
    },
    installGuideWalletLabel(): string {
      const wallet = this.walletOptions.find((opt) => opt.key === this.installGuideWallet);
      return wallet?.label || this.walletOptions[0]?.label || 'MetaMask';
    },
    installGuideSteps(): string[] {
      return [
        String(this.$t('order.message.x402InstallGuideStep1', { wallet: this.installGuideWalletLabel })),
        String(this.$t('order.message.x402InstallGuideStep2')),
        String(this.$t('order.message.x402InstallGuideStep3'))
      ];
    },
    networkGuideSteps(): string[] {
      const networkName = this.displayNetwork || this.expectedNetwork || 'Base';
      return [
        String(this.$t('order.message.x402NetworkGuideStep1', { network: networkName })),
        String(this.$t('order.message.x402NetworkGuideStep2', { network: networkName })),
        String(this.$t('order.message.x402NetworkGuideStep3'))
      ];
    },
    networkGuideVisible(): boolean {
      return this.networkMismatch;
    }
  },
  watch: {
    visible(value: boolean) {
      if (!value) {
        this.installGuideVisible = false;
      }
    }
  },
  methods: {
    getWalletDeepLink(wallet: WalletKey): string | undefined {
      if (!isMobile()) return undefined;
      if (typeof window === 'undefined') return undefined;
      const currentUrl = window.location.href;
      if (wallet === 'phantom') {
        return `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
      }
      if (wallet === 'metamask') {
        return `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`;
      }
      return undefined;
    },
    selectWallet(wallet: WalletKey) {
      if (!this.walletStates[wallet].connected) return;
      this.activeWallet = wallet;
    },
    connectWallet(wallet: WalletKey) {
      void this.onConnectWallet(wallet);
    },
    getPhantomProvider(): any | undefined {
      const w: any = window as any;
      const phantomNamespace = w?.phantom;
      const eth = w?.ethereum;
      const multi = eth?.providers;
      if (phantomNamespace?.ethereum) return phantomNamespace.ethereum;
      if (eth?.isPhantom) return eth;
      if (Array.isArray(multi) && multi.length > 0) {
        const p = multi.find((provider: any) => provider && provider.isPhantom);
        if (p) return p;
      }
      return undefined;
    },
    getMetamaskProvider(): any | undefined {
      const w: any = window as any;
      const eth = w?.ethereum;
      const multi = eth?.providers;
      let mm: any;
      if (Array.isArray(multi) && multi.length > 0) {
        mm = multi.find((p: any) => p && p.isMetaMask);
      }
      if (!mm && eth?.isMetaMask) mm = eth;
      return mm;
    },
    getWalletProvider(wallet: WalletKey) {
      if (wallet === 'metamask') {
        return this.getMetamaskProvider();
      }
      if (wallet === 'phantom') {
        return this.getPhantomProvider();
      }
    },
    isWalletAvailable(wallet: WalletKey): boolean {
      return Boolean(this.getWalletProvider(wallet));
    },
    openWalletDownload(wallet: WalletKey) {
      const deepLink = this.getWalletDeepLink(wallet);
      if (deepLink) {
        window.location.href = deepLink;
        return;
      }
      let url = '';
      if (wallet === 'phantom') {
        url = 'https://phantom.app/download';
      } else if (wallet === 'metamask') {
        url = 'https://metamask.io/download.html';
      }
      if (!url) return;
      window.open(url, '_blank', 'noopener');
      this.installGuideWallet = wallet;
      this.installGuideVisible = true;
    },
    resetWalletState(wallet: WalletKey) {
      this.walletStates[wallet].connected = false;
      this.walletStates[wallet].address = undefined;
    },
    async getFreshRequirements(): Promise<Record<string, any> | undefined> {
      const existing = this.pickRequirements();
      if (existing) return existing;
      try {
        const res = await orderOperator.pay(this.modelValue.id as any, { pay_way: 'X402' } as any);
        const data: any = res?.data;
        if (Array.isArray(data?.accepts) && data.accepts.length) return data.accepts[0];
        if (data?.payment_requirements) return data.payment_requirements;
        return undefined;
      } catch (err: any) {
        const data = err?.response?.data;
        if (data) {
          if (Array.isArray(data?.accepts) && data.accepts.length) return data.accepts[0];
          if (data?.payment_requirements) return data.payment_requirements;
        }
        return undefined;
      }
    },
    onOpenDocs() {
      window.open(this.docsUrl, '_blank', 'noopener');
    },
    pickFirstString(candidates: Array<unknown>): string | undefined {
      for (const c of candidates) if (typeof c === 'string' && c.trim()) return c.trim();
      return undefined;
    },
    ensureHttps(value?: string): string | undefined {
      if (!value) return value;
      if (/^http:\/\//i.test(value)) return value.replace(/^http:\/\//i, 'https://');
      return value;
    },
    isUrl(value?: string) {
      return !!value && /^https?:\/\//i.test(value);
    },
    async onConnectWallet(wallet: WalletKey) {
      const provider = this.getWalletProvider(wallet);
      if (!provider) {
        this.resetWalletState(wallet);
        this.openWalletDownload(wallet);
        return;
      }
      this.connecting = true;
      try {
        const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
        const address = Array.isArray(accounts) ? accounts[0] : undefined;
        if (!address) {
          this.resetWalletState(wallet);
          return;
        }
        this.walletStates[wallet].address = address;
        this.walletStates[wallet].connected = true;
        this.activeWallet = wallet;
        await this.refreshChainId();
      } catch {
        this.resetWalletState(wallet);
      } finally {
        this.connecting = false;
        await this.ensureNetwork();
      }
    },
    async refreshChainId() {
      if (!this.evmProvider) return;
      try {
        const cid = await this.evmProvider.request({ method: 'eth_chainId' });
        if (typeof cid === 'string') this.chainId = cid;
      } catch {}
    },
    async ensureNetwork() {
      if (!this.evmProvider || !this.expectedChainIdHex) return;
      await this.refreshChainId();
      if (this.chainId && this.chainId.toLowerCase() === this.expectedChainIdHex.toLowerCase()) return;
      try {
        await this.evmProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.expectedChainIdHex }]
        });
      } catch {
        try {
          await this.evmProvider.request({
            method: 'wallet_addEthereumChain',
            params: [this.getExpectedChainParams()]
          });
        } catch (err: any) {
          try {
            ElMessage.warning(
              (this.$t && (this.$t('order.message.x402NetworkSwitchFailed') as string)) ||
                'Your wallet does not support automatic network switching. Please switch to the required network in the wallet and try again.'
            );
          } catch {}
        }
      }
      await this.refreshChainId();
    },
    async onSwitchNetwork() {
      await this.ensureNetwork();
    },
    getExpectedChainParams() {
      const map: Record<string, any> = {
        base: {
          chainId: '0x2105',
          chainName: 'Base',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org']
        },
        'base-sepolia': {
          chainId: '0x14A34',
          chainName: 'Base Sepolia',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org']
        }
      };
      const key = (this.expectedNetwork || '').toLowerCase();
      return map[key] || { chainId: this.expectedChainIdHex };
    },
    buildTypedData(requirements: Record<string, any>, authorization: Record<string, any>) {
      const extra = requirements?.extra || {};
      return {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' }
          ]
        },
        primaryType: 'TransferWithAuthorization',
        domain: {
          name: extra?.name || 'USD Coin',
          version: extra?.version || '2',
          chainId: parseInt((this.expectedChainIdHex || '0x0') as string, 16),
          verifyingContract: requirements.asset
        },
        message: authorization
      } as Record<string, any>;
    },
    randomNonce32(): string {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return (
        '0x' +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
    },
    pickRequirements(): Record<string, any> | undefined {
      return this.paymentRequirements || this.primaryAccept;
    },
    async onPayWithWallet() {
      if (!this.modelValue?.id || !this.evmProvider || !this.evmAddress) {
        const fallback =
          (this.$t && (this.$t('order.message.x402PaymentFailed') as string)) ||
          'X402 wallet payment is not available right now. Please try again later.';
        ElMessage.error(fallback);
        return;
      }

      this.signing = true;
      try {
        let requirements = await this.getFreshRequirements();
        if (!requirements) requirements = this.pickRequirements();
        if (!requirements) {
          const fallback =
            (this.$t && (this.$t('order.message.x402PaymentFailed') as string)) ||
            'X402 wallet payment failed. Please try again later.';
          ElMessage.error(fallback);
          return;
        }

        await this.ensureNetwork();
        const now = Math.floor(Date.now() / 1000);
        const maxTimeout = Number(requirements?.maxTimeoutSeconds || requirements?.max_timeout_seconds || 120);
        const valueStr = BigInt(requirements?.maxAmountRequired || requirements?.max_amount_required || 0).toString();
        const authorization: any = {
          from: this.evmAddress,
          to: requirements.payTo || requirements.pay_to,
          value: valueStr,
          validAfter: now,
          validBefore: now + maxTimeout,
          nonce: this.randomNonce32()
        };
        const typedData = this.buildTypedData(requirements, authorization);
        const signature: string = await this.evmProvider.request({
          method: 'eth_signTypedData_v4',
          params: [this.evmAddress, JSON.stringify(typedData)]
        });
        const headerAuthorization = {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value,
          validAfter: String(authorization.validAfter),
          validBefore: String(authorization.validBefore),
          nonce: authorization.nonce
        };
        const payload = {
          x402Version: 1,
          scheme: requirements.scheme || 'exact',
          network: requirements.network || this.expectedNetwork || 'base',
          payload: { authorization: headerAuthorization, signature }
        };
        const header = btoa(JSON.stringify(payload));
        this.paying = true;
        const { data } = await orderOperator.payX402WithHeader(this.modelValue.id, { pay_way: 'X402' } as any, header);
        this.$emit('update:modelValue', data as IOrder);
        this.$emit('hide');
      } catch (err: any) {
        let message: string | undefined;
        const data = err?.response?.data;
        if (data) {
          const msg = (data as any)?.error || (data as any)?.detail;
          if (typeof msg === 'string') message = msg;
        }
        if (!message) {
          message =
            (this.$t && (this.$t('order.message.x402PaymentFailed') as string)) ||
            'X402 wallet payment failed. Please try again later.';
        }
        try {
          ElMessage.error(message);
        } catch {}
      } finally {
        this.signing = false;
        this.paying = false;
      }
    },
    onInstallGuideConfirm() {
      this.installGuideVisible = false;
      this.reloadPage();
    },
    onNetworkGuideConfirm() {
      this.reloadPage();
    },
    reloadPage() {
      window.location.reload();
    }
  }
});
</script>

<style lang="scss" scoped>
.x402-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 22px 10px;
  }
  :deep(.el-dialog__footer) {
    padding: 16px 22px 20px;
  }
}

.x402-descriptions {
  :deep(.el-descriptions__table) {
    border: none;
  }
  :deep(.el-descriptions__cell) {
    padding-bottom: 12px;
    border-bottom: none;
  }
  :deep(.el-descriptions__body tr:last-child .el-descriptions__cell) {
    padding-bottom: 0;
  }
  :deep(.el-descriptions__label) {
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
  :deep(.el-descriptions__content) {
    color: var(--el-text-color-primary);
  }
  :deep(.el-descriptions__body) {
    background: transparent;
  }
  :deep(.el-descriptions__cell.is-bordered-label) {
    width: 150px;
    font-weight: 600;
  }
  :deep(.el-descriptions__cell) {
    vertical-align: top;
  }
}

.x402-network-alert {
  :deep(.el-alert__content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }
}
</style>
