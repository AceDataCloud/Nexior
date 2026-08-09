<template>
  <div class="status">
    <el-dialog v-model="visible" class="mt-12" width="450px">
      <el-tabs v-if="x402Enabled" v-model="paymentMode" class="payment-tabs">
        <el-tab-pane :label="$t('common.x402Scenario.credits')" name="credits" />
        <el-tab-pane :label="$t('common.x402Scenario.wallet')" name="wallet" />
      </el-tabs>

      <div v-if="paymentMode === 'credits' && application">
        <p class="text-center mb-4">
          {{ $t('application.message.applicationSelection') }}
        </p>
        <div class="flex flex-col gap-4 mb-6 overflow-y-auto">
          <application-info
            v-for="(app, index) in applications"
            :key="index"
            :class="{
              item: true,
              active: application?.id === app.id
            }"
            :application="app"
            show-id
            @click="onSelectApplication(app)"
            @usage="onGoUsage(app)"
            @buy="onBuyMore(app)"
          />
        </div>
      </div>

      <div v-else-if="paymentMode === 'wallet'" class="wallet-mode">
        <el-radio-group v-model="walletRail" size="small">
          <el-radio-button value="base">Base</el-radio-button>
          <el-radio-button value="solana">Solana</el-radio-button>
        </el-radio-group>
        <template v-if="walletRail === 'base'">
          <template v-if="evmAddress">
            <div class="wallet-connected">
              <el-tag type="success">{{ $t('order.message.x402WalletConnected') }}</el-tag>
              <span class="wallet-address">{{ shortEvmAddress }}</span>
            </div>
            <el-button @click="disconnectEvmWallet">{{ $t('coin.button.disconnect') }}</el-button>
          </template>
          <el-button v-else type="primary" @click="openEvmWalletPicker">
            {{ $t('order.message.x402ConnectWallet') }}
          </el-button>
        </template>
        <template v-else>
          <template v-if="solanaConnected && solanaAddress">
            <div class="wallet-connected">
              <el-tag type="success">{{ $t('order.message.x402WalletConnected') }}</el-tag>
              <span class="wallet-address">{{ shortSolanaAddress }}</span>
            </div>
            <el-button @click="disconnectSolanaWallet">{{ $t('coin.button.disconnect') }}</el-button>
            <continuous-payment-card v-if="authenticated" :continuous-only="scenario === 'chat'" />
          </template>
          <el-button v-else type="primary" @click="walletPickerVisible = true">
            {{ $t('order.message.x402ConnectWallet') }}
          </el-button>
        </template>
        <p class="wallet-hint">{{ $t('common.x402Scenario.quoteBeforeSigning') }}</p>
      </div>
    </el-dialog>
    <el-dialog v-model="evmWalletPickerVisible" title="Base" width="420px">
      <div class="flex flex-col gap-2">
        <el-button v-for="wallet in evmWallets" :key="wallet.id" @click="connectEvmWallet(wallet)">
          {{ wallet.name }}
        </el-button>
        <p v-if="!evmWallets.length" class="wallet-hint">{{ $t('order.message.x402ConnectWallet') }}</p>
      </div>
    </el-dialog>
    <solana-wallet-picker-dialog
      v-model="walletPickerVisible"
      :wallets="solanaWallets"
      :connecting="walletConnecting"
      @select="connectSolanaWallet"
    />
    <button type="button" class="entry" :title="balanceTitle" @click="visible = true">
      <wallet-icon class="entry-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
      <span class="entry-amount">{{ balanceText }}</span>
      <span class="entry-unit">{{ balanceUnit }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { WalletIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, nextTick } from 'vue';
import { ElButton, ElDialog, ElMessage, ElRadioButton, ElRadioGroup, ElTabPane, ElTabs, ElTag } from 'element-plus';
import { IApplicationType, IApplication, IService } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_USAGE_LIST } from '@/router';
import ApplicationInfo from './Info.vue';
import ContinuousPaymentCard from './ContinuousPaymentCard.vue';
import SolanaWalletPickerDialog from '@/components/common/SolanaWalletPickerDialog.vue';
import { isNative } from '@/utils';
import {
  isScenarioX402Enabled,
  scenarioPaymentState,
  setScenarioPaymentMode,
  type ScenarioPaymentMode
} from '@/utils/x402/scenarioPayment';
import { refreshContinuousPaymentAuthorization } from '@/utils/x402/continuousPayment';
import {
  activeEvmWallet,
  activeWalletRail,
  connectBaseWallet,
  discoverEvmWallets,
  setActiveEvmWallet,
  setActiveWalletRail,
  type EvmWalletInfo
} from '@/utils/x402/evmWallet';
export interface IData {
  visible: boolean;
  walletPickerVisible: boolean;
  evmWalletPickerVisible: boolean;
  evmWallets: EvmWalletInfo[];
  walletConnecting: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApplicationStatus',
  components: {
    WalletIcon,
    ElButton,
    ElDialog,
    ElRadioButton,
    ElRadioGroup,
    ElTabPane,
    ElTabs,
    ElTag,
    ApplicationInfo,
    ContinuousPaymentCard,
    SolanaWalletPickerDialog
  },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      default: undefined
    },
    applications: {
      type: Array as () => IApplication[] | undefined,
      default: undefined
    },
    service: {
      type: Object as () => IService | undefined,
      required: true
    },
    scenario: {
      type: String,
      default: undefined
    }
  },
  emits: ['select'],
  data(): IData {
    return {
      visible: false,
      walletPickerVisible: false,
      evmWalletPickerVisible: false,
      evmWallets: [],
      walletConnecting: false,
      applicationType: IApplicationType
    };
  },
  computed: {
    x402Enabled(): boolean {
      return Boolean(this.scenario) && isScenarioX402Enabled();
    },
    paymentMode: {
      get(): ScenarioPaymentMode {
        return this.scenario ? scenarioPaymentState(this.scenario).mode : 'credits';
      },
      set(value: ScenarioPaymentMode) {
        if (!this.scenario) return;
        setScenarioPaymentMode(this.scenario, value);
        if (value === 'wallet') setActiveWalletRail(this.walletRail);
        if (value === 'wallet' && this.walletRail === 'base' && !this.evmAddress) void this.openEvmWalletPicker();
        if (value === 'wallet' && this.walletRail === 'solana' && !this.solanaConnected)
          this.walletPickerVisible = true;
      }
    },
    walletRail: {
      get(): 'base' | 'solana' {
        return activeWalletRail();
      },
      set(value: 'base' | 'solana') {
        setActiveWalletRail(value);
        if (value === 'base' && !this.evmAddress) void this.openEvmWalletPicker();
        if (value === 'solana' && !this.solanaConnected) this.walletPickerVisible = true;
      }
    },
    evmAddress(): string | undefined {
      return activeEvmWallet()?.address;
    },
    shortEvmAddress(): string {
      const address = this.evmAddress || '';
      return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
    },
    solanaConnected(): boolean {
      return Boolean((this as any).$wallet?.connected?.value);
    },
    solanaAddress(): string | undefined {
      return (this as any).$wallet?.publicKey?.value?.toBase58?.();
    },
    shortSolanaAddress(): string {
      const address = this.solanaAddress || '';
      return address ? `${address.slice(0, 6)}…${address.slice(-6)}` : '';
    },
    solanaWallets(): any[] {
      const wallets = (this as any).$wallet?.wallets?.value || [];
      const weight = (state: string) => (state === 'Installed' ? 0 : state === 'Loadable' ? 1 : 2);
      return [...wallets].sort((a, b) => weight(a.readyState) - weight(b.readyState));
    },
    authenticated() {
      return !!this.$store.state.token.access;
    },
    user() {
      return this.$store.state.user;
    },
    balanceAmount(): number {
      return Number(this.application?.remaining_amount ?? 0);
    },
    balanceUnit(): string {
      if (this.paymentMode === 'wallet') return this.walletConnected ? '' : this.$t('common.x402Scenario.wallet');
      const unit = this.application?.service?.unit || 'credit';
      const key = `service.unit.${unit}` + (this.balanceAmount === 1 ? '' : 's');
      return this.$t(key);
    },
    walletConnected(): boolean {
      return this.walletRail === 'base' ? Boolean(this.evmAddress) : this.solanaConnected;
    },
    balanceText(): string {
      if (this.paymentMode === 'wallet') {
        return this.walletRail === 'base' ? this.shortEvmAddress : this.solanaConnected ? this.shortSolanaAddress : '';
      }
      const value = this.balanceAmount;
      if (!Number.isFinite(value)) return '0';
      if (value >= 1000) return Math.round(value).toLocaleString();
      if (value >= 100) return value.toFixed(1);
      return value.toFixed(2);
    },
    balanceTitle(): string {
      return `${this.balanceText} ${this.balanceUnit}`.trim();
    }
  },
  watch: {
    visible(value: boolean) {
      if (value && this.authenticated)
        void refreshContinuousPaymentAuthorization(this.$store.state.token.access).catch(() => undefined);
    }
  },
  methods: {
    async openEvmWalletPicker() {
      this.evmWallets = await discoverEvmWallets();
      this.evmWalletPickerVisible = true;
    },
    async connectEvmWallet(wallet: EvmWalletInfo) {
      if (this.walletConnecting) return;
      this.walletConnecting = true;
      try {
        await connectBaseWallet(wallet.provider);
        setActiveWalletRail('base');
        this.evmWalletPickerVisible = false;
      } catch (error) {
        console.warn('Base wallet connect failed', error);
        ElMessage.error(String(this.$t('coin.message.connectError')));
      } finally {
        this.walletConnecting = false;
      }
    },
    disconnectEvmWallet() {
      setActiveEvmWallet(undefined);
    },
    async connectSolanaWallet(wallet: any) {
      const walletApi = (this as any).$wallet;
      const adapterName = wallet?.adapter?.name;
      if (!walletApi || !adapterName || this.walletConnecting) return;
      this.walletConnecting = true;
      try {
        walletApi.select(adapterName);
        await nextTick();
        await walletApi.connect();
        setActiveWalletRail('solana');
        this.walletPickerVisible = false;
      } catch (error) {
        console.warn('wallet connect failed', error);
        ElMessage.error(String(this.$t('coin.message.connectError')));
      } finally {
        this.walletConnecting = false;
      }
    },
    async disconnectSolanaWallet() {
      await (this as any).$wallet?.disconnect?.();
    },
    onGoUsage(application: IApplication) {
      const target = { name: ROUTE_CONSOLE_USAGE_LIST, query: { application_id: application.id } };
      // window.open('_blank') is a no-op inside the iOS/Android webview; navigate in-app.
      if (isNative()) {
        this.visible = false;
        this.$router.push(target);
        return;
      }
      window.open(this.$router.resolve(target).href, '_blank');
    },
    onBuyMore(application: IApplication) {
      const target = { name: ROUTE_CONSOLE_APPLICATION_EXTRA, params: { id: application.id } };
      // window.open('_blank') is a no-op inside the iOS/Android webview; navigate in-app.
      if (isNative()) {
        this.visible = false;
        this.$router.push(target);
        return;
      }
      window.open(this.$router.resolve(target).href, '_blank');
    },
    onSelectApplication(application: IApplication) {
      this.$emit('select', application);
    }
  }
});
</script>

<style lang="scss" scoped>
.payment-tabs {
  margin-top: -12px;
}

.wallet-mode {
  display: flex;
  min-height: 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.wallet-connected {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wallet-address {
  color: var(--el-text-color-regular);
  font-family: monospace;
}

.wallet-hint {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
}

.entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color));
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  // Ensure clicks work when this pill sits inside the desktop drag region.
  -webkit-app-region: no-drag;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
  appearance: none;
  outline: none;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--app-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.08));
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-7, rgba(64, 158, 255, 0.2));
  }
}

.entry-icon {
  font-size: 13px;
  color: var(--el-color-primary);
}

.entry-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.entry-unit {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .entry {
    padding: 0 10px;
    height: 30px;
  }

  .entry-unit {
    display: none;
  }
}
</style>
