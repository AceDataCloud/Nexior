<template>
  <div v-if="value !== null && value !== undefined" class="text-center text-[var(--el-text-color-secondary)] mb-1">
    <span class="inline-flex items-center justify-center gap-1 text-xs">
      <credits-icon
        class="text-[var(--el-color-primary-light-3)]"
        :size="'1em' as any"
        aria-hidden="true"
        focusable="false"
      />
      <span class="font-medium">
        {{ formattedValue }}
        {{ $t(`service.unit.${service?.unit || 'credits'}`) }}<template v-if="rateUnit">/{{ rateUnit }}</template>
      </span>
    </span>
    <div v-if="note" class="text-[10px] leading-tight mt-0.5 opacity-80">{{ note }}</div>
  </div>
</template>

<script lang="ts">
import { CreditsIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { IService } from '@/models';

export default defineComponent({
  name: 'Consumption',
  components: {
    CreditsIcon
  },
  props: {
    value: {
      type: Number,
      required: false,
      default: null
    },
    service: {
      type: Object as () => IService | undefined,
      required: true
    },
    // When set, renders the price as a per-unit rate (e.g. "1.20 Credit/second").
    rateUnit: {
      type: String,
      required: false,
      default: ''
    },
    // Optional muted hint shown below the price (e.g. "billed by output length").
    note: {
      type: String,
      required: false,
      default: ''
    }
  },
  computed: {
    formattedValue(): string {
      if (this.value > 0 && this.value < 0.0001) {
        return '<0.0001';
      }
      if (this.value < 0.01) {
        return this.value.toFixed(4);
      }
      return this.value.toFixed(2);
    }
  }
});
</script>
