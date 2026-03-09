<template>
  <font-awesome-icon
    :icon="icon"
    class="icon text-[12px] rounded-full py-[5px] px-[6px] cursor-pointer bg-[var(--el-fill-color-lighter)] text-[var(--el-text-color-primary)] shadow-sm"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'Chevron',
  components: {
    FontAwesomeIcon
  },
  props: {
    direction: {
      type: String,
      default: 'right'
    }
  },
  computed: {
    icon(): string {
      return `fa-solid fa-chevron-${this.direction}`;
    }
  }
});
</script>
