<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('order.message.x402ConnectWallet')"
    width="420px"
    align-center
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="wallet-list">
      <button
        v-for="wallet in wallets"
        :key="wallet.adapter.name"
        class="wallet-list-item"
        :disabled="connecting"
        @click="$emit('select', wallet)"
      >
        <img
          v-if="wallet.adapter.icon"
          class="wallet-list-icon"
          :src="wallet.adapter.icon"
          :alt="wallet.adapter.name"
        />
        <span class="wallet-list-name">{{ wallet.adapter.name }}</span>
        <span v-if="wallet.readyState === 'Installed'" class="wallet-list-status">
          {{ $t('order.message.x402WalletStatusDetected') }}
        </span>
      </button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';

export default defineComponent({
  name: 'SolanaWalletPickerDialog',
  components: { ElDialog },
  props: {
    modelValue: { type: Boolean, required: true },
    wallets: { type: Array as () => any[], default: () => [] },
    connecting: { type: Boolean, default: false }
  },
  emits: ['select', 'update:modelValue']
});
</script>

<style scoped>
.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.wallet-list-item:disabled {
  cursor: wait;
  opacity: 0.6;
}

.wallet-list-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.wallet-list-name {
  flex: 1;
  text-align: left;
}

.wallet-list-status {
  color: var(--el-color-success);
  font-size: 12px;
}
</style>
