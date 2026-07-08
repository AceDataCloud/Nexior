<template>
  <div v-if="value !== null && value !== undefined" class="text-center text-[var(--el-text-color-secondary)] mb-1">
    <font-awesome-icon icon="fa-solid fa-coins" class="text-xs mr-1 text-[var(--el-color-primary-light-3)]" />
    <span class="text-xs font-medium">
      {{ value.toFixed(2) }}
      {{ $t(`service.unit.${service?.unit || 'credits'}`) }}<template v-if="rateUnit">/{{ rateUnit }}</template>
    </span>
    <div v-if="note" class="text-[10px] leading-tight mt-0.5 opacity-80">{{ note }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IService } from '@/models';

export default defineComponent({
  name: 'Consumption',
  components: {
    FontAwesomeIcon
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
  }
});
</script>
