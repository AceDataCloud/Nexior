<template>
  <div class="continuous-payment">
    <el-radio-group v-if="!continuousOnly" v-model="method" size="small">
      <el-radio-button value="confirm">{{ $t('common.x402Scenario.payEachTime') }}</el-radio-button>
      <el-radio-button value="continuous">{{ $t('common.x402Scenario.continuousPayments') }}</el-radio-button>
    </el-radio-group>

    <template v-if="method === 'continuous'">
      <p class="description">{{ $t('common.x402Scenario.continuousPaymentsDescription') }}</p>
      <template v-if="activeAuthorization">
        <div class="details">
          <span>{{ $t('common.x402Scenario.dailyPaymentLimit') }}</span>
          <strong>{{ formatAtomicUsdc(activeAuthorization.daily_limit_atomic) }} USDC</strong>
          <span>{{ $t('common.x402Scenario.validUntil') }}</span>
          <strong>{{ formatDate(activeAuthorization.expires_at) }}</strong>
        </div>
        <div class="actions">
          <el-button :loading="busy" @click="onDisable">
            {{ $t('common.x402Scenario.disableContinuousPayments') }}
          </el-button>
          <el-button type="danger" plain :loading="busy" @click="onRevoke">
            {{ $t('common.x402Scenario.revokeAuthorization') }}
          </el-button>
        </div>
      </template>
      <template v-else>
        <div class="form">
          <label>
            <span>{{ $t('common.x402Scenario.dailyPaymentLimit') }}</span>
            <el-input-number v-model="dailyLimit" :min="0.1" :max="100" :step="0.1" />
          </label>
          <label>
            <span>{{ $t('common.x402Scenario.validDays') }}</span>
            <el-input-number v-model="validDays" :min="1" :max="365" />
          </label>
        </div>
        <el-button type="primary" :loading="busy" @click="onEnable">
          {{ $t('common.x402Scenario.enableContinuousPayments') }}
        </el-button>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Connection } from '@solana/web3.js';
import { ElButton, ElInputNumber, ElMessage, ElRadioButton, ElRadioGroup } from 'element-plus';
import { formatAtomicUsdc } from '@/operators/x402';
import {
  continuousPaymentAuthorization,
  disableContinuousPayment,
  enableContinuousPayment,
  enableExistingContinuousPayment,
  revokeContinuousPayment,
  selectContinuousPayment
} from '@/utils/x402/continuousPayment';

const connection = new Connection(
  import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

export default defineComponent({
  name: 'ContinuousPaymentCard',
  components: { ElButton, ElInputNumber, ElRadioButton, ElRadioGroup },
  props: {
    continuousOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      method: (this.continuousOnly ? 'continuous' : 'confirm') as 'confirm' | 'continuous',
      dailyLimit: 2,
      validDays: 30,
      busy: false
    };
  },
  computed: {
    activeAuthorization() {
      const value = continuousPaymentAuthorization();
      return value?.state === 'active' ? value : undefined;
    },
    disabledAuthorization() {
      const value = continuousPaymentAuthorization();
      return value?.state === 'disabled' ? value : undefined;
    },
    token(): string | undefined {
      return this.$store.state.token.access;
    }
  },
  watch: {
    method: {
      immediate: true,
      handler(value: 'confirm' | 'continuous') {
        selectContinuousPayment(value === 'continuous');
      }
    },
    activeAuthorization: {
      immediate: true,
      handler(value) {
        if (value) this.method = 'continuous';
      }
    }
  },
  methods: {
    formatAtomicUsdc,
    formatDate(value: string) {
      return new Date(value).toLocaleDateString();
    },
    async onEnable() {
      const walletApi = (this as any).$wallet;
      if (!this.token) return;
      this.busy = true;
      try {
        if (this.disabledAuthorization) {
          await enableExistingContinuousPayment(this.token);
          ElMessage.success(String(this.$t('common.x402Scenario.continuousPaymentsEnabled')));
          return;
        }
        await enableContinuousPayment({
          token: this.token,
          walletApi,
          connection,
          dailyLimitAtomic: String(Math.round(this.dailyLimit * 1_000_000)),
          expiryTs: Math.floor(Date.now() / 1000) + this.validDays * 86_400
        });
        ElMessage.success(String(this.$t('common.x402Scenario.continuousPaymentsEnabled')));
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || error?.message || String(error));
      } finally {
        this.busy = false;
      }
    },
    async onDisable() {
      if (!this.token) return;
      this.busy = true;
      try {
        await disableContinuousPayment(this.token);
        this.method = 'confirm';
      } finally {
        this.busy = false;
      }
    },
    async onRevoke() {
      const walletApi = (this as any).$wallet;
      if (!this.token) return;
      this.busy = true;
      try {
        await revokeContinuousPayment(this.token, walletApi, connection);
        this.method = 'confirm';
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.detail || error?.message || String(error));
      } finally {
        this.busy = false;
      }
    }
  }
});
</script>

<style scoped lang="scss">
.continuous-payment {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.description {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}
.form,
.details {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
}
.form label {
  display: contents;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
