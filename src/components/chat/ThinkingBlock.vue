<template>
  <div class="thinking-block">
    <div class="thinking-header" @click="collapsed = !collapsed">
      <el-icon :class="{ 'rotate-90': !collapsed }"><ArrowRight /></el-icon>
      <span class="thinking-label">Thinking...</span>
    </div>
    <div v-show="!collapsed" class="thinking-content">
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ThinkingBlock',
  components: { ArrowRight },
  props: {
    content: { type: String, required: true }
  },
  setup() {
    const collapsed = ref(true);
    return { collapsed };
  }
});
</script>

<style scoped>
.thinking-block {
  margin: 8px 0;
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
}
.thinking-header {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 13px;
}
.thinking-content pre {
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 6px;
}
.rotate-90 {
  transform: rotate(90deg);
}
</style>
