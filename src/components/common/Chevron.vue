<template>
  <font-awesome-icon :icon="icon" class="icon" />
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

<style lang="scss" scoped>
.icon {
  font-size: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  padding: 5px 6px;
  cursor: pointer;
  background-color: inherit;
  color: var(--el-text-color-primary);
}
</style>
