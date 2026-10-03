<template>
  <el-button
    class="refresh-button"
    :circle="!showLabel"
    :round="showLabel"
    :loading="loading"
    :title="resolvedLabel"
    :aria-label="resolvedLabel"
    :aria-busy="loading"
  >
    <template #icon><refresh-icon size="1em" aria-hidden="true" focusable="false" /></template>
    <template v-if="showLabel" #default>{{ resolvedLabel }}</template>
  </el-button>
</template>

<script lang="ts">
import { RefreshIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';

export default defineComponent({
  name: 'RefreshButton',
  components: { ElButton, RefreshIcon },
  props: {
    loading: { type: Boolean, default: false },
    label: { type: String, default: '' },
    showLabel: { type: Boolean, default: false }
  },
  computed: {
    resolvedLabel(): string {
      return this.label || this.$t('common.button.refresh');
    }
  }
});
</script>

<style scoped>
.refresh-button {
  flex-shrink: 0;
}
</style>
