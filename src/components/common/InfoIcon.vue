<template>
  <el-tooltip effect="dark" :content="content" placement="top">
    <semantic-info-icon
      class="info-icon inline-block size-4 cursor-pointer text-[var(--el-text-color-placeholder)]"
      size="1em"
      aria-hidden="true"
      focusable="false"
    />
  </el-tooltip>
</template>

<script lang="ts">
import { InfoIcon as SemanticInfoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'InfoIcon',
  components: {
    SemanticInfoIcon,
    ElTooltip
  },
  props: {
    content: {
      type: String,
      required: true
    }
  }
});
</script>

<style lang="scss" scoped>
.info-icon {
  flex: 0 0 auto;
  margin-inline-start: 6px;
}
</style>
