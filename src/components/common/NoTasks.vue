<template>
  <p class="info">{{ $t('common.message.noTasks') }}</p>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NoTasks'
});
</script>

<style lang="scss" scoped>
.info {
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
