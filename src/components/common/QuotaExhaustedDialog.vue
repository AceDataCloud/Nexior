<template>
  <el-dialog
    :model-value="modelValue"
    class="quota-exhausted-dialog"
    :title="$t('common.quotaDialog.title')"
    :width="dialogWidth"
    append-to-body
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p class="quota-message">{{ $t('common.quotaDialog.message') }}</p>
    <dl class="quota-details">
      <div v-if="hasEstimatedConsumption" class="quota-row">
        <dt>{{ $t('common.quotaDialog.estimatedConsumption') }}</dt>
        <dd>{{ formatCredits(estimatedConsumption) }} {{ unitLabel }}</dd>
      </div>
      <div class="quota-row">
        <dt>{{ $t('common.quotaDialog.availableCredits') }}</dt>
        <dd v-if="balanceState === 'refreshing'" class="quota-muted">
          <el-icon class="is-loading"><loading /></el-icon>
          {{ $t('common.quotaDialog.refreshing') }}
        </dd>
        <dd v-else-if="balanceState === 'current'">{{ formatCredits(availableCredits) }} {{ unitLabel }}</dd>
        <dd v-else class="quota-muted">{{ $t('common.quotaDialog.unavailable') }}</dd>
      </div>
    </dl>
    <template #footer>
      <div class="quota-actions">
        <el-button @click="$emit('update:modelValue', false)">{{ $t('common.button.cancel') }}</el-button>
        <el-button v-if="canTopUp" type="primary" @click="$emit('topUp')">
          {{ $t('common.quotaDialog.topUp') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

export type QuotaBalanceState = 'refreshing' | 'current' | 'unavailable';

export default defineComponent({
  name: 'QuotaExhaustedDialog',
  components: { ElButton, ElDialog, ElIcon, Loading },
  props: {
    modelValue: { type: Boolean, required: true },
    estimatedConsumption: { type: Number, required: false, default: undefined },
    availableCredits: { type: Number, required: false, default: undefined },
    balanceState: { type: String as () => QuotaBalanceState, required: true },
    unit: { type: String, required: false, default: 'credit' },
    canTopUp: { type: Boolean, required: true }
  },
  emits: ['update:modelValue', 'topUp'],
  computed: {
    dialogWidth(): string {
      return 'min(500px, 94vw)';
    },
    hasEstimatedConsumption(): boolean {
      return Number.isFinite(this.estimatedConsumption);
    },
    unitLabel(): string {
      const unit = this.unit || 'credit';
      return this.$t(`service.unit.${unit.endsWith('s') ? unit : `${unit}s`}`) as string;
    }
  },
  methods: {
    formatCredits(value: number | undefined): string {
      if (value === undefined || !Number.isFinite(value)) return '—';
      return Math.max(0, value).toFixed(2);
    }
  }
});
</script>

<style lang="scss" scoped>
.quota-message {
  margin: 0 0 18px;
  color: var(--el-text-color-regular);
  line-height: 1.65;
}

.quota-details {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.quota-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  dt {
    color: var(--el-text-color-secondary);
  }

  dd {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--el-text-color-primary);
    font-weight: 600;
    text-align: right;
  }
}

.quota-muted {
  color: var(--el-text-color-secondary) !important;
  font-weight: 400 !important;
}

.quota-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 480px) {
  .quota-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;

    dd {
      text-align: left;
    }
  }

  .quota-actions {
    flex-direction: column-reverse;

    :deep(.el-button) {
      width: 100%;
      margin-left: 0;
    }
  }
}
</style>
