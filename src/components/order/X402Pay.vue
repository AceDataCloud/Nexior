<template>
  <el-dialog :model-value="visible" :title="$t('order.title.x402')" :width="dialogWidth" top="8vh" class="x402-dialog">
    <section class="x402-content">
      <header class="x402-intro">
        <el-icon :size="20" class="x402-intro-icon"><credit-card /></el-icon>
        <p class="x402-intro-text">{{ $t('order.message.x402IntroShort') }}</p>
      </header>
      <section class="x402-wallet">
        <div class="x402-wallet-head">
          <div class="x402-network">
            <span class="x402-network-label">{{ $t('order.message.x402IntegrationNetworkLabel') }}</span>
            <el-radio-group v-model="selectedNetwork" size="small" class="x402-network-group">
              <el-radio-button v-for="option in networkOptions" :key="option.network" :label="option.network">
                {{ option.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <el-alert
          v-if="selectedNetworkResolved === 'solana' && !selectedRequirements && !requirementsLoading"
          type="info"
          :closable="false"
          class="x402-alert"
          :description="$t('order.message.x402SolanaNotEnabled')"
        />
        <div v-if="!selectedRequirements && !requirementsLoading" class="x402-requirements-actions">
          <el-button link type="primary" size="small" @click="maybeLoadRequirements(true)">
            {{ $t('common.button.refresh') }}
          </el-button>
        </div>

        <template v-if="isSolanaNetwork">
          <div class="x402-wallet-card">
            <div class="x402-wallet-card-head">
              <span class="x402-wallet-card-title">Solana Wallet</span>
              <el-tag v-if="solanaConnected" class="x402-wallet-card-tag">{{
                $t('order.message.x402WalletConnected')
              }}</el-tag>
            </div>
            <div v-if="solanaConnected && selectedSolanaWalletName" class="x402-wallet-card-sub x402-wallet-name">
              <img
                v-if="selectedSolanaWalletIcon"
                class="wallet-list-icon"
                :src="selectedSolanaWalletIcon"
                :alt="selectedSolanaWalletName"
              />
              <span>{{ selectedSolanaWalletName }}</span>
            </div>
            <div v-if="solanaConnected && solanaAddress" class="x402-wallet-card-sub">
              {{ solanaAddress.substring(0, 10) }}...{{ solanaAddress.substring(solanaAddress.length - 10) }}
            </div>
            <div class="x402-wallet-card-actions">
              <el-button v-if="!solanaConnected" type="primary" @click="solanaWalletModalVisible = true">
                {{ $t('order.message.x402ConnectWallet') }}
              </el-button>
              <template v-else>
                <el-button @click="disconnectSolanaWallet">{{ $t('coin.button.disconnect') }}</el-button>
              </template>
            </div>
          </div>
          <div class="x402-actions">
            <el-button
              type="primary"
              :disabled="!solanaConnected || !solanaAddress || !requirementsAvailable"
              :loading="signing || paying"
              @click="onPayWithSolanaWallet"
            >
              {{ $t('order.message.x402WalletPayCta') }}
            </el-button>
          </div>
        </template>

        <template v-else>
          <div class="x402-wallet-card">
            <div class="x402-wallet-card-head">
              <span class="x402-wallet-card-title">EVM Wallet</span>
              <el-tag v-if="evmConnected" class="x402-wallet-card-tag">{{
                $t('order.message.x402WalletConnected')
              }}</el-tag>
            </div>
            <div v-if="evmConnected && selectedEvmWalletName" class="x402-wallet-card-sub x402-wallet-name">
              <img
                v-if="selectedEvmWalletIcon"
                class="wallet-list-icon"
                :src="selectedEvmWalletIcon"
                :alt="selectedEvmWalletName"
              />
              <span>{{ selectedEvmWalletName }}</span>
            </div>
            <div v-if="evmConnected && evmAddress" class="x402-wallet-card-sub">
              {{ evmAddress.substring(0, 10) }}...{{ evmAddress.substring(evmAddress.length - 10) }}
            </div>
            <div class="x402-wallet-card-actions">
              <el-button v-if="!evmConnected" type="primary" @click="openEvmWalletModal">
                {{ $t('order.message.x402ConnectWallet') }}
              </el-button>
              <template v-else>
                <el-button @click="disconnectEvmWallet">{{ $t('coin.button.disconnect') }}</el-button>
              </template>
            </div>
          </div>
          <el-alert
            v-if="!hasEvmProvider"
            type="info"
            :closable="false"
            class="x402-alert"
            :description="$t('order.message.x402NoWalletDesc')"
          />
          <el-alert
            v-else-if="networkMismatch"
            type="warning"
            :closable="false"
            show-icon
            class="x402-alert"
            :title="$t('order.message.x402SwitchNetwork', { network: expectedNetworkLabel || expectedNetwork })"
          />
          <div class="x402-actions">
            <template v-if="hasEvmProvider">
              <el-button
                type="primary"
                :disabled="!evmConnected || !requirementsAvailable || networkMismatch"
                :loading="signing || paying"
                @click="onPayWithWallet"
              >
                {{ $t('order.message.x402WalletPayCta') }}
              </el-button>
            </template>
          </div>
        </template>

        <div class="x402-steps">
          <div class="x402-steps-title">{{ $t('order.message.x402StepsTitle') }}</div>
          <ol class="x402-steps-list">
            <li v-for="(step, index) in paymentSteps" :key="index" class="x402-step">
              <span class="x402-step-index">{{ index + 1 }}</span>
              <span class="x402-step-text">{{ step }}</span>
            </li>
          </ol>
        </div>
      </section>
    </section>
  </el-dialog>
  <el-dialog
    v-model="solanaWalletModalVisible"
    :title="$t('order.message.x402ConnectWallet')"
    width="420px"
    align-center
  >
    <div class="wallet-list">
      <button
        v-for="wallet in solanaWalletsOrdered"
        :key="wallet.adapter.name"
        class="wallet-list-item"
        :disabled="solanaWalletConnecting"
        @click="onSelectSolanaWallet(wallet)"
      >
        <img
          v-if="wallet.adapter.icon"
          class="wallet-list-icon"
          :src="wallet.adapter.icon"
          :alt="wallet.adapter.name"
        />
        <span class="wallet-list-name">{{ wallet.adapter.name }}</span>
        <span v-if="wallet.readyState === 'Installed'" class="wallet-list-status">Detected</span>
      </button>
    </div>
  </el-dialog>
  <el-dialog v-model="evmWalletModalVisible" :title="$t('order.message.x402ConnectWallet')" width="420px" align-center>
    <div class="wallet-list">
      <button
        v-for="wallet in evmWalletsOrdered"
        :key="wallet.id"
        class="wallet-list-item"
        :disabled="evmWalletConnecting"
        @click="onSelectEvmWallet(wallet)"
      >
        <img v-if="wallet.icon" class="wallet-list-icon" :src="wallet.icon" :alt="wallet.name" />
        <span class="wallet-list-name">{{ wallet.name }}</span>
        <span class="wallet-list-status">Detected</span>
      </button>
      <div v-if="evmWalletsOrdered.length === 0" class="text-center text-[13px] text-[var(--el-text-color-regular)]">
        {{ $t('order.message.x402NoWalletDesc') }}
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import {
  ElAlert,
  ElButton,
  ElMessage,
  ElMessageBox,
  ElDialog,
  ElIcon,
  ElTag,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus';
import { CreditCard } from '@element-plus/icons-vue';
import { IOrder } from '@/models';
import { httpClient, orderOperator } from '@/operators';
import { isMobile } from '@/utils';
import { buildSolanaX402Header } from '@/utils/x402/solana';

interface IEvmWalletInfo {
  id: string;
  name: string;
  icon?: string;
  provider: any;
}

interface IData {
  signing: boolean;
  paying: boolean;
  chainId?: string;
  selectedNetwork?: string;
  solanaWalletModalVisible: boolean;
  solanaWalletConnecting: boolean;
  evmWalletModalVisible: boolean;
  evmWalletConnecting: boolean;
  evmWallets: IEvmWalletInfo[];
  selectedEvmWalletId?: string;
  evmAddress?: string;
  requirementsLoading: boolean;
  runtimeRequirementsByNetwork: Record<string, Record<string, any> | undefined>;
  requirementsAttemptedByNetwork: Record<string, boolean>;
}

export default defineComponent({
  name: 'X402PayOrderDialog',
  components: {
    ElDialog,
    ElButton,
    ElAlert,
    ElTag,
    ElIcon,
    ElRadioGroup,
    ElRadioButton,
    CreditCard
  },
  props: {
    modelValue: { type: Object as () => IOrder, required: true },
    session: { type: Object as () => Record<string, any> | undefined, default: undefined },
    visible: { type: Boolean, default: false }
  },
  emits: ['hide', 'update:modelValue'],
  data(): IData {
    return {
      signing: false,
      paying: false,
      chainId: undefined,
      selectedNetwork: undefined,
      solanaWalletModalVisible: false,
      solanaWalletConnecting: false,
      evmWalletModalVisible: false,
      evmWalletConnecting: false,
      evmWallets: [],
      selectedEvmWalletId: undefined,
      evmAddress: undefined,
      requirementsLoading: false,
      runtimeRequirementsByNetwork: {},
      requirementsAttemptedByNetwork: {}
    };
  },
  computed: {
    dialogWidth(): string {
      return isMobile() ? '100%' : '680px';
    },
    acceptsList(): Array<Record<string, any>> {
      const accepts = this.session?.accepts;
      if (Array.isArray(accepts) && accepts.length > 0) {
        return accepts.filter((x): x is Record<string, any> => Boolean(x && typeof x === 'object'));
      }
      const req = this.paymentRequirements as any;
      if (Array.isArray(req) && req.length > 0) {
        return req.filter((x: any): x is Record<string, any> => Boolean(x && typeof x === 'object'));
      }
      if (req && typeof req === 'object') {
        return [req as Record<string, any>];
      }
      return [];
    },
    selectedNetworkResolved(): string | undefined {
      return String(this.selectedNetwork || this.acceptsList[0]?.network || 'base').toLowerCase();
    },
    selectedRequirements(): Record<string, any> | undefined {
      const selected = String(this.selectedNetworkResolved || '').toLowerCase();
      if (!selected) return this.acceptsList[0];
      const runtime = this.runtimeRequirementsByNetwork[selected];
      if (runtime) return runtime;
      const matched = this.acceptsList.find((r) => String(r.network || '').toLowerCase() === selected);
      if (matched) return matched;
      // If the user explicitly selected a network and it's not available, don't fall back to a different chain.
      if (this.selectedNetwork) return undefined;
      return this.acceptsList[0];
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
    expectedNetwork(): string | undefined {
      return this.selectedNetworkResolved;
    },
    expectedNetworkLabel(): string | undefined {
      return this.formatNetworkLabel(this.expectedNetwork);
    },
    isSolanaNetwork(): boolean {
      return Boolean(
        String(this.selectedNetworkResolved || '')
          .toLowerCase()
          .startsWith('solana')
      );
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
      if (this.isSolanaNetwork) return false;
      return Boolean(
        this.evmAddress &&
          this.chainId &&
          this.expectedChainIdHex &&
          this.chainId.toLowerCase() !== this.expectedChainIdHex.toLowerCase()
      );
    },
    hasEvmProvider(): boolean {
      if (this.isSolanaNetwork) return false;
      return this.evmWalletsOrdered.length > 0;
    },
    requirementsAvailable(): boolean {
      return Boolean(this.selectedRequirements);
    },
    networkOptions(): Array<{ network: string; label: string }> {
      const supported = new Set(this.acceptsList.map((a) => String(a.network || '').toLowerCase()).filter(Boolean));
      if (supported.size === 0) {
        return [
          { network: 'base', label: 'Base' },
          { network: 'solana', label: 'Solana' }
        ];
      }

      const weight = (network: string) => {
        if (network === 'base') return 0;
        if (network.startsWith('solana')) return 1;
        return 2;
      };

      return Array.from(supported)
        .sort((a, b) => weight(a) - weight(b) || a.localeCompare(b))
        .map((network) => ({ network, label: this.formatNetworkLabel(network) }));
    },
    paymentSteps(): string[] {
      const network = this.expectedNetworkLabel || this.expectedNetwork || '';
      return [
        String(this.$t('order.message.x402Step1')),
        String(this.$t('order.message.x402Step2', { network })),
        String(this.$t('order.message.x402Step3')),
        String(this.$t('order.message.x402Step4'))
      ];
    },
    evmConnected(): boolean {
      return Boolean(this.selectedEvmWalletId && this.evmAddress);
    },
    evmProvider(): any | undefined {
      if (!this.selectedEvmWalletId) return undefined;
      return this.evmWallets.find((w) => w.id === this.selectedEvmWalletId)?.provider;
    },
    selectedEvmWalletName(): string | undefined {
      if (!this.selectedEvmWalletId) return undefined;
      return this.evmWallets.find((w) => w.id === this.selectedEvmWalletId)?.name;
    },
    selectedEvmWalletIcon(): string | undefined {
      if (!this.selectedEvmWalletId) return undefined;
      return this.evmWallets.find((w) => w.id === this.selectedEvmWalletId)?.icon;
    },
    evmWalletsOrdered(): IEvmWalletInfo[] {
      return [...this.evmWallets].sort((a, b) => a.name.localeCompare(b.name));
    },
    solanaConnected(): boolean {
      return Boolean((this as any).$wallet?.connected?.value);
    },
    solanaAddress(): string | undefined {
      const pk = (this as any).$wallet?.publicKey?.value;
      if (!pk || typeof pk.toBase58 !== 'function') return undefined;
      return pk.toBase58();
    },
    solanaWalletsOrdered(): any[] {
      const wallets = (this as any).$wallet?.wallets?.value ?? [];
      const weight = (readyState: string) => {
        if (readyState === 'Installed') return 0;
        if (readyState === 'Loadable') return 1;
        if (readyState === 'NotDetected') return 2;
        return 3;
      };
      return [...wallets].sort((a, b) => weight(a.readyState) - weight(b.readyState));
    },
    selectedSolanaWalletName(): string | undefined {
      return (this as any).$wallet?.wallet?.value?.adapter?.name;
    },
    selectedSolanaWalletIcon(): string | undefined {
      return (this as any).$wallet?.wallet?.value?.adapter?.icon;
    }
  },
  watch: {
    visible(value: boolean) {
      if (!value) {
        this.solanaWalletModalVisible = false;
        this.evmWalletModalVisible = false;
        return;
      }
      if (!this.selectedNetwork) {
        const first = this.acceptsList[0]?.network;
        this.selectedNetwork = String(first || 'base').toLowerCase();
      }
      const supported = new Set(this.networkOptions.map((o) => o.network));
      const selected = String(this.selectedNetwork || '').toLowerCase();
      if (selected && !supported.has(selected)) {
        const fallback = this.networkOptions[0]?.network;
        if (fallback) this.selectedNetwork = fallback;
      }
      void this.maybeLoadRequirements();
    },
    selectedNetwork() {
      if (!this.visible) return;
      void this.maybeLoadRequirements();
    }
  },
  mounted() {
    void this.refreshEvmWallets();
  },
  methods: {
    sleep(ms: number) {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    },
    getErrorMessage(error: any): string {
      if (!error) return '';
      if (typeof error === 'string') return error;
      if (typeof error?.message === 'string') return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    },
    isRetryableSolanaConnectError(error: any): boolean {
      const name = String(error?.name || '');
      if (name === 'WalletNotSelectedError') return true;
      const message = this.getErrorMessage(error).toLowerCase();
      return (
        message.includes('disconnected port object') ||
        message.includes('failed to send message to service worker') ||
        message.includes('message port closed') ||
        message.includes('extension context invalidated')
      );
    },
    async connectSolanaWalletWithRetry(adapterName?: string) {
      const walletApi: any = (this as any).$wallet;
      if (!walletApi) throw new Error('Wallet API not available');

      const maxAttempts = 2;
      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          if (adapterName) walletApi.select(adapterName);
          await nextTick();
          await walletApi.connect();
          return;
        } catch (error: any) {
          lastError = error;
          if (attempt < maxAttempts && this.isRetryableSolanaConnectError(error)) {
            const name = String(error?.name || '');
            const delayMs = name === 'WalletNotSelectedError' ? 0 : 300;
            if (delayMs) await this.sleep(delayMs);
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    },
    formatNetworkLabel(network?: string): string {
      const lower = String(network || '').toLowerCase();
      if (lower === 'base') return 'Base';
      if (lower === 'solana') return 'Solana';
      if (lower === 'solana-devnet') return 'Solana Devnet';
      if (lower === 'ethereum') return 'Ethereum';
      if (lower === 'sepolia') return 'Sepolia';
      if (lower === 'polygon') return 'Polygon';
      if (lower === 'arbitrum') return 'Arbitrum';
      if (lower === 'optimism') return 'Optimism';
      if (lower === 'bsc') return 'BNB Chain';
      if (lower === 'avalanche') return 'Avalanche';
      return network || 'Unknown';
    },
    async confirmPay(networkLabel?: string): Promise<boolean> {
      const network = networkLabel || this.expectedNetworkLabel || this.expectedNetwork || '';
      const title = String(this.$t?.('order.message.x402ConfirmTitle') || 'Confirm Payment');
      const message = String(
        this.$t?.('order.message.x402ConfirmDesc', { network }) || `Confirm USDC payment on ${network}?`
      );
      const confirmButtonText = String(this.$t?.('common.button.pay') || 'Pay');
      const cancelButtonText = String(this.$t?.('common.button.cancel') || 'Cancel');
      return ElMessageBox.confirm(message, title, {
        confirmButtonText,
        cancelButtonText,
        type: 'warning'
      })
        .then(() => true)
        .catch(() => false);
    },
    async onSelectSolanaWallet(wallet: any) {
      if (this.solanaWalletConnecting) return;
      if (!wallet?.adapter?.name) {
        return;
      }
      this.solanaWalletConnecting = true;
      try {
        await this.connectSolanaWalletWithRetry(wallet.adapter.name);
        this.solanaWalletModalVisible = false;
      } catch (error) {
        console.warn('wallet connect failed', error);
        ElMessage.error(String(this.$t?.('coin.message.connectError') || 'Wallet connect failed'));
      } finally {
        this.solanaWalletConnecting = false;
      }
    },
    async disconnectSolanaWallet() {
      try {
        await (this as any).$wallet.disconnect();
      } catch {}
    },
    openEvmWalletModal() {
      this.evmWalletModalVisible = true;
      void this.refreshEvmWallets();
    },
    async refreshEvmWallets() {
      if (typeof window === 'undefined') return;

      const collected = new Map<string, IEvmWalletInfo>();
      const handler = (event: any) => {
        const detail = event?.detail;
        const info = detail?.info;
        const provider = detail?.provider;
        if (!info || !provider) return;
        const id = String(info.uuid || info.rdns || info.name || '');
        if (!id) return;
        if (!collected.has(id)) {
          collected.set(id, {
            id,
            name: String(info.name || 'Wallet'),
            icon: typeof info.icon === 'string' ? info.icon : undefined,
            provider
          });
        }
      };

      try {
        window.addEventListener('eip6963:announceProvider', handler as any);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      } finally {
        window.removeEventListener('eip6963:announceProvider', handler as any);
      }

      if (collected.size === 0) {
        const eth: any = (window as any).ethereum;
        const providers: any[] = Array.isArray(eth?.providers) ? eth.providers : eth ? [eth] : [];
        providers.forEach((p: any, index: number) => {
          if (!p) return;
          let name = 'Injected';
          if (p.isMetaMask) name = 'MetaMask';
          else if (p.isCoinbaseWallet) name = 'Coinbase Wallet';
          else if (p.isBraveWallet) name = 'Brave Wallet';
          else if (p.isRabby) name = 'Rabby';
          else if (p.isPhantom) name = 'Phantom';
          const id = `injected:${name}:${index}`;
          collected.set(id, { id, name, icon: undefined, provider: p });
        });
      }

      this.evmWallets = Array.from(collected.values());
    },
    async onSelectEvmWallet(wallet: IEvmWalletInfo) {
      if (!wallet?.provider) return;
      this.evmWalletModalVisible = false;
      this.evmWalletConnecting = true;
      try {
        const accounts: string[] = await wallet.provider.request({ method: 'eth_requestAccounts' });
        const address = Array.isArray(accounts) ? accounts[0] : undefined;
        if (!address) {
          throw new Error('No account returned from wallet');
        }
        this.selectedEvmWalletId = wallet.id;
        this.evmAddress = address;
        await this.refreshChainId();
        await this.ensureNetwork();
      } catch (error) {
        console.warn('EVM wallet connect failed', error);
        ElMessage.error(String(this.$t?.('coin.message.connectError') || 'Wallet connect failed'));
        this.disconnectEvmWallet();
      } finally {
        this.evmWalletConnecting = false;
      }
    },
    disconnectEvmWallet() {
      this.selectedEvmWalletId = undefined;
      this.evmAddress = undefined;
      this.chainId = undefined;
    },
    async getFreshRequirements(): Promise<Record<string, any> | undefined> {
      // Prefer using the requirements already attached to the order/session
      // to avoid re-triggering the pay endpoint (which may legitimately
      // return HTTP 402 as part of the X402 protocol handshake).
      const existing = this.selectedRequirements;
      if (existing) return existing;
      try {
        const res = await orderOperator.pay(this.modelValue.id as any, { pay_way: 'X402' } as any);
        const data: any = res?.data;
        const accepts = Array.isArray(data?.accepts) ? data.accepts : undefined;
        const target = String(this.selectedNetworkResolved || '').toLowerCase();
        if (Array.isArray(accepts) && accepts.length) {
          const found = accepts.find((r: any) => String(r?.network || '').toLowerCase() === target);
          if (found) return found as Record<string, any>;
          if (!this.selectedNetwork) return accepts[0] as Record<string, any>;
          return undefined;
        }
        const pr = data?.payment_requirements;
        if (Array.isArray(pr) && pr.length) {
          const found = pr.find((r: any) => String(r?.network || '').toLowerCase() === target);
          if (found) return found as Record<string, any>;
          if (!this.selectedNetwork) return pr[0] as Record<string, any>;
          return undefined;
        }
        if (pr && typeof pr === 'object') return pr as Record<string, any>;
        return undefined;
      } catch (err: any) {
        const data = err?.response?.data;
        if (data) {
          const accepts = Array.isArray(data?.accepts) ? data.accepts : undefined;
          const target = String(this.selectedNetworkResolved || '').toLowerCase();
          if (Array.isArray(accepts) && accepts.length) {
            const found = accepts.find((r: any) => String(r?.network || '').toLowerCase() === target);
            if (found) return found as Record<string, any>;
            if (!this.selectedNetwork) return accepts[0] as Record<string, any>;
            return undefined;
          }
          const pr = data?.payment_requirements;
          if (Array.isArray(pr) && pr.length) {
            const found = pr.find((r: any) => String(r?.network || '').toLowerCase() === target);
            if (found) return found as Record<string, any>;
            if (!this.selectedNetwork) return pr[0] as Record<string, any>;
            return undefined;
          }
          if (pr && typeof pr === 'object') return pr as Record<string, any>;
        }
        return undefined;
      }
    },
    async maybeLoadRequirements(force = false) {
      const network = String(this.selectedNetworkResolved || '').toLowerCase();
      if (!network) return;
      if (this.runtimeRequirementsByNetwork[network]) return;
      const alreadyHas = this.acceptsList.some((r) => String(r.network || '').toLowerCase() === network);
      if (alreadyHas) return;
      if (!force && this.requirementsAttemptedByNetwork[network]) return;

      this.requirementsAttemptedByNetwork[network] = true;
      this.requirementsLoading = true;
      try {
        const req = await this.getFreshRequirements();
        if (req) {
          this.runtimeRequirementsByNetwork[network] = req;
        }
      } finally {
        this.requirementsLoading = false;
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
          console.error('Failed to add Ethereum chain:', err);
          try {
            const fallback =
              (this.$t && (this.$t('order.message.x402NetworkSwitchFailed') as string)) ||
              'Your wallet does not support automatic network switching. Please switch to the required network in the wallet and try again.';
            ElMessage.warning(fallback);
          } catch {}
        }
      }
      await this.refreshChainId();
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
    async onPayWithSolanaWallet() {
      if (!this.modelValue?.id) return;
      const address = this.solanaAddress;
      if (!address) {
        ElMessage.error(String(this.$t?.('order.message.x402NeedConnectAccount') || 'Please connect a wallet first.'));
        return;
      }
      if (!this.requirementsAvailable) {
        ElMessage.error(String(this.$t?.('order.message.x402SolanaNotEnabled') || 'Solana payment is not available.'));
        return;
      }

      this.signing = true;
      try {
        const ok = await this.confirmPay(this.expectedNetworkLabel);
        if (!ok) return;

        let requirements = await this.getFreshRequirements();
        if (!requirements) requirements = this.selectedRequirements;
        if (!requirements) {
          ElMessage.error(String(this.$t?.('order.message.x402PaymentFailed') || 'X402 payment failed.'));
          return;
        }

        const adapter: any = (this as any).$wallet?.wallet?.value?.adapter;
        if (!adapter?.signTransaction && !adapter?.signAllTransactions) {
          throw new Error('Wallet does not support signing transactions');
        }

        const header = await buildSolanaX402Header({
          requirements,
          payerAddress: address,
          signTransaction: adapter.signTransaction ? adapter.signTransaction.bind(adapter) : undefined,
          signAllTransactions: adapter.signAllTransactions ? adapter.signAllTransactions.bind(adapter) : undefined,
          fetchLatestBlockhash: (network) => this.fetchSolanaLatestBlockhash(network)
        });
        this.paying = true;
        const { data } = await orderOperator.payX402WithHeader(this.modelValue.id, { pay_way: 'X402' } as any, header);
        this.$emit('update:modelValue', data as IOrder);
        this.$emit('hide');
      } catch (err: any) {
        const data = err?.response?.data;
        const message = (data as any)?.error || (data as any)?.detail || 'X402 wallet payment failed.';
        ElMessage.error(String(message));
      } finally {
        this.signing = false;
        this.paying = false;
      }
    },
    async fetchSolanaLatestBlockhash(network: string): Promise<string> {
      const { data } = await httpClient.get('/x402/solana/latest-blockhash/', {
        params: { network: network || 'solana' }
      });
      const blockhash = (data as any)?.blockhash;
      if (!blockhash || typeof blockhash !== 'string') {
        throw new Error('Invalid blockhash response');
      }
      return blockhash;
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
        // Always fetch fresh requirements from backend to avoid stale caps
        let requirements = await this.getFreshRequirements();

        if (!requirements) requirements = this.selectedRequirements;
        if (!requirements) {
          const fallback =
            (this.$t && (this.$t('order.message.x402PaymentFailed') as string)) ||
            'X402 wallet payment failed. Please try again later.';
          ElMessage.error(fallback);
          return;
        }

        await this.ensureNetwork();
        if (this.networkMismatch) {
          ElMessage.warning(
            String(
              this.$t?.('order.message.x402SwitchNetwork', {
                network: this.expectedNetworkLabel || this.expectedNetwork
              }) || 'Please switch your wallet network and try again.'
            )
          );
          return;
        }
        const ok = await this.confirmPay(this.expectedNetworkLabel);
        if (!ok) return;
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
        // try to surface backend 402 error body to session for UI
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
        // parent page handles order refresh
      } finally {
        this.signing = false;
        this.paying = false;
      }
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

.x402-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.x402-intro {
  display: flex;
  align-items: center;
  gap: 12px;
}

.x402-intro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex: none;
}

.x402-intro-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}

.x402-wallet {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.x402-wallet-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.x402-network {
  display: flex;
  align-items: center;
  gap: 10px;
}

.x402-network-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.x402-network-group :deep(.el-radio-button__inner) {
  border-color: var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.x402-network-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}

.x402-alert {
  margin-top: 4px;
}

.x402-requirements-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.x402-wallet-card {
  width: 100%;
  max-width: 460px;
  margin: 6px auto 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--el-fill-color-lighter);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
}

.x402-wallet-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.x402-wallet-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.x402-wallet-card-tag {
  margin-left: auto;
  font-size: 12px;
  border: none;
  background: rgba(103, 194, 58, 0.14);
  color: var(--el-color-success);
}

.x402-wallet-card-sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.x402-wallet-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.x402-wallet-card-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.x402-wallet-card-actions :deep(.el-button) {
  min-width: 170px;
}

.x402-wallet-card-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.x402-actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.x402-steps {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
}

.x402-steps-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.x402-steps-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.x402-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.x402-step-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  flex: none;
  margin-top: 1px;
}

.x402-step-text {
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}

.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.wallet-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.wallet-list-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wallet-list-item:hover:not(:disabled) {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
}

.wallet-list-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--el-bg-color);
  object-fit: contain;
  flex: none;
}

.wallet-list-name {
  flex: 1;
  text-align: left;
  font-size: 14px;
  color: var(--el-text-color-primary);
  min-width: 0;
}

.wallet-list-status {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
  flex: none;
}

@media (max-width: 480px) {
  .x402-wallet-card-actions :deep(.el-button) {
    min-width: 100%;
  }
}
</style>
