<template>
  <el-tooltip effect="dark" :content="$t('common.button.restart')" placement="bottom">
    <button
      type="button"
      class="icon-sync"
      :aria-label="$t('common.button.restart')"
      :title="$t('common.button.restart')"
      @click="onRestart"
    >
      <refresh-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
  </el-tooltip>
</template>

<script lang="ts">
import { RefreshIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    RefreshIcon,
    ElTooltip
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  emits: ['restart'],
  data() {
    return {
      copied: false
    };
  },
  methods: {
    onRestart() {
      this.$emit('restart');
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-sync {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  margin-left: 5px;
  cursor: pointer;
  color: inherit;
}
</style>
