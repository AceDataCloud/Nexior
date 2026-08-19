<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    append-to-body
    class="service-pricing-dialog"
    @close="$emit('update:visible', false)"
  >
    <p class="pricing-description">{{ $t('service.message.pricingDescription') }}</p>

    <el-skeleton v-if="!service" :rows="4" animated />
    <el-empty v-else-if="!rows.length" :description="$t('service.message.noPricing')" />
    <div v-else class="pricing-table-wrap">
      <el-table :data="rows" stripe :class="['pricing-table', { 'pricing-table--compact': compactTable }]">
        <el-table-column :label="$t('service.field.conditions')" min-width="250">
          <template #default="{ row }">
            <div v-if="row.conditions.length" class="condition-list">
              <el-tag
                v-for="(condition, index) in row.conditions"
                :key="`${row.id}-${condition.field}-${index}`"
                type="info"
                effect="plain"
                class="condition-tag"
              >
                {{ formatCondition(condition) }}
              </el-tag>
            </div>
            <span v-else class="muted">{{ $t('service.message.allRequests') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="showBillingMethod" :label="$t('service.field.billingMethod')" min-width="130">
          <template #default="{ row }">{{ billingLabel(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('service.field.price')" min-width="150">
          <template #default="{ row }">
            <span class="price-value">{{ priceLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="showRemarks" :label="$t('service.field.remark')" min-width="180">
          <template #default="{ row }">
            <span class="remark">{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElDialog, ElEmpty, ElSkeleton, ElTable, ElTableColumn, ElTag } from 'element-plus';
import type { IService } from '@/models';

const TRANSLATED_CONDITION_FIELDS = new Set([
  'model',
  'action',
  'scenario',
  'resolution',
  'duration',
  'mode',
  'quality',
  'number',
  'count',
  'referenceVideo',
  'version',
  'hd',
  'styleReference',
  'moodboard',
  'generateAudio'
]);
const TRANSLATED_UNITS = new Set(['Credit', 'credits', 'Count', 'Second', 'Token', 'MB', 'GB']);
import {
  formatCredits,
  normalizeServicePricing,
  type PricingCondition,
  type ServicePricingRow
} from '@/utils/servicePricing';

export default defineComponent({
  name: 'ServicePricingDialog',
  components: { ElDialog, ElEmpty, ElSkeleton, ElTable, ElTableColumn, ElTag },
  props: {
    visible: { type: Boolean, required: true },
    service: { type: Object as PropType<IService | undefined>, default: undefined }
  },
  emits: ['update:visible'],
  computed: {
    rows(): ServicePricingRow[] {
      return normalizeServicePricing(this.service?.cost);
    },
    dialogTitle(): string {
      const title = this.service?.title;
      return title ? this.$t('service.title.pricingFor', { service: title }) : this.$t('service.title.pricing');
    },
    showBillingMethod(): boolean {
      return new Set(this.rows.map((row) => row.billingKind)).size > 1;
    },
    showRemarks(): boolean {
      return this.rows.some((row) => Boolean(row.remark));
    },
    compactTable(): boolean {
      return !this.showBillingMethod && !this.showRemarks;
    },
    dialogWidth(): string {
      return this.compactTable ? 'min(680px, calc(100vw - 24px))' : 'min(880px, calc(100vw - 24px))';
    }
  },
  methods: {
    fieldLabel(field: string): string {
      if (!field) return this.$t('service.message.otherConfigurations');
      return TRANSLATED_CONDITION_FIELDS.has(field)
        ? this.$t(`service.condition.${field}`)
        : field.replaceAll('_', ' ');
    },
    formatCondition(condition: PricingCondition): string {
      if (condition.operator === 'other') return this.$t('service.message.otherConfigurations');
      if (condition.operator === 'anyOf') {
        return this.$t('service.operator.anyOf', {
          options: (condition.options || []).map((option) => this.formatCondition(option)).join('; ')
        });
      }
      return this.$t(`service.operator.${condition.operator}`, {
        field: this.fieldLabel(condition.field),
        value: condition.value === 'required' ? this.$t('service.message.required') : condition.value
      });
    },
    billingLabel(row: ServicePricingRow): string {
      return this.$t(`service.billing.${row.billingKind}`);
    },
    unitLabel(row: ServicePricingRow): string {
      const unit = row.unit || row.rateField;
      if (!unit) return '';
      return TRANSLATED_UNITS.has(unit) ? this.$t(`service.unit.${unit}`) : unit.replaceAll('_', ' ');
    },
    priceLabel(row: ServicePricingRow): string {
      if (row.billingKind === 'free') return this.$t('service.message.free');
      if (row.billingKind === 'calculated' || row.amount === undefined) {
        return this.$t('service.message.calculated');
      }
      const amount = formatCredits(row.amount);
      const unit = this.unitLabel(row);
      if (row.billingKind === 'linear' || unit) {
        return this.$t('service.message.creditsPerUnit', { amount, unit });
      }
      return this.$t('service.message.creditsAmount', { amount });
    }
  }
});
</script>

<style scoped>
.pricing-description {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.pricing-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.pricing-table {
  min-width: 720px;
}

.pricing-table--compact {
  min-width: 480px;
}

.condition-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.condition-tag {
  max-width: 100%;
  height: auto;
  min-height: 24px;
  white-space: normal;
  text-align: start;
  line-height: 1.35;
  padding-block: 3px;
}

.price-value {
  color: var(--el-color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.muted,
.remark {
  color: var(--el-text-color-secondary);
}
</style>
