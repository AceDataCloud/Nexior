<template>
  <div v-if="showConsumption || showPricing" class="pricing-summary">
    <div class="pricing-summary__line">
      <consumption
        v-if="showConsumption"
        class="pricing-summary__consumption"
        :value="value"
        :service="service"
        :rate-unit="rateUnit"
        :note="''"
      />
      <span v-if="showConsumption && value !== null && value !== undefined && showPricing" aria-hidden="true">·</span>
      <button v-if="showPricing" type="button" class="pricing-summary__button" @click="dialogVisible = true">
        {{ $t('service.button.pricing') }}
      </button>
    </div>
    <div v-if="showConsumption && note" class="pricing-summary__note">{{ note }}</div>
    <service-pricing-dialog
      v-if="showPricing"
      v-model:visible="dialogVisible"
      :service="service"
      :pricing-models="pricingModels"
      :pricing-model-default="pricingModelDefault"
      :pricing-unit-aliases="pricingUnitAliases"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { IService } from '@/models';
import { filterServicePricingRows, filterServicePricingRules, normalizeServicePricing } from '@/utils/servicePricing';
import { isIOS } from '@/utils/surface';
import Consumption from './Consumption.vue';
import ServicePricingDialog from './ServicePricingDialog.vue';

export default defineComponent({
  name: 'ServicePricingSummary',
  components: { Consumption, ServicePricingDialog },
  props: {
    value: { type: Number, default: null },
    service: { type: Object as PropType<IService | undefined>, default: undefined },
    showConsumption: { type: Boolean, default: true },
    rateUnit: { type: String, default: '' },
    note: { type: String, default: '' },
    pricingModels: { type: Array as PropType<string[]>, default: undefined },
    pricingModelDefault: { type: String, default: undefined },
    pricingUnitAliases: { type: Object as PropType<Record<string, string>>, default: () => ({}) }
  },
  data() {
    return { dialogVisible: false };
  },
  computed: {
    showPricing(): boolean {
      const rules = filterServicePricingRules(this.service?.cost, this.pricingModels, this.pricingModelDefault);
      const rows = filterServicePricingRows(normalizeServicePricing(rules), this.pricingModels);
      return !isIOS() && rows.length > 0;
    }
  }
});
</script>

<style scoped>
.pricing-summary {
  width: 100%;
  margin-block-end: 4px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.pricing-summary__line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 20px;
  font-size: 12px;
}

.pricing-summary__consumption {
  margin-block-end: 0;
}

.pricing-summary__button {
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--el-color-primary);
  font: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.pricing-summary__button:hover,
.pricing-summary__button:focus-visible {
  color: var(--el-color-primary-light-3);
}

.pricing-summary__button:focus-visible {
  outline: 2px solid var(--el-color-primary-light-5);
  outline-offset: 2px;
  border-radius: 2px;
}

.pricing-summary__note {
  margin-block-start: 2px;
  font-size: 10px;
  line-height: 1.25;
  opacity: 0.8;
}
</style>
