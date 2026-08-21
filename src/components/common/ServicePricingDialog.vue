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
      <el-table :data="rows" stripe class="pricing-table" :style="{ minWidth: `${tableMinWidth}px` }">
        <el-table-column
          v-for="(column, index) in conditionColumns"
          :key="column.key"
          :label="column.label"
          min-width="150"
        >
          <template #default="{ row }">
            <span :class="['condition-value', { 'condition-value--primary': index === 0 }]">
              {{ conditionValue(row, column.key) }}
            </span>
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
import { ElDialog, ElEmpty, ElSkeleton, ElTable, ElTableColumn } from 'element-plus';
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
  'generateAudio',
  'motion',
  'template',
  'audio',
  'type',
  'size',
  'promptTokens',
  'characterOrientation'
]);

const CONDITION_FIELD_ALIASES: Record<string, string> = {
  model_name: 'model',
  pricing_version: 'version',
  style_reference: 'styleReference',
  generate_audio: 'generateAudio',
  template_id: 'template',
  prompt_tokens: 'promptTokens',
  character_orientation: 'characterOrientation'
};
const TRANSLATED_UNITS = new Set(['Credit', 'credits', 'Count', 'Second', 'Token', 'MB', 'GB', 'image']);
import {
  filterServicePricingRows,
  filterServicePricingRules,
  formatCredits,
  normalizeServicePricing,
  type PricingCondition,
  type ServicePricingRow
} from '@/utils/servicePricing';

export default defineComponent({
  name: 'ServicePricingDialog',
  components: { ElDialog, ElEmpty, ElSkeleton, ElTable, ElTableColumn },
  props: {
    visible: { type: Boolean, required: true },
    service: { type: Object as PropType<IService | undefined>, default: undefined },
    pricingModels: { type: Array as PropType<string[]>, default: undefined },
    pricingModelDefault: { type: String, default: undefined },
    pricingUnitAliases: { type: Object as PropType<Record<string, string>>, default: () => ({}) }
  },
  emits: ['update:visible'],
  computed: {
    rows(): ServicePricingRow[] {
      const rules = filterServicePricingRules(this.service?.cost, this.pricingModels, this.pricingModelDefault);
      return filterServicePricingRows(normalizeServicePricing(rules), this.pricingModels);
    },
    conditionColumns(): { key: string; label: string }[] {
      const fields: string[] = [];
      for (const row of this.rows) {
        for (const condition of row.conditions) {
          const key =
            condition.operator === 'anyOf'
              ? '__anyOf'
              : this.canonicalConditionField(condition.field) || '__additional';
          if (!fields.includes(key)) fields.push(key);
        }
      }
      if (!fields.length) fields.push('__all');
      return fields.map((key) => ({ key, label: this.conditionColumnLabel(key) }));
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
    tableMinWidth(): number {
      return (
        this.conditionColumns.length * 170 + 170 + (this.showBillingMethod ? 140 : 0) + (this.showRemarks ? 180 : 0)
      );
    },
    dialogWidth(): string {
      return `min(${Math.min(Math.max(this.tableMinWidth + 48, 620), 1040)}px, calc(100vw - 24px))`;
    }
  },
  methods: {
    canonicalConditionField(field: string): string {
      return CONDITION_FIELD_ALIASES[field] || field;
    },
    fieldLabel(field: string): string {
      if (!field) return this.$t('service.message.otherConfigurations');
      const canonical = this.canonicalConditionField(field);
      if (TRANSLATED_CONDITION_FIELDS.has(canonical)) return this.$t(`service.condition.${canonical}`);
      return canonical
        .replaceAll('_', ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (character) => character.toUpperCase());
    },
    conditionColumnLabel(key: string): string {
      if (key === '__anyOf') return this.$t('service.condition.anyOf');
      if (key === '__additional') return this.$t('service.message.otherConfigurations');
      if (key === '__all') return this.$t('service.field.conditions');
      return this.fieldLabel(key);
    },
    conditionValue(row: ServicePricingRow, key: string): string {
      if (key === '__all') return '-';
      if (key === '__additional') {
        return row.conditions.some((condition) => condition.operator === 'other')
          ? this.$t('service.message.required')
          : '-';
      }
      if (key === '__anyOf') {
        const group = row.conditions.find((condition) => condition.operator === 'anyOf');
        return group ? (group.options || []).map((option) => this.formatCondition(option)).join('; ') : '-';
      }
      const condition = row.conditions.find(
        (item) => this.canonicalConditionField(item.field) === key && item.operator !== 'anyOf'
      );
      if (!condition) return '-';
      const value = condition.value === 'required' ? this.$t('service.message.required') : condition.value;
      const operators: Partial<Record<PricingCondition['operator'], string>> = {
        atMost: '≤ ',
        lessThan: '< ',
        atLeast: '≥ ',
        greaterThan: '> '
      };
      return `${operators[condition.operator] || ''}${value}`;
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
      const rawUnit = row.unit || row.rateField;
      const unit = rawUnit ? this.pricingUnitAliases[rawUnit] || rawUnit : '';
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

.condition-value {
  display: block;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: anywhere;
}

.condition-value--primary {
  font-weight: 600;
}

.price-value {
  color: var(--el-text-color-regular);
  font-weight: 400;
  font-size: 13px;
  white-space: nowrap;
}

.muted,
.remark {
  color: var(--el-text-color-secondary);
}
</style>
