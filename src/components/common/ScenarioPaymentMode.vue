<template>
  <section v-if="enabled" class="scenario-payment">
    <div class="scenario-payment-head">
      <span>{{ $t('common.x402Scenario.paymentMethod') }}</span>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button label="credits">{{ $t('common.x402Scenario.credits') }}</el-radio-button>
        <el-radio-button label="wallet">{{ $t('common.x402Scenario.wallet') }}</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="mode === 'wallet'" class="scenario-wallet-row">
      <template v-if="connected && address">
        <span class="scenario-wallet-address">{{ shortAddress }}</span>
        <el-button link size="small" @click="disconnect">{{ $t('coin.button.disconnect') }}</el-button>
      </template>
      <el-button v-else link type="primary" size="small" @click="walletModalVisible = true">
        {{ $t('order.message.x402ConnectWallet') }}
      </el-button>
    </div>
    <p v-if="mode === 'wallet'" class="scenario-payment-note">
      {{ $t('common.x402Scenario.quoteBeforeSigning') }}
    </p>

    <solana-wallet-picker-dialog
      v-model="walletModalVisible"
      :wallets="wallets"
      :connecting="connecting"
      @select="connect"
    />
  </section>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { ElButton, ElMessage, ElRadioButton, ElRadioGroup } from 'element-plus';
import SolanaWalletPickerDialog from './SolanaWalletPickerDialog.vue';
import { isScenarioX402Enabled, scenarioPaymentMode, type ScenarioPaymentMode } from '@/utils/x402/scenarioPayment';

export default defineComponent({
  name: 'ScenarioPaymentMode',
  components: { ElButton, ElRadioButton, ElRadioGroup, SolanaWalletPickerDialog },
  emits: ['change'],
  data() {
    return {
      walletModalVisible: false,
      connecting: false
    };
  },
  computed: {
    enabled(): boolean {
      return isScenarioX402Enabled();
    },
    mode: {
      get(): ScenarioPaymentMode {
        return scenarioPaymentMode.value;
      },
      set(value: ScenarioPaymentMode) {
        scenarioPaymentMode.value = value;
        if (value === 'wallet' && !this.connected) this.walletModalVisible = true;
        this.$emit('change', value);
      }
    },
    connected(): boolean {
      return Boolean((this as any).$wallet?.connected?.value);
    },
    address(): string | undefined {
      return (this as any).$wallet?.publicKey?.value?.toBase58?.();
    },
    shortAddress(): string {
      const address = this.address || '';
      return address ? `${address.slice(0, 6)}…${address.slice(-6)}` : '';
    },
    wallets(): any[] {
      const wallets = (this as any).$wallet?.wallets?.value || [];
      const weight = (state: string) => (state === 'Installed' ? 0 : state === 'Loadable' ? 1 : 2);
      return [...wallets].sort((a, b) => weight(a.readyState) - weight(b.readyState));
    }
  },
  methods: {
    async connect(wallet: any) {
      const walletApi = (this as any).$wallet;
      const adapterName = wallet?.adapter?.name;
      if (!walletApi || !adapterName || this.connecting) return;
      this.connecting = true;
      try {
        walletApi.select(adapterName);
        await nextTick();
        await walletApi.connect();
        this.walletModalVisible = false;
        this.$emit('change', scenarioPaymentMode.value);
      } catch (error) {
        console.warn('wallet connect failed', error);
        ElMessage.error(String(this.$t('coin.message.connectError')));
      } finally {
        this.connecting = false;
      }
    },
    async disconnect() {
      try {
        await (this as any).$wallet?.disconnect?.();
      } finally {
        scenarioPaymentMode.value = 'credits';
        this.$emit('change', 'credits');
      }
    }
  }
});
</script>

<style scoped>
.scenario-payment {
  width: 100%;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.scenario-payment-head,
.scenario-wallet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.scenario-wallet-row {
  margin-top: 8px;
}

.scenario-wallet-address {
  color: var(--el-text-color-regular);
  font-family: monospace;
}

.scenario-payment-note {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}
</style>
