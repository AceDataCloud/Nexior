<template>
  <div v-if="value !== null && value !== undefined" class="text-center text-[var(--el-text-color-secondary)] mb-1">
    <font-awesome-icon icon="fa-solid fa-coins" class="text-xs mr-1" />
    <span class="text-xs">
      {{ value }}
      {{ $t(`service.unit.${service?.unit || 'credits'}`) }}
    </span>
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
    }
  }
});
</script>
