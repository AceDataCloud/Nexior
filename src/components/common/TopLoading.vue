<template>
  <div :class="['top-loading', { floating }]" role="status" aria-live="polite">
    <el-icon class="is-loading" :size="size">
      <loading />
    </el-icon>
    <span>{{ label }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'TopLoading',
  components: {
    ElIcon,
    Loading
  },
  props: {
    text: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 16
    },
    floating: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    label(): string {
      return this.text || (this as any).$t('common.status.loading');
    }
  }
});
</script>

<style lang="scss" scoped>
.top-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: var(--el-text-color-regular);
  pointer-events: none;
  &.floating {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
  }
}
</style>
