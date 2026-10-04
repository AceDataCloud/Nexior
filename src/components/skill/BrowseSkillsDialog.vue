<template>
  <el-dialog
    append-to-body
    :model-value="modelValue"
    width="min(1060px, 94vw)"
    :title="$t('skill.marketplace.title')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="market-dialog-content">
      <skill-marketplace v-if="modelValue" :site-id="siteId" compact @installed="$emit('installed', $event)" />
    </div>
  </el-dialog>
</template>
<script setup lang="ts">
import { ElDialog } from 'element-plus';
import SkillMarketplace from './SkillMarketplace.vue';
defineProps<{ modelValue: boolean; siteId?: string }>();
defineEmits<{ 'update:modelValue': [value: boolean]; installed: [id: string] }>();
</script>
<style scoped>
.market-dialog-content {
  max-height: 75vh;
  overflow-y: auto;
  padding: 2px;
}
</style>
